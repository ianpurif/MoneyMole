import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { BrowserPrivateStore } from "../../src/lib/private-state/indexed-db";
import { RecoverySession } from "../../src/lib/private-state/recovery-session";
import type { OneAmSession } from "../../src/lib/midnight/oneam";
const walletId = "synthetic-wallet", address = "a".repeat(64), password = "existing synthetic local passphrase";
const namespace = (contractAddress: string) => ({ network: "preprod" as const, contractAddress, walletIdentity: walletId, schemaVersion: 2 });
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
});
function fakeWallet() {
  return {
    preparePaymentDeployment: vi.fn(async (secret: string) => {
      const store = await BrowserPrivateStore.unlock(namespace("night-payment-deployment-staging-v2"), secret);
      return { review: () => ({ address, phase: "finalized" }), lock: () => store.lock() };
    }),
    openPayments: vi.fn(async (contract: string, secret: string) => {
      const ns = namespace(contract), store = await BrowserPrivateStore.unlock(ns, secret, !await BrowserPrivateStore.exists(ns));
      return { contract, asset: "synthetic", list: () => store.keys(), lock: () => store.lock() };
    }),
  };
}
describe("shared recovery session with real encrypted local stores, synthetic wallet only", () => {
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
    expect(wallet.openPayments).toHaveBeenLastCalledWith("b".repeat(64), password);
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
