import { describe, expect, it } from "vitest";
import { PrivateCipher, parseEnvelope } from "../../src/lib/private-state/crypto";
const namespace = { network: "preprod", contractAddress: "test-contract", walletIdentity: "test-wallet", schemaVersion: 1 } as const;
const password = "synthetic test password only";
const bytes = new TextEncoder().encode("synthetic fixture, not a claim");

describe("client-only private encryption", () => {
  it("round trips after reload with fresh nonces and independently supplied unlock material", async () => {
    const cipher = await PrivateCipher.unlock(password);
    const a = await cipher.encrypt(namespace, "intent", bytes);
    const b = await cipher.encrypt(namespace, "intent", bytes);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(JSON.stringify(a)).not.toContain(password);
    cipher.lock();
    await expect(cipher.decrypt(namespace, "intent", a)).rejects.toThrow("locked");
    const reopened = await PrivateCipher.unlock(password, a.salt);
    expect(await reopened.decrypt(namespace, "intent", a)).toEqual(bytes);
    reopened.lock();
  });
  it("rejects wrong password, record key, namespace and ciphertext tampering", async () => {
    const cipher = await PrivateCipher.unlock(password);
    const envelope = await cipher.encrypt(namespace, "intent", bytes);
    for (const changed of [{ ...namespace, walletIdentity: "other" }, { ...namespace, contractAddress: "other" }]) {
      await expect(cipher.decrypt(changed, "intent", envelope)).rejects.toThrow("authentication failed");
    }
    await expect(cipher.decrypt(namespace, "other", envelope)).rejects.toThrow("authentication failed");
    const corrupted = { ...envelope, ciphertext: (envelope.ciphertext[0] === "A" ? "B" : "A") + envelope.ciphertext.slice(1) };
    await expect(cipher.decrypt(namespace, "intent", corrupted)).rejects.toThrow("authentication failed");
    const wrong = await PrivateCipher.unlock("a different synthetic password", envelope.salt);
    await expect(wrong.decrypt(namespace, "intent", envelope)).rejects.toThrow("authentication failed");
    cipher.lock(); wrong.lock();
  });
  it("rejects unsupported versions, KDF downgrade, extra fields and oversized inputs", async () => {
    const cipher = await PrivateCipher.unlock(password);
    const e = await cipher.encrypt(namespace, "intent", bytes);
    expect(() => parseEnvelope({ ...e, iterations: 1 })).toThrow();
    expect(() => parseEnvelope({ ...e, version: 2 })).toThrow();
    expect(() => parseEnvelope({ ...e, key: "must never be saved" })).toThrow();
    await expect(cipher.encrypt(namespace, "intent", new Uint8Array(1_048_577))).rejects.toThrow();
    await expect(PrivateCipher.unlock("short")).rejects.toThrow();
    cipher.lock();
  });
  it("does not return plaintext when locked during an operation", async () => {
    const cipher = await PrivateCipher.unlock(password);
    const e = await cipher.encrypt(namespace, "intent", bytes);
    const pending = cipher.decrypt(namespace, "intent", e);
    cipher.lock();
    await expect(pending).rejects.toThrow("locked during");
  });
});
