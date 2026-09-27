import { bech32m } from "@scure/base";

// Native unshielded token in the pinned ledger API. Keep balance reads independent
// of ledger WebAssembly; the unit test checks this against nativeToken().raw.
export const NATIVE_NIGHT_ASSET = "00".repeat(32);

/** Same namespace as the original SDK codec: SHA-256 of lowercase coin-key hex.
 * Decode only this public key here so login never loads transaction/prover code.
 */
export async function localWalletIdentity(coinPublicKey: string) {
  const { prefix, bytes } = bech32m.decodeToBytes(coinPublicKey);
  if (prefix !== "mn_shield-cpk_preprod" || bytes.length !== 32) throw new Error("Invalid Preprod wallet identity");
  const hex = (value: Uint8Array) => Array.from(value, b => b.toString(16).padStart(2, "0")).join("");
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hex(bytes)))));
}
