import "client-only";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

export class WalletSessionInvalid extends Error {
  constructor() { super("Wallet session invalidated. Reconnect your wallet on Preprod."); }
}
export class WalletReadUnavailable extends Error {
  constructor(readonly reason: "unavailable" | "timeout" | "rate-limit" = "unavailable") {
    super("Wallet is temporarily unavailable. Your connection is retained; try again shortly.");
  }
}
const reads = new Set<PropertyKey>(["getConnectionStatus", "getConfiguration", "getShieldedAddresses", "getUnshieldedAddress", "getDustAddress", "getShieldedBalances", "getUnshieldedBalances", "getDustBalance"]);
const wrappers = new WeakMap<ConnectedAPI, ConnectedAPI>();
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** 1AM 6.3.11 permits 20 reads per 10 seconds. All consumers of an authorized
 * API share a paced queue with headroom. Share only in-flight reads, never cache
 * an identity/balance across operations. Signing and submission are never retried.
 */
export function coordinateWalletReads(api: ConnectedAPI): ConnectedAPI {
  const existing = wrappers.get(api); if (existing) return existing;
  let tail = Promise.resolve();
  let starts: number[] = [];
  const pending = new Map<PropertyKey, Promise<unknown>>();
  async function invoke(method: () => Promise<unknown>) {
    for (let attempt = 0; ; attempt++) {
      starts = starts.filter(time => Date.now() - time < 10_100);
      if (starts.length >= 16) await pause(Math.max(0, starts[0]! + 10_100 - Date.now()));
      starts = starts.filter(time => Date.now() - time < 10_100);
      starts.push(Date.now());
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        // Queue time is not a stalled extension call.
        return await Promise.race([method(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new WalletReadUnavailable("timeout")), 8000); })]);
      } catch (error) {
        const e = error as { code?: unknown; message?: unknown; reason?: unknown } | null;
        if (e?.code === "Disconnected") throw new WalletSessionInvalid();
        const limited = e?.code === "InternalError" && [e.message, e.reason].some(value => typeof value === "string" && /rate.?limit|too many.*requests/i.test(value));
        if (!limited) throw error;
        if (attempt >= 1) throw new WalletReadUnavailable("rate-limit");
        // Another tab or an earlier connection can also consume the origin budget.
        clearTimeout(timer); await pause(10_100);
      } finally { clearTimeout(timer); }
    }
  }
  const wrapped = new Proxy(api, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (typeof value !== "function") return value;
      if (!reads.has(key)) return value.bind(target);
      return () => {
        const current = pending.get(key); if (current) return current;
        const result = tail.then(() => invoke(() => value.call(target))).finally(() => { pending.delete(key); });
        tail = result.then(() => {}, () => {});
        pending.set(key, result); return result;
      };
    },
  });
  wrappers.set(api, wrapped); wrappers.set(wrapped, wrapped);
  return wrapped;
}
