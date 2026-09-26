import { beforeEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import type { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import { BrowserPrivateStore } from "../../src/lib/private-state/indexed-db";
import { openIssuance } from "../../src/lib/midnight/issuer-issuance";
const namespace = { network: "preprod", contractAddress: "synthetic-issuer", walletIdentity: "synthetic-wallet", schemaVersion: 1 } as const;
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
});
it("restores unknown issuance without balancing, proving, or resubmitting", async () => {
  const store = await BrowserPrivateStore.unlock(namespace, "synthetic private test passphrase", true);
  await store.write("issuance", new TextEncoder().encode(JSON.stringify({ version: 1, nonce: "01".repeat(32), phase: "outcome_unknown", transactionId: "synthetic-id" })), 0);
  const balance = vi.fn(), submit = vi.fn();
  const api = { getShieldedAddresses: async () => ({ shieldedAddress: "synthetic-address" }), getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }), balanceUnsealedTransaction: balance, submitTransaction: submit } as unknown as ConnectedAPI;
  const issuer = await openIssuance(api, store, "02".repeat(32), new Uint8Array(32), "03".repeat(32), "04".repeat(32), {} as ZKConfigProvider<"issue">);
  expect((await issuer.prepare()).phase).toBe("outcome_unknown");
  await expect(issuer.approveAndSubmit()).rejects.toThrow("reconcile");
  expect(balance).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  issuer.lock(); store.lock();
});
it("rejects an account switch before any issuance preparation", async () => {
  const store = await BrowserPrivateStore.unlock(namespace, "synthetic private test passphrase", true);
  let address = "first-synthetic-account";
  const api = { getShieldedAddresses: async () => ({ shieldedAddress: address }), getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }) } as unknown as ConnectedAPI;
  const issuer = await openIssuance(api, store, "02".repeat(32), new Uint8Array(32), "03".repeat(32), "04".repeat(32), {} as ZKConfigProvider<"issue">);
  address = "another-synthetic-account";
  await expect(issuer.prepare()).rejects.toThrow("Reconnect");
  issuer.lock(); store.lock();
});
