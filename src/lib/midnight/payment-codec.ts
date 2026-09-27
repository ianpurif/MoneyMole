import "client-only";

export const MAX_AMOUNT = (1n << 128n) - 1n;
export const hex = (v: Uint8Array) => Array.from(v, b => b.toString(16).padStart(2, "0")).join("");
export function unhex(s: string, length?: number): Uint8Array<ArrayBuffer> {
  if (typeof s !== "string" || !/^(?:[a-f0-9]{2})+$/.test(s) || (length !== undefined && s.length !== length * 2)) throw new Error("Invalid encoded field");
  return Uint8Array.from(s.match(/../g)!, h => parseInt(h, 16));
}
export const randomHex = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export interface ClaimPayload { version: 2; network: "preprod"; contract: string; asset: string; nonce: string; amount: string; authority: string; fundingId: string; }
async function body(p: ClaimPayload) {
  // Keep ledger WebAssembly off the initial shell hydration path.
  const { nativeToken } = await import("@midnight-ntwrk/midnight-js-protocol/ledger");
  if (p.version !== 2 || p.network !== "preprod" || p.asset !== nativeToken().raw || !/^[1-9][0-9]{0,38}$/.test(p.amount) || BigInt(p.amount) > MAX_AMOUNT) throw new Error("Invalid NIGHT claim payload");
  const out = new Uint8Array(210); out.set([2, 1]);
  [p.contract, p.asset, p.nonce, p.authority, p.fundingId].forEach((s, i) => out.set(unhex(s, 32), 2 + i * 32));
  let amount = BigInt(p.amount); for (let i = 177; i >= 162; i--) { out[i] = Number(amount & 255n); amount >>= 8n; }
  return out.subarray(0, 178);
}
const b64 = (v: Uint8Array) => btoa(String.fromCharCode(...v)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
async function key(authority: string) { return crypto.subtle.importKey("raw", unhex(authority, 32), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
/** Integrity tag plus contract-bound opening. Anyone holding this token has bearer authority. */
export async function encodeClaim(p: ClaimPayload) {
  const data = await body(p), tag = new Uint8Array(await crypto.subtle.sign("HMAC", await key(p.authority), data));
  const joined = new Uint8Array(210); joined.set(data); joined.set(tag, 178); return `mm2.${b64(joined)}`;
}
export async function decodeClaim(token: string): Promise<ClaimPayload> {
  if (!/^mm2\.[A-Za-z0-9_-]{280}$/.test(token)) throw new Error("Unsupported or damaged claim link");
  const raw = Uint8Array.from(atob(token.slice(4).replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0));
  if (raw.length !== 210 || raw[0] !== 2 || raw[1] !== 1 || `mm2.${b64(raw)}` !== token) throw new Error("Unsupported claim encoding");
  const fields = Array.from({ length: 5 }, (_, i) => hex(raw.subarray(2 + i * 32, 34 + i * 32)));
  let amount = 0n; for (const byte of raw.subarray(162, 178)) amount = (amount << 8n) | BigInt(byte);
  const p: ClaimPayload = { version: 2, network: "preprod", contract: fields[0]!, asset: fields[1]!, nonce: fields[2]!, authority: fields[3]!, fundingId: fields[4]!, amount: amount.toString() };
  await body(p);
  if (!await crypto.subtle.verify("HMAC", await key(p.authority), raw.subarray(178), raw.subarray(0, 178))) throw new Error("Claim integrity check failed");
  return p;
}
export function extractClaim(input: string) {
  const trimmed = input.trim();
  if (trimmed.startsWith("mm2.")) return trimmed;
  const url = new URL(trimmed); if (url.search || url.pathname !== "/claim") throw new Error("Unsupported claim URL");
  return url.hash.slice(1);
}
