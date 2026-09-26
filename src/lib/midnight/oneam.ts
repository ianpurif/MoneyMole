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

export class OneAmSession {
  #api: ConnectedAPI | null;
  #address: string;
  private constructor(api: ConnectedAPI, address: string) { this.#api = api; this.#address = address; }
  /** Call only from an explicit user gesture. This does not sign or submit transactions. */
  static async connect(provider: InitialAPI): Promise<OneAmSession> {
    if (discoverOneAm({ provider }).length !== 1) throw new Error("A supported 1AM API v4 provider is required.");
    const api = await provider.connect("preprod");
    const status = await api.getConnectionStatus();
    const config = await api.getConfiguration();
    if (status.status !== "connected" || status.networkId !== "preprod" || config.networkId !== "preprod") throw new Error("Select Preprod in 1AM and connect again.");
    const addresses = await api.getShieldedAddresses();
    if (!addresses.shieldedAddress) throw new Error("1AM has no shielded address available.");
    const session = new OneAmSession(api, addresses.shieldedAddress);
    await session.check();
    return session;
  }
  async check(): Promise<{ dustAvailable: boolean }> {
    const api = this.#api;
    if (!api) throw new Error("Reconnect 1AM.");
    try {
      const status = await api.getConnectionStatus();
      if (status.status !== "connected" || status.networkId !== "preprod") throw new Error("connection_changed");
      const addresses = await api.getShieldedAddresses();
      if (addresses.shieldedAddress !== this.#address) throw new Error("account_changed");
      const dust = await api.getDustBalance();
      if (this.#api !== api || typeof dust.balance !== "bigint" || dust.balance < 0n) throw new Error("invalid_session");
      return { dustAvailable: dust.balance > 0n };
    } catch { this.disconnect(); throw new Error("Wallet connection changed or unavailable. Reconnect 1AM."); }
  }
  /** Connector v4 has no revoke method; forget only this browser's session. */
  disconnect(): void { this.#api = null; this.#address = ""; }
}

export function walletErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && ["Rejected", "PermissionRejected"].includes(String(error.code))) {
    return "Connection declined. You can try again when ready.";
  }
  return "1AM could not connect. Unlock the wallet, select Preprod and try again.";
}
