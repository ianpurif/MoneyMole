import "client-only";
import type { InitialAPI, ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

export function discoverOneAm(registry: unknown): InitialAPI[] {
  if (!registry || typeof registry !== "object") return [];
  const matches = [...new Set(Object.values(registry))].filter((value): value is InitialAPI => {
    if (!value || typeof value !== "object") return false;
    const v = value as Partial<InitialAPI>;
    // Opaque registry keys are allowed. Metadata is a discovery hint, not identity proof.
    const name = typeof v.name === "string" ? v.name.trim().toLowerCase() : "";
    const rdns = typeof v.rdns === "string" ? v.rdns.toLowerCase() : "";
    // Brand metadata is self-reported, never cryptographic wallet identity.
    const oneAm = rdns === "com.midnight.1am" || ["1am", "1am.xyz", "1am wallet"].includes(name);
    return oneAm && rdns !== "io.lace.wallet" && typeof v.name === "string" && v.name.length > 0 && v.name.length <= 100 &&
      typeof v.apiVersion === "string" && /^4\.\d+\.\d+$/.test(v.apiVersion) && typeof v.connect === "function";
  });
  // Do not guess between distinct extensions reporting the same brand.
  return matches.length === 1 ? matches : [];
}

export class WalletSessionInvalid extends Error {
  constructor() { super("Wallet session invalidated. Reconnect 1AM on Preprod."); }
}
export class WalletReadUnavailable extends Error {
  constructor() { super("1AM is temporarily unavailable. Your connection is retained; try again shortly."); }
}
function isDisconnected(error: unknown): boolean {
  return !!error && typeof error === "object" && "type" in error && error.type === "DAppConnectorAPIError" && "code" in error && error.code === "Disconnected";
}
/** Bound read-only calls, never authorization or transaction requests. */
async function readWallet<T>(read: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([read(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new WalletReadUnavailable()), 8000); })]); }
  finally { clearTimeout(timer); }
}
async function identity(api: ConnectedAPI) {
  const status = await readWallet(() => api.getConnectionStatus());
  if (status.status === "disconnected" || (status.status === "connected" && status.networkId !== "preprod")) throw new WalletSessionInvalid();
  if (status.status !== "connected") throw new WalletReadUnavailable();
  const config = await readWallet(() => api.getConfiguration());
  if (config.networkId !== "preprod") throw new WalletSessionInvalid();
  const { unshieldedAddress } = await readWallet(() => api.getUnshieldedAddress());
  if (!unshieldedAddress) throw new WalletReadUnavailable();
  return unshieldedAddress;
}

export class OneAmSession {
  #api: ConnectedAPI | null;
  #address: string;
  private constructor(api: ConnectedAPI, address: string) { this.#api = api; this.#address = address; }
  /** Call only from an explicit user gesture. This does not sign or submit transactions. */
  static async connect(provider: InitialAPI): Promise<OneAmSession> {
    if (discoverOneAm({ provider }).length !== 1) throw new Error("A supported 1AM API v4 provider is required.");
    const api = await provider.connect("preprod");
    // The extension can still be initializing immediately after approval. Retry
    // only reads on this authorized API; never invoke connect a second time.
    for (let attempt = 0; ; attempt++) {
      try { return new OneAmSession(api, await identity(api)); }
      catch (error) {
        if (error instanceof WalletSessionInvalid || isDisconnected(error)) throw new WalletSessionInvalid();
        if (attempt === 2) throw new WalletReadUnavailable();
        await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  async check(): Promise<void> {
    const api = this.#api;
    if (!api) throw new WalletSessionInvalid();
    try {
      const address = await identity(api);
      if (this.#api !== api || address !== this.#address) throw new WalletSessionInvalid();
    } catch (error) {
      if (!this.#api || error instanceof WalletSessionInvalid || isDisconnected(error)) { this.disconnect(); throw new WalletSessionInvalid(); }
      // Transport/readiness errors do not revoke authorization. Operations still
      // fail closed because this check rejects until identity can be verified.
      throw new WalletReadUnavailable();
    }
  }
  async dustAvailable(): Promise<boolean | null> {
    const api = this.#api;
    if (!api) throw new WalletSessionInvalid();
    try {
      const dust = await readWallet(() => api.getDustBalance());
      if (this.#api !== api) throw new WalletSessionInvalid();
      return typeof dust.balance === "bigint" && dust.balance >= 0n ? dust.balance > 0n : null;
    } catch (error) {
      if (!this.#api || error instanceof WalletSessionInvalid || isDisconnected(error)) { this.disconnect(); throw new WalletSessionInvalid(); }
      return null;
    }
  }
  /** Connector v4 has no revoke method; forget only this browser's session. */
  disconnect(): void { this.#api = null; this.#address = ""; }
  async prepareIssuer(password: string) {
    await this.check();
    if (!this.#api) throw new Error("Reconnect 1AM.");
    const { prepareIssuer } = await import("./issuer-deployment");
    return prepareIssuer(this.#api, password);
  }
  async preparePaymentDeployment(password: string) {
    await this.check(); if (!this.#api) throw new Error("Reconnect 1AM");
    const { walletContext } = await import("./payment-session");
    const { openPaymentDeployment } = await import("./payment-deployment");
    return openPaymentDeployment(await walletContext(this.#api, () => this.check()), password);
  }
  async openPayments(contract: string, password: string) {
    await this.check(); if (!this.#api) throw new Error("Reconnect 1AM");
    const { walletContext } = await import("./payment-session");
    const { openPayments } = await import("./payments");
    return openPayments(await walletContext(this.#api, () => this.check()), contract, password);
  }
  async restoreAdmin(kind: "issuer" | "escrow", password: string, text: string, originalPassword: string) {
    await this.check(); if (!this.#api) throw new Error("Reconnect 1AM");
    const { walletContext } = await import("./payment-session");
    const { restoreAdmin } = await import("./admin-recovery");
    return restoreAdmin(await walletContext(this.#api, () => this.check()), kind, password, text, originalPassword);
  }
}

export function walletErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && ["Rejected", "PermissionRejected"].includes(String(error.code))) {
    return "Connection declined. You can try again when ready.";
  }
  return "1AM could not connect. Unlock the wallet, select Preprod and try again.";
}
