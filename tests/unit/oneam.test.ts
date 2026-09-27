import { expect, it, vi } from "vitest";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { discoverOneAm, OneAmSession, WalletReadUnavailable, walletErrorMessage } from "../../src/lib/midnight/oneam";

function fixture(network = "preprod") {
  let address = "synthetic-shielded-address";
  const api = {
    getConnectionStatus: async () => ({ status: "connected", networkId: network }),
    getConfiguration: async () => ({ networkId: network }),
    getUnshieldedAddress: async () => ({ unshieldedAddress: address }),
    getDustBalance: async () => ({ balance: 1n, cap: 1n }),
  } as unknown as ConnectedAPI;
  const provider: InitialAPI = { name: "1AM", rdns: "com.midnight.1am", icon: "", apiVersion: "4.0.1", connect: async () => api };
  return { provider, api, changeAccount: () => { address = "another-synthetic-address"; } };
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
  await expect(session.check()).resolves.toBeUndefined();
  expect(await session.dustAvailable()).toBe(true);
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
it("retains authorization through transient status/address reads but blocks the operation", async () => {
  const f = fixture(), session = await OneAmSession.connect(f.provider);
  for (const method of ["getConnectionStatus", "getUnshieldedAddress", "getConfiguration"] as const) {
    const spy = vi.spyOn(f.api, method).mockRejectedValueOnce(new Error("temporary transport failure"));
    await expect(session.check()).rejects.toBeInstanceOf(WalletReadUnavailable);
    await expect(session.check()).resolves.toBeUndefined();
    spy.mockRestore();
  }
});
it("DUST failure does not block connection or invalidate identity", async () => {
  const f = fixture(); vi.spyOn(f.api, "getDustBalance").mockRejectedValue(new Error("synchronizing"));
  const session = await OneAmSession.connect(f.provider);
  expect(await session.dustAvailable()).toBeNull();
  await expect(session.check()).resolves.toBeUndefined();
});
it("retries post-approval reads without asking for authorization again", async () => {
  const f = fixture(), connect = vi.spyOn(f.provider, "connect");
  vi.spyOn(f.api, "getUnshieldedAddress").mockRejectedValueOnce(new Error("initializing"));
  await expect(OneAmSession.connect(f.provider)).resolves.toBeInstanceOf(OneAmSession);
  expect(connect).toHaveBeenCalledTimes(1);
});
it.each(["status", "network", "revoked"])("invalidates an explicitly changed session: %s", async kind => {
  const f = fixture(), session = await OneAmSession.connect(f.provider);
  if (kind === "revoked") vi.spyOn(f.api, "getConnectionStatus").mockRejectedValue({type:"DAppConnectorAPIError",code:"Disconnected"});
  else vi.spyOn(f.api, "getConnectionStatus").mockResolvedValue(kind === "status" ? {status:"disconnected"} : {status:"connected",networkId:"mainnet"});
  await expect(session.check()).rejects.toThrow("Reconnect");
  vi.restoreAllMocks();
  await expect(session.check()).rejects.toThrow("Reconnect");
});
it("times out a stalled read without losing the session and ignores results after disconnect", async () => {
  vi.useFakeTimers();
  try {
    const f = fixture(), session = await OneAmSession.connect(f.provider);
    const spy = vi.spyOn(f.api, "getConnectionStatus").mockImplementationOnce(() => new Promise(() => {}));
    const result = expect(session.check()).rejects.toBeInstanceOf(WalletReadUnavailable);
    await vi.advanceTimersByTimeAsync(8001); await result;
    spy.mockRestore(); await expect(session.check()).resolves.toBeUndefined();
    let resolve!: (value: {unshieldedAddress:string}) => void;
    vi.spyOn(f.api, "getUnshieldedAddress").mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const pending = session.check();
    await vi.advanceTimersByTimeAsync(0); session.disconnect();
    resolve({unshieldedAddress:"synthetic-shielded-address"});
    await expect(pending).rejects.toThrow("Reconnect");
  } finally { vi.useRealTimers(); vi.restoreAllMocks(); }
});
