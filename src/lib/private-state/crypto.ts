import "client-only";
import type { PrivateNamespace } from "./port";
import { requirePassphrase } from "./passphrase";

export const KDF_ITERATIONS = 600_000;
export const MAX_PRIVATE_BYTES = 1_048_576;
const utf8 = new TextEncoder();
export interface EncryptedEnvelope {
  version: 1;
  kdf: "PBKDF2-SHA256";
  iterations: 600000;
  salt: string;
  iv: string;
  ciphertext: string;
}

export function namespaceId(namespace: PrivateNamespace): string {
  if (namespace.network !== "preprod" || ![1, 2].includes(namespace.schemaVersion) ||
      ![namespace.contractAddress, namespace.walletIdentity].every(v => typeof v === "string" && v.length > 0 && v.length <= 512)) {
    throw new Error("Invalid private namespace");
  }
  return JSON.stringify(["moneymole/private-state/v1", namespace.network, namespace.contractAddress, namespace.walletIdentity, namespace.schemaVersion]);
}
function aad(namespace: PrivateNamespace, record: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(record)) throw new Error("Invalid private record key");
  return utf8.encode(JSON.stringify([namespaceId(namespace), record]));
}
function encode(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
function decode(text: string, min: number, max: number): Uint8Array<ArrayBuffer> {
  if (typeof text !== "string" || text.length > Math.ceil(max / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error("Invalid encrypted record");
  const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
  if (bytes.length < min || bytes.length > max || encode(bytes) !== text) throw new Error("Invalid encrypted record");
  return bytes;
}
export function parseEnvelope(value: unknown): EncryptedEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid encrypted record");
  const e = value as Record<string, unknown>;
  if (Object.keys(e).sort().join() !== "ciphertext,iterations,iv,kdf,salt,version" || e.version !== 1 || e.kdf !== "PBKDF2-SHA256" || e.iterations !== KDF_ITERATIONS ||
      typeof e.salt !== "string" || typeof e.iv !== "string" || typeof e.ciphertext !== "string") throw new Error("Unsupported encrypted record");
  decode(e.salt, 16, 16); decode(e.iv, 12, 12); decode(e.ciphertext, 16, MAX_PRIVATE_BYTES + 16);
  return { version: 1, kdf: "PBKDF2-SHA256", iterations: KDF_ITERATIONS, salt: e.salt, iv: e.iv, ciphertext: e.ciphertext };
}

export class PrivateCipher {
  #key: CryptoKey | null;
  readonly salt: string;
  private constructor(key: CryptoKey, salt: string) { this.#key = key; this.salt = salt; }

  static async unlock(password: string, salt?: string): Promise<PrivateCipher> {
    const bytes = utf8.encode(password);
    requirePassphrase(password);
    const saltBytes = salt === undefined ? crypto.getRandomValues(new Uint8Array(16)) : decode(salt, 16, 16);
    try {
      const material = await crypto.subtle.importKey("raw", bytes, "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS, salt: saltBytes }, material,
        { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      return new PrivateCipher(key, encode(saltBytes));
    } finally { bytes.fill(0); }
  }
  lock(): void { this.#key = null; }
  async encrypt(namespace: PrivateNamespace, record: string, plaintext: Uint8Array): Promise<EncryptedEnvelope> {
    const key = this.#key;
    if (!key) throw new Error("Private store is locked");
    if (plaintext.byteLength > MAX_PRIVATE_BYTES) throw new Error("Private record too large");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad(namespace, record), tagLength: 128 }, key, new Uint8Array(plaintext));
    if (this.#key !== key) throw new Error("Private store locked during operation");
    return { version: 1, kdf: "PBKDF2-SHA256", iterations: KDF_ITERATIONS, salt: this.salt, iv: encode(iv), ciphertext: encode(new Uint8Array(ciphertext)) };
  }
  async decrypt(namespace: PrivateNamespace, record: string, value: unknown): Promise<Uint8Array<ArrayBuffer>> {
    const key = this.#key;
    if (!key) throw new Error("Private store is locked");
    const e = parseEnvelope(value);
    if (e.salt !== this.salt) throw new Error("Encrypted store salt mismatch");
    let result: Uint8Array<ArrayBuffer>;
    try {
      result = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(e.iv, 12, 12), additionalData: aad(namespace, record), tagLength: 128 }, key, decode(e.ciphertext, 16, MAX_PRIVATE_BYTES + 16)));
    } catch { throw new Error("Private record authentication failed; preserve the original data"); }
    if (this.#key !== key) { result.fill(0); throw new Error("Private store locked during operation"); }
    return result;
  }
}
