import { beforeEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { BrowserPrivateStore } from "../../src/lib/private-state/indexed-db";
import { TransactionJournal } from "../../src/lib/private-state/transaction-journal";
const namespace = { network: "preprod", contractAddress: "synthetic-contract", walletIdentity: "synthetic-wallet", schemaVersion: 1 } as const;
const password = "synthetic recovery test passphrase";
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
});
async function setup() {
  const store = await BrowserPrivateStore.unlock(namespace, password, true);
  const journal = await TransactionJournal.create(store, "intent", "synthetic-id", "opaque synthetic funding intent");
  await journal.apply({ type: "request_authorization" });
  return { store, journal };
}
it("persists uncertainty before a lost response and prevents retries after reload", async () => {
  const { store, journal } = await setup();
  await expect(journal.submit(async () => {
    const persisted = await TransactionJournal.load(store, "intent");
    expect(persisted.snapshot().transaction.phase).toBe("outcome_unknown");
    throw new Error("sensitive provider failure");
  })).rejects.toThrow("Submission outcome unknown");
  store.lock();
  const reopened = await BrowserPrivateStore.unlock(namespace, password);
  const recovered = await TransactionJournal.load(reopened, "intent");
  const send = vi.fn(async () => "tx");
  await expect(recovered.submit(send)).rejects.toThrow(); expect(send).not.toHaveBeenCalled();
  expect(recovered.snapshot().verified).toBe(false); reopened.lock();
});
it("only one competing tab can invoke the submission callback", async () => {
  const { store, journal } = await setup();
  const second = await BrowserPrivateStore.unlock(namespace, password);
  const rival = await TransactionJournal.load(second, "intent");
  const send = vi.fn(async () => "synthetic-tx");
  const results = await Promise.allSettled([journal.submit(send), rival.submit(send)]);
  expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect(send).toHaveBeenCalledTimes(1); store.lock(); second.lock();
});
it("storage failure before submission prevents side effects", async () => {
  const { store, journal } = await setup(); store.lock();
  const send = vi.fn(async () => "synthetic-tx");
  await expect(journal.submit(send)).rejects.toThrow(); expect(send).not.toHaveBeenCalled();
});
it("acknowledgment persistence failure preserves unknown outcome", async () => {
  const { store, journal } = await setup();
  await expect(journal.submit(async () => { store.lock(); return "synthetic-tx"; })).rejects.toThrow();
  const reopened = await BrowserPrivateStore.unlock(namespace, password);
  expect((await TransactionJournal.load(reopened, "intent")).snapshot().transaction.phase).toBe("outcome_unknown");
  reopened.lock();
});
it("malformed local recovery data is rejected without replacement", async () => {
  const { store } = await setup();
  const bad = new TextEncoder().encode('{"version":99}');
  await store.write("corrupt", bad, 0);
  await expect(TransactionJournal.load(store, "corrupt")).rejects.toThrow("Invalid recovery record");
  expect((await store.read("corrupt"))?.plaintext).toEqual(bad); store.lock();
});
