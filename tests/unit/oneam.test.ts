import { expect, it } from "vitest";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { discoverOneAm, OneAmSession, walletErrorMessage } from "../../src/lib/midnight/oneam";

function fixture(network = "preprod") {
  let address = "synthetic-shielded-address";
  const api = {
    getConnectionStatus: async () => ({ status: "connected", networkId: network }),
    getConfiguration: async () => ({ networkId: network }),
    getShieldedAddresses: async () => ({ shieldedAddress: address }),
    getDustBalance: async () => ({ balance: 1n, cap: 1n }),
  } as unknown as ConnectedAPI;
  const provider: InitialAPI = { name: "1AM", rdns: "com.midnight.1am", icon: "", apiVersion: "4.0.1", connect: async () => api };
  return { provider, changeAccount: () => { address = "another-synthetic-address"; } };
}
it("discovers supported 1AM APIs under opaque keys without connecting", () => {
  const { provider } = fixture();
  expect(discoverOneAm({ opaque: provider })).toEqual([provider]);
  expect(discoverOneAm({ opaque: { ...provider, apiVersion: "3.0.0" } })).toEqual([]);
  expect(discoverOneAm({ opaque: { ...provider, name: "Other", rdns: "other.wallet" } })).toEqual([]);
});
it("recognizes exact 1AM names, deduplicates aliases and rejects ambiguity or Lace", () => {
  const { provider } = fixture();
  expect(discoverOneAm({ a: provider, b: provider })).toEqual([provider]);
  expect(discoverOneAm({ a: provider, b: { ...provider } })).toEqual([]);
  for (const name of ["1AM", "1AM.xyz", "1AM Wallet"]) {
    expect(discoverOneAm({ arbitrary: { ...provider, name, rdns: "xyz.1am.wallet" } })).toHaveLength(1);
  }
  expect(discoverOneAm({ lace: { ...provider, name: "Lace", rdns: "io.lace.wallet" } })).toEqual([]);
  expect(discoverOneAm({ misleading: { ...provider, rdns: "io.lace.wallet" } })).toEqual([]);
  expect(discoverOneAm({ future: { ...provider, apiVersion: "5.0.0" } })).toEqual([]);
});
it("requires Preprod and clears its session on an account change", async () => {
  await expect(OneAmSession.connect(fixture("mainnet").provider)).rejects.toThrow("Preprod");
  const f = fixture(); const session = await OneAmSession.connect(f.provider);
  expect(await session.check()).toEqual({ dustAvailable: true });
  f.changeAccount();
  await expect(session.check()).rejects.toThrow("Reconnect");
  await expect(session.check()).rejects.toThrow("Reconnect");
});
it("forgets the local session and never returns raw wallet errors", async () => {
  const session = await OneAmSession.connect(fixture().provider); session.disconnect();
  await expect(session.check()).rejects.toThrow("Reconnect");
  expect(walletErrorMessage({ code: "Rejected", message: "private data" })).toContain("declined");
  expect(walletErrorMessage(new Error("private data"))).not.toContain("private data");
});
