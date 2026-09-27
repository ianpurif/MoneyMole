import "client-only";
import { PrivateCipher, type EncryptedEnvelope } from "./crypto";
import { requirePassphrase } from "./passphrase";
import { storageIdentity } from "./storage-identity";

type PasskeyWrap = { id: string; salt: string; iv: string; ciphertext: string };
export type LocalAuthRecord = { version: 1; passphrase?: EncryptedEnvelope; passkey?: PasskeyWrap; storageIdentity?: string };
export type PreservedWorkspace = { id: string; createdAt: string; auth: LocalAuthRecord | null };
const utf8 = new TextEncoder();
const ns = (wallet: string) => ({ network: "preprod" as const, contractAddress: "moneymole-local-auth-v1", walletIdentity: wallet, schemaVersion: 2 });
const key = (wallet: string) => `moneymole/auth/v1/${wallet}`;
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
function decode(value: string, max = 4096): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid local recovery data.");
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
export function readAuth(wallet: string): LocalAuthRecord | null {
  const raw = localStorage.getItem(key(wallet));
  if (!raw) return null;
  const value = JSON.parse(raw) as LocalAuthRecord;
  if (value.version !== 1 || (!value.passkey && !value.passphrase)) throw new Error("Local authentication data is damaged. Preserve your recovery backup.");
  storageIdentity(wallet, value.storageIdentity);
  return value;
}
export function saveAuth(wallet: string, value: LocalAuthRecord) { localStorage.setItem(key(wallet), JSON.stringify(value)); }
export function preservedWorkspaces(wallet: string): PreservedWorkspace[] {
  const items = JSON.parse(localStorage.getItem(`${key(wallet)}/preserved`) ?? "[]") as PreservedWorkspace[];
  if (!Array.isArray(items) || items.some(item => !item || typeof item.id !== "string" || typeof item.createdAt !== "string")) throw new Error("Local authentication archive is damaged. Preserve your browser data.");
  return items;
}
/** Archive first, then atomically replace the active wrapper. IndexedDB is never deleted. */
export function preserveAndSelectAuth(wallet: string, expected: LocalAuthRecord | null, next: LocalAuthRecord | null) {
  const current = readAuth(wallet);
  if (JSON.stringify(current) !== JSON.stringify(expected)) throw new Error("Local authentication changed in another tab. Reload before continuing.");
  if (next) storageIdentity(wallet, next.storageIdentity);
  const preserved = preservedWorkspaces(wallet);
  preserved.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), auth: current });
  localStorage.setItem(`${key(wallet)}/preserved`, JSON.stringify(preserved));
  if (next) saveAuth(wallet, next); else localStorage.removeItem(key(wallet));
}
export async function wrapPassphrase(wallet: string, secret: string, password: string) {
  requirePassphrase(password);
  const cipher = await PrivateCipher.unlock(password), bytes = utf8.encode(secret);
  try { return await cipher.encrypt(ns(wallet), "identity", bytes); }
  finally { bytes.fill(0); cipher.lock(); }
}
export async function unwrapPassphrase(wallet: string, envelope: EncryptedEnvelope, password: string) {
  const cipher = await PrivateCipher.unlock(password, envelope.salt);
  let bytes: Uint8Array | undefined;
  try { bytes = await cipher.decrypt(ns(wallet), "identity", envelope); return new TextDecoder().decode(bytes); }
  finally { bytes?.fill(0); cipher.lock(); }
}
type PrfExtensions = AuthenticationExtensionsClientInputs & { prf: { eval: { first: Uint8Array<ArrayBuffer> } } };
type PrfOutput = { prf?: { enabled?: boolean; results?: { first: ArrayBuffer } } };
export function passkeysAvailable() { return window.isSecureContext && typeof PublicKeyCredential !== "undefined" && !!navigator.credentials; }
async function prfKey(credential: PublicKeyCredential, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  let output = credential.getClientExtensionResults() as PrfOutput;
  if (output.prf?.enabled === false) throw new Error("This passkey cannot unlock encrypted records on this browser. Use a recovery passphrase instead.");
  if (!output.prf?.results?.first) {
    const next = await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: "public-key", id: credential.rawId }], userVerification: "required", timeout: 60_000,
      extensions: { prf: { eval: { first: salt } } } as PrfExtensions,
    } }) as PublicKeyCredential | null;
    if (!next || encode(new Uint8Array(next.rawId)) !== encode(new Uint8Array(credential.rawId))) throw new Error("Passkey was cancelled. Try again or use your recovery passphrase.");
    output = next.getClientExtensionResults() as PrfOutput;
  }
  const result = output.prf?.results?.first;
  if (!result || result.byteLength !== 32) throw new Error("This passkey cannot unlock encrypted records on this browser. Use a recovery passphrase instead.");
  const bytes = new Uint8Array(result);
  try { return await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]); }
  finally { bytes.fill(0); }
}
export async function createPasskey(wallet: string, secret: string): Promise<PasskeyWrap> {
  if (!passkeysAvailable()) throw new Error("Passkeys are unavailable here. Use your recovery passphrase.");
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({ publicKey: {
    challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: "MoneyMole" },
    user: { id: crypto.getRandomValues(new Uint8Array(32)), name: `MoneyMole ${wallet.slice(0, 8)}`, displayName: "MoneyMole" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { residentKey: "required", userVerification: "required" }, attestation: "none", timeout: 60_000,
    extensions: { prf: { eval: { first: salt } } } as PrfExtensions,
  } }) as PublicKeyCredential | null;
  if (!credential) throw new Error("Passkey creation was cancelled. Your records are unchanged.");
  const wrappingKey = await prfKey(credential, salt), iv = crypto.getRandomValues(new Uint8Array(12)), bytes = utf8.encode(secret);
  try {
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: utf8.encode(key(wallet)) }, wrappingKey, bytes);
    return { id: encode(new Uint8Array(credential.rawId)), salt: encode(salt), iv: encode(iv), ciphertext: encode(new Uint8Array(ciphertext)) };
  } finally { bytes.fill(0); }
}
export async function unlockPasskey(wallet: string, record: PasskeyWrap) {
  if (!passkeysAvailable()) throw new Error("Passkeys are unavailable here. Use your recovery passphrase.");
  const salt = decode(record.salt), id = decode(record.id);
  const credential = await navigator.credentials.get({ publicKey: {
    challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: "public-key", id }],
    userVerification: "required", timeout: 60_000,
    extensions: { prf: { eval: { first: salt } } } as PrfExtensions,
  } }) as PublicKeyCredential | null;
  if (!credential || encode(new Uint8Array(credential.rawId)) !== record.id) throw new Error("Passkey was cancelled. Try again or use your recovery passphrase.");
  const wrappingKey = await prfKey(credential, salt);
  const bytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(record.iv), additionalData: utf8.encode(key(wallet)) }, wrappingKey, decode(record.ciphertext)));
  try { return new TextDecoder().decode(bytes); } finally { bytes.fill(0); }
}
/** Backups carry only a password-wrapped key, never raw local unlock material. */
export function packageRecovery(wallet: string, text: string) {
  const record = readAuth(wallet);
  if (!record?.passphrase) throw new Error("Add a recovery passphrase in Security before saving a portable backup.");
  return JSON.stringify({ moneymoleRecovery: 1, key: record.passphrase, storageIdentity: record.storageIdentity, payload: JSON.parse(text) });
}
export async function unpackRecovery(wallet: string, text: string, password: string) {
  if (text.length > 3_000_000) throw new Error("Recovery file is too large.");
  const value = JSON.parse(text);
  if (value.moneymoleRecovery !== 1) return { text, password };
  if (value.storageIdentity !== undefined) storageIdentity(wallet, value.storageIdentity);
  return { text: JSON.stringify(value.payload), password: await unwrapPassphrase(wallet, value.key, password), ...(value.storageIdentity ? { storageIdentity: value.storageIdentity as string } : {}) };
}
