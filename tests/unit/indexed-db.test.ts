import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { BrowserPrivateStore } from "../../src/lib/private-state/indexed-db";
import { namespaceId } from "../../src/lib/private-state/crypto";
const namespace = { network: "preprod", contractAddress: "synthetic-contract", walletIdentity: "synthetic-wallet", schemaVersion: 1 } as const;
const password = "synthetic passphrase for local tests";
const bytes = new TextEncoder().encode("synthetic intent only");
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
});
describe("IndexedDB adapter with fake-indexeddb, no wallet or chain", () => {
  it("persists across unlocks, exports encrypted data and isolates wallets", async () => {
    const a = await BrowserPrivateStore.unlock(namespace, password, true);
    expect(await a.write("intent", bytes, 0)).toBe(1);
    const exported = await a.exportEncrypted("intent");
    expect(exported).not.toContain("synthetic intent");
    a.lock();
    await expect(BrowserPrivateStore.unlock(namespace, "a different synthetic password")).rejects.toThrow();
    const b = await BrowserPrivateStore.unlock(namespace, password);
    expect((await b.read("intent"))?.plaintext).toEqual(bytes);
    await expect(b.importEncrypted("intent", exported, password)).rejects.toThrow("conflict");
    b.lock();
    const c = await BrowserPrivateStore.unlock({ ...namespace, walletIdentity: "another-wallet" }, password, true);
    expect(await c.read("intent")).toBeNull();
    await expect(c.importEncrypted("intent", exported, password)).rejects.toThrow("authentication failed");
    c.lock();
  });
  it("prevents stale concurrent updates and never silently recreates a namespace", async () => {
    await expect(BrowserPrivateStore.unlock(namespace, password)).rejects.toThrow("explicitly create");
    const a = await BrowserPrivateStore.unlock(namespace, password, true);
    await expect(BrowserPrivateStore.unlock(namespace, password, true)).rejects.toThrow("exists");
    const b = await BrowserPrivateStore.unlock(namespace, password);
    const results = await Promise.allSettled([a.write("intent", bytes, 0), b.write("intent", bytes, 0)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    expect((await a.read("intent"))?.revision).toBe(1);
    await expect(a.write("intent", bytes, 0)).rejects.toThrow("conflict");
    a.lock(); b.lock();
  });
  it("locks on visibility loss and after five minutes", async () => {
    const a = await BrowserPrivateStore.unlock(namespace, password, true);
    Object.assign(document, { visibilityState: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    await expect(a.read("intent")).rejects.toThrow("locked");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const b = await BrowserPrivateStore.unlock(namespace, password);
    vi.advanceTimersByTime(300_000);
    await expect(b.read("intent")).rejects.toThrow("locked");
    vi.useRealTimers();
  });
  it("recovers an encrypted export into a fresh store under the same namespace", async () => {
    const a = await BrowserPrivateStore.unlock(namespace, password, true);
    await a.write("intent", bytes, 0);
    const exported = await a.exportEncrypted("intent"); a.lock();
    vi.stubGlobal("indexedDB", new IDBFactory());
    const b = await BrowserPrivateStore.unlock(namespace, "new local unlock passphrase", true);
    expect(await b.importEncrypted("intent", exported, password)).toBe(1);
    expect((await b.read("intent"))?.plaintext).toEqual(bytes);
    b.lock();
  });
  it("preserves corrupted ciphertext instead of replacing it with an empty record", async () => {
    const a = await BrowserPrivateStore.unlock(namespace, password, true);
    await a.write("intent", bytes, 0);
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("moneymole-private-v1", 1);
      open.onerror = () => reject(new Error("Synthetic fixture setup failed"));
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction("records", "readwrite"), store = tx.objectStore("records");
        const key = `${namespaceId(namespace)}/intent`, get = store.get(key);
        get.onsuccess = () => { const value = get.result; value.envelope.ciphertext = "invalid"; store.put(value, key); };
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(new Error("Synthetic fixture setup failed"));
      };
    });
    await expect(a.read("intent")).rejects.toThrow();
    await expect(a.write("intent", bytes, 1)).rejects.toThrow();
    await expect(a.read("intent")).rejects.toThrow();
    a.lock();
  });
});
