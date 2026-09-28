import { afterEach, expect, it, vi } from "vitest";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { coordinateWalletReads, WalletReadUnavailable, WalletSessionInvalid } from "../../src/lib/midnight/wallet-reads";

afterEach(() => vi.useRealTimers());

it("paces a preparation burst below the installed 1AM 20-read/10-second limit", async () => {
  vi.useFakeTimers();
  const starts: number[] = [];
  const read = vi.fn(async () => {
    const now = Date.now();
    if (starts.filter(time => now - time < 10_000).length >= 20) throw { code: "InternalError", reason: "Rate limited" };
    starts.push(now); return { networkId: "preprod" };
  });
  const api = coordinateWalletReads({ getConfiguration: read } as unknown as ConnectedAPI);
  const completed = (async () => { for (let i = 0; i < 40; i++) await api.getConfiguration(); })();
  await vi.runAllTimersAsync(); await completed;
  expect(starts).toHaveLength(40);
  expect(starts.every(time => starts.filter(other => other <= time && time - other < 10_000).length <= 16)).toBe(true);
});

it("shares simultaneous reads but rechecks changed values on the next operation", async () => {
  const read = vi.fn(async () => ({ unshieldedAddress: "first" }));
  const api = coordinateWalletReads({ getUnshieldedAddress: read } as unknown as ConnectedAPI);
  expect(coordinateWalletReads(api)).toBe(api);
  await Promise.all([api.getUnshieldedAddress(), api.getUnshieldedAddress()]);
  expect(read).toHaveBeenCalledTimes(1);
  read.mockResolvedValue({ unshieldedAddress: "changed" });
  expect((await api.getUnshieldedAddress()).unshieldedAddress).toBe("changed");
  expect(read).toHaveBeenCalledTimes(2);
});

it("cools down a rate limit from another tab without retrying wallet authorization", async () => {
  vi.useFakeTimers();
  const read = vi.fn().mockRejectedValueOnce({code:"InternalError", reason:"Rate limited"}).mockResolvedValue({balance:1n});
  const sign = vi.fn().mockRejectedValue({code:"InternalError", reason:"Rate limited"});
  const api = coordinateWalletReads({getDustBalance:read, balanceUnsealedTransaction:sign} as unknown as ConnectedAPI);
  const result = api.getDustBalance(); await vi.runAllTimersAsync();
  expect(await result).toEqual({balance:1n}); expect(read).toHaveBeenCalledTimes(2);
  await expect(api.balanceUnsealedTransaction("synthetic")).rejects.toMatchObject({code:"InternalError"});
  expect(sign).toHaveBeenCalledTimes(1);
});

it("bounds persistent throttling and rejects a revoked session immediately", async () => {
  vi.useFakeTimers();
  const read = vi.fn().mockRejectedValue({code:"InternalError", reason:"Rate limited"});
  const api = coordinateWalletReads({getConfiguration:read} as unknown as ConnectedAPI);
  const failed = expect(api.getConfiguration()).rejects.toMatchObject({reason:"rate-limit"});
  await vi.runAllTimersAsync(); await failed; expect(read).toHaveBeenCalledTimes(2);
  read.mockRejectedValue({code:"Disconnected"});
  await expect(api.getConfiguration()).rejects.toBeInstanceOf(WalletSessionInvalid);
  read.mockImplementation(() => new Promise(() => {}));
  const timeout = expect(api.getConfiguration()).rejects.toBeInstanceOf(WalletReadUnavailable);
  await vi.runAllTimersAsync(); await timeout;
});
