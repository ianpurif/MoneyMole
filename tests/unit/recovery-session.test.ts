import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { BrowserPrivateStore } from "../../src/lib/private-state/indexed-db";
import { RecoverySession } from "../../src/lib/private-state/recovery-session";
import type { OneAmSession } from "../../src/lib/midnight/oneam";
import { readAuth, packageRecovery, preservedWorkspaces } from "../../src/lib/private-state/local-auth";
const walletId = "synthetic-wallet", address = "a".repeat(64), password = "existing synthetic local passphrase";
const namespace = (contractAddress: string, identity = walletId) => ({ network: "preprod" as const, contractAddress, walletIdentity: identity, schemaVersion: 2 });
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  vi.stubGlobal("window", { isSecureContext: true });
  vi.stubGlobal("PublicKeyCredential", class {});
  const credential = () => ({ rawId: new Uint8Array([1, 2, 3]).buffer, getClientExtensionResults: () => ({ prf: { results: { first: new Uint8Array(32).fill(9).buffer } } }) });
  vi.stubGlobal("navigator", { credentials: { create: vi.fn(async () => credential()), get: vi.fn(async () => credential()) } });
});
function fakeWallet() {
  return {
    preparePaymentDeployment: vi.fn(async (secret: string, identity = walletId) => {
      const store = await BrowserPrivateStore.unlock(namespace("night-payment-deployment-staging-v2", identity), secret);
      return { review: () => ({ address, phase: "finalized" }), lock: () => store.lock() };
    }),
    openPayments: vi.fn(async (contract: string, secret: string, identity = walletId) => {
      const ns = namespace(contract, identity), store = await BrowserPrivateStore.unlock(ns, secret, !await BrowserPrivateStore.exists(ns));
      return { contract, asset: "synthetic", list: () => store.keys(), lock: () => store.lock() };
    }),
  };
}
describe("shared recovery session with real encrypted local stores, synthetic wallet only", () => {
  it("logs in with an enrolled passkey without the phrase, then accepts a replacement phrase", async () => {
    const recovery = new RecoverySession(fakeWallet() as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.unlockWithPassphrase(password); await recovery.continueWithPasskey();
    recovery.lock(); await recovery.continueWithPasskey();
    expect(recovery.authenticated).toBe(true); expect(navigator.credentials.get).toHaveBeenCalledOnce();
    await recovery.addFallback("newpass7"); recovery.lock();
    await recovery.unlockWithPassphrase("newpass7"); expect(recovery.authenticated).toBe(true);
    recovery.lock();
  });
  it("offers recovery for unenrolled passkeys and never bypasses encrypted records", async () => {
    const original = await BrowserPrivateStore.unlock(namespace(address), password, true); original.lock();
    const recovery = new RecoverySession(fakeWallet() as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.continueWithPasskey();
    expect(recovery.authenticated).toBe(false); expect(recovery.recoveryNeeded).toBe(true);
    expect(navigator.credentials.create).not.toHaveBeenCalled(); expect(navigator.credentials.get).not.toHaveBeenCalled();
    await recovery.startFresh("passphrase", "newpass7", false);
    expect(readAuth(walletId)).toBeNull(); recovery.lock();
  });
  it("isolates a confirmed fresh workspace and restores unchanged old records after switching back", async () => {
    const original = await BrowserPrivateStore.unlock(namespace(address), password, true);
    await original.write("old_record", new TextEncoder().encode("synthetic saved payment"), 0); original.lock();
    const recovery = new RecoverySession(fakeWallet() as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.startFresh("passphrase", "newpass7", true);
    expect(recovery.authenticated).toBe(true); expect(recovery.localIdentity).not.toBe(walletId);
    await recovery.selectEscrow(address); expect(await recovery.payments!.list()).toEqual([]);
    recovery.lock();
    const preserved = recovery.previousWorkspaces[0]!; await recovery.selectPreserved(preserved.id);
    await recovery.unlockWithPassphrase(password); await recovery.selectEscrow(address);
    expect(await recovery.payments!.list()).toEqual(["old_record"]);
    recovery.lock();
  });
  it("cancelling fresh passkey creation preserves the current wrapper and all records", async () => {
    const recovery = new RecoverySession(fakeWallet() as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.unlockWithPassphrase(password); recovery.lock();
    const before = JSON.stringify(readAuth(walletId));
    vi.mocked(navigator.credentials.create).mockResolvedValueOnce(null);
    await recovery.startFresh("passkey", "", true);
    expect(recovery.authenticated).toBe(false); expect(JSON.stringify(readAuth(walletId))).toBe(before);
    expect(preservedWorkspaces(walletId)).toEqual([]);
  });
  it("recovers through an older wrapped backup after forgetting a changed passphrase", async () => {
    const recovery = new RecoverySession(fakeWallet() as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.unlockWithPassphrase(password);
    await recovery.continueWithPasskey();
    const backup = packageRecovery(walletId, '{"synthetic":true}');
    await recovery.addFallback("forgotten-new-password"); recovery.lock();
    await recovery.unlockFromBackup(backup, "incorrect"); expect(recovery.authenticated).toBe(false);
    await recovery.unlockFromBackup(backup, password); expect(recovery.authenticated).toBe(true);
    expect(preservedWorkspaces(walletId).length).toBe(1); expect(recovery.hasPasskey).toBe(true);
    recovery.lock(); await recovery.continueWithPasskey(); expect(recovery.authenticated).toBe(true); recovery.lock();
  });
  it("recovers Tools and payment records together and reuses auth when switching escrow", async () => {
    for (const contract of ["night-payment-deployment-staging-v2", address]) {
      const store = await BrowserPrivateStore.unlock(namespace(contract), password, true);
      await store.write("saved", new TextEncoder().encode("synthetic encrypted record"), 0); store.lock();
    }
    const wallet = fakeWallet(), recovery = new RecoverySession(wallet as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.unlockWithPassphrase(password);
    expect(recovery.authenticated).toBe(true); expect(recovery.deployment).not.toBeNull();
    expect(recovery.escrow).toBe(address); expect(await recovery.payments!.list()).toEqual(["saved"]);
    expect(await recovery.prepareDeployment()).toBe(recovery.deployment);
    await recovery.selectEscrow("b".repeat(64));
    expect(wallet.openPayments).toHaveBeenLastCalledWith("b".repeat(64), password, walletId);
    const controller = recovery.payments!;
    Object.assign(document, { visibilityState: "hidden" }); document.dispatchEvent(new Event("visibilitychange"));
    expect(await controller.list()).toEqual([]); // Root lifecycle, not a Tools/modal unmount, owns locking.
    recovery.lock(); expect(recovery.authenticated).toBe(false); expect(recovery.deployment).toBeNull();
    await expect(controller.list()).rejects.toThrow("locked");
  });
  it("rejects an incorrect legacy phrase without replacing records or creating a new identity", async () => {
    const store = await BrowserPrivateStore.unlock(namespace(address), password, true); store.lock();
    const recovery = new RecoverySession(fakeWallet() as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.unlockWithPassphrase("wrong local passphrase");
    expect(recovery.authenticated).toBe(false); expect(localStorage.getItem(`moneymole/auth/v1/${walletId}`)).toBeNull();
    const original = await BrowserPrivateStore.unlock(namespace(address), password); original.lock(); recovery.lock();
  });
  it("locks an in-flight controller rather than publishing it after session invalidation", async () => {
    const wallet = fakeWallet(), recovery = new RecoverySession(wallet as unknown as OneAmSession, walletId);
    await recovery.initialize(); await recovery.unlockWithPassphrase("phrase7");
    let complete!: (controller: unknown) => void;
    const lock = vi.fn();
    wallet.openPayments.mockImplementationOnce(() => new Promise(resolve => { complete = resolve as typeof complete; }));
    const selecting = recovery.selectEscrow(address); recovery.lock();
    complete({ contract: address, lock }); await selecting;
    expect(lock).toHaveBeenCalledOnce(); expect(recovery.payments).toBeNull();
  });
});
