import "client-only";

export const MAX_AMOUNT = (1n << 128n) - 1n;
export const hex = (v: Uint8Array) => Array.from(v, b => b.toString(16).padStart(2, "0")).join("");
export function unhex(s: string, length?: number): Uint8Array<ArrayBuffer> {
  if (typeof s !== "string" || !/^(?:[a-f0-9]{2})+$/.test(s) || (length !== undefined && s.length !== length * 2)) throw new Error("Invalid encoded field");
  return Uint8Array.from(s.match(/../g)!, h => parseInt(h, 16));
}
/** Midnight transaction identifiers are 33 bytes on Preprod; retain 32-byte legacy records. */
export function transactionIdentifier(s: string) {
  const bytes = unhex(s);
  if (bytes.length !== 32 && bytes.length !== 33) throw new Error("Invalid transaction identifier");
  return bytes;
}
export const randomHex = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export interface ClaimPayload { version: 2; network: "preprod"; contract: string; asset: string; nonce: string; amount: string; authority: string; fundingId: string; }
async function body(p: ClaimPayload) {
  // Keep ledger WebAssembly off the initial shell hydration path.
  const { nativeToken } = await import("@midnight-ntwrk/midnight-js-protocol/ledger");
  if (p.version !== 2 || p.network !== "preprod" || p.asset !== nativeToken().raw || !/^[1-9][0-9]{0,38}$/.test(p.amount) || BigInt(p.amount) > MAX_AMOUNT) throw new Error("Invalid NIGHT claim payload");
  const fundingId = transactionIdentifier(p.fundingId);
  const version = fundingId.length === 33 ? 3 : 2;
  const out = new Uint8Array(178 + fundingId.length - 32);
  out.set([version, 1]);
  [p.contract, p.asset, p.nonce, p.authority].forEach((s, i) => out.set(unhex(s, 32), 2 + i * 32));
  out.set(fundingId, 130);
  let amount = BigInt(p.amount); for (let i = out.length - 1; i >= out.length - 16; i--) { out[i] = Number(amount & 255n); amount >>= 8n; }
  return { data: out, version };
}
const b64 = (v: Uint8Array) => btoa(String.fromCharCode(...v)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
async function key(authority: string) { return crypto.subtle.importKey("raw", unhex(authority, 32), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
/** Integrity tag plus contract-bound opening. Anyone holding this token has bearer authority. */
export async function encodeClaim(p: ClaimPayload) {
  const { data, version } = await body(p), tag = new Uint8Array(await crypto.subtle.sign("HMAC", await key(p.authority), data));
  const joined = new Uint8Array(data.length + tag.length); joined.set(data); joined.set(tag, data.length); return `mm${version}.${b64(joined)}`;
}
export async function decodeClaim(token: string): Promise<ClaimPayload> {
  const match = /^mm([23])\.([A-Za-z0-9_-]+)$/.exec(token);
  if (!match || match[2]!.length !== (match[1] === "3" ? 282 : 280)) throw new Error("Unsupported or damaged claim link");
  const raw = Uint8Array.from(atob(match[2]!.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0));
  const version = Number(match[1]), dataLength = version === 3 ? 179 : 178;
  if (raw.length !== dataLength + 32 || raw[0] !== version || raw[1] !== 1 || `mm${version}.${b64(raw)}` !== token) throw new Error("Unsupported claim encoding");
  const fields = Array.from({ length: 4 }, (_, i) => hex(raw.subarray(2 + i * 32, 34 + i * 32)));
  let amount = 0n; for (const byte of raw.subarray(dataLength - 16, dataLength)) amount = (amount << 8n) | BigInt(byte);
  const p: ClaimPayload = { version: 2, network: "preprod", contract: fields[0]!, asset: fields[1]!, nonce: fields[2]!, authority: fields[3]!, fundingId: hex(raw.subarray(130, dataLength - 16)), amount: amount.toString() };
  const expected = await body(p);
  if (expected.version !== version || !await crypto.subtle.verify("HMAC", await key(p.authority), raw.subarray(dataLength), raw.subarray(0, dataLength))) throw new Error("Claim integrity check failed");
  return p;
}
export function extractClaim(input: string) {
  const trimmed = input.trim();
  if (/^mm[23]\./.test(trimmed)) return trimmed;
  const url = new URL(trimmed); if (url.search || url.pathname !== "/claim") throw new Error("Unsupported claim URL");
  return url.hash.slice(1);
}
