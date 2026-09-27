import { expect, it } from "vitest";
import { UnshieldedAddress, ShieldedAddress, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";
import { bech32m } from "@scure/base";
import { validateRecipient, recipientKey } from "../../src/lib/midnight/payment-session";
const key = new UnshieldedAddress(Buffer.alloc(32, 48));
it("accepts a canonical Preprod NIGHT address and decodes its public destination", () => {
  const address = UnshieldedAddress.codec.encode("preprod", key).asString();
  expect(validateRecipient(address)).toBe(address); expect(recipientKey(address)).toBe("30".repeat(32));
});
it("rejects shielded, wrong-network, truncated, damaged and noncanonical addresses", () => {
  const valid = UnshieldedAddress.codec.encode("preprod", key).asString();
  const shielded = new ShieldedAddress(ShieldedCoinPublicKey.fromHexString("30".repeat(32)), ShieldedEncryptionPublicKey.fromHexString("31".repeat(32)));
  for (const address of [UnshieldedAddress.codec.encode("preview", key).asString(), ShieldedAddress.codec.encode("preprod", shielded).asString(), bech32m.encode("mn_addr_preprod", bech32m.toWords(new Uint8Array(31))), valid.slice(0, -1) + (valid.endsWith("q") ? "p" : "q"), valid.toUpperCase(), "A".repeat(1000)]) expect(() => validateRecipient(address)).toThrow();
});
