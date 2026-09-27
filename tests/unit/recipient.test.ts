import { expect, it } from "vitest";
import { ShieldedAddress, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";
import { bech32m } from "@scure/base";
import { validateRecipient } from "../../src/lib/midnight/payment-session";
const keys = new ShieldedAddress(ShieldedCoinPublicKey.fromHexString("30".repeat(32)), ShieldedEncryptionPublicKey.fromHexString("31".repeat(32)));
it("accepts the SDK's complete 132-character Preprod shielded address", () => {
  const address = ShieldedAddress.codec.encode("preprod", keys).asString();
  expect(address.length).toBe(132); expect(validateRecipient(address)).toBe(address);
});
it("rejects wrong network, address kind, byte length, checksum and noncanonical case", () => {
  const valid = ShieldedAddress.codec.encode("preprod", keys).asString();
  for (const address of [ShieldedAddress.codec.encode("preview", keys).asString(), keys.coinPublicKeyString(), bech32m.encode("mn_shield-addr_preprod", bech32m.toWords(new Uint8Array(63)), 256), valid.slice(0, -1) + (valid.endsWith("q") ? "p" : "q"), valid.toUpperCase(), "A".repeat(1000)]) expect(() => validateRecipient(address)).toThrow();
});
