import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPasskey, unlockPasskey, wrapPassphrase, unwrapPassphrase, saveAuth, packageRecovery, unpackRecovery, readAuth } from "../../src/lib/private-state/local-auth";
import { validPassphrase } from "../../src/lib/private-state/passphrase";
const wallet = "synthetic-wallet-a";
beforeEach(() => {
  const saved = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) });
  vi.stubGlobal("window", { isSecureContext: true });
  vi.stubGlobal("PublicKeyCredential", class {});
});
function credential(withPrf = true) {
  return { rawId: new Uint8Array([1, 2, 3]).buffer, getClientExtensionResults: () => withPrf ? { prf: { results: { first: new Uint8Array(32).fill(7).buffer } } } : {} };
}
describe("local passphrase and PRF encryption (synthetic credentials)", () => {
  it("accepts seven characters without weakening KDF or truncating legacy passwords", async () => {
    expect(validPassphrase("123456")).toBe(false); expect(validPassphrase("1234567")).toBe(true);
    expect(validPassphrase("😀😀😀😀")).toBe(false);
    const wrapped = await wrapPassphrase(wallet, "synthetic original long recovery password", "1234567");
    expect(wrapped.iterations).toBe(600_000);
    expect(await unwrapPassphrase(wallet, wrapped, "1234567")).toBe("synthetic original long recovery password");
    await expect(unwrapPassphrase(wallet, wrapped, "wrong-password")).rejects.toThrow();
    await expect(unwrapPassphrase("different-wallet", wrapped, "1234567")).rejects.toThrow();
  });
  it("requires PRF output and user verification to decrypt a passkey wrapper", async () => {
    const create = vi.fn(async (options: unknown) => { expect(options).toBeDefined(); return credential(); }), get = vi.fn(async () => credential());
    vi.stubGlobal("navigator", { credentials: { create, get } });
    const wrapped = await createPasskey(wallet, "synthetic local root secret");
    expect(JSON.stringify(wrapped)).not.toContain("synthetic local root secret");
    expect(await unlockPasskey(wallet, wrapped)).toBe("synthetic local root secret");
    expect(create.mock.calls[0]?.[0]).toMatchObject({ publicKey: { authenticatorSelection: { userVerification: "required" } } });
    await expect(unlockPasskey("other-wallet", wrapped)).rejects.toThrow();
  });
  it("fails closed when PRF is unavailable or a prompt is cancelled", async () => {
    vi.stubGlobal("navigator", { credentials: { create: async () => credential(false), get: async () => credential(false) } });
    await expect(createPasskey(wallet, "synthetic secret")).rejects.toThrow("cannot unlock");
    expect(readAuth(wallet)).toBeNull();
    vi.stubGlobal("navigator", { credentials: { create: async () => null } });
    await expect(createPasskey(wallet, "synthetic secret")).rejects.toThrow("cancelled");
  });
  it("makes passkey-backed exports portable using a separate fallback while preserving legacy imports", async () => {
    saveAuth(wallet, { version: 1, passphrase: await wrapPassphrase(wallet, "synthetic random encryption material", "backup7") });
    const text = '{"syntheticEncryptedRecord":true}';
    const exported = packageRecovery(wallet, text);
    expect(exported).not.toContain("synthetic random encryption material");
    expect(await unpackRecovery(wallet, exported, "backup7")).toEqual({ text, password: "synthetic random encryption material" });
    expect(await unpackRecovery(wallet, text, "legacy original passphrase")).toEqual({ text, password: "legacy original passphrase" });
  });
});
