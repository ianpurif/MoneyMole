import { describe, it, expect } from "vitest";
import QRCode from "qrcode";
import { decodeClaim, encodeClaim, extractClaim, MAX_AMOUNT, type ClaimPayload } from "../../src/lib/midnight/payment-codec";

// Synthetic data only. Never print a real bearer payload from browser storage.
const opening = (amount = "10"): ClaimPayload => ({ version: 2, network: "preprod", contract: "01".repeat(32), asset: "00".repeat(32), nonce: "03".repeat(32), authority: "04".repeat(32), fundingId: "05".repeat(32), amount });
it("round-trips a Preprod 33-byte funding identifier without changing older links", async () => {
  const current = { ...opening(), fundingId: "00" + "05".repeat(32) };
  const encoded = await encodeClaim(current);
  expect(encoded).toMatch(/^mm3\./);
  expect(await decodeClaim(encoded)).toEqual(current);
  expect(await decodeClaim(await encodeClaim(opening()))).toEqual(opening());
});
describe("private bearer codec and local QR bounds", () => {
  it("round trips exact atomic STAR bounds without floating-point conversion", async () => {
    for (const amount of ["1", "10", MAX_AMOUNT.toString()]) {
      const source = opening(amount), encoded = await encodeClaim(source);
      expect(encoded.length).toBe(284);
      expect(JSON.stringify(await decodeClaim(encoded)) === JSON.stringify(source)).toBe(true);
    }
  });
  it("rejects legacy protocol and issuer assets without reinterpreting their units", async () => {
    await expect(encodeClaim({ ...opening(), asset: "02".repeat(32) })).rejects.toThrow();
    await expect(encodeClaim({ ...opening(), version: 1 } as unknown as ClaimPayload)).rejects.toThrow();
    const token = await encodeClaim(opening());
    await expect(decodeClaim(token.replace("mm2.", "mm1."))).rejects.toThrow();
  });
  it("rejects invalid and overflowing amounts before constructing a token", async () => {
    for (const amount of ["0", "-1", "1.1", "1e3", " 10", "01", (MAX_AMOUNT + 1n).toString()]) {
      await expect(encodeClaim(opening(amount))).rejects.toThrow();
    }
  });
  it("rejects altered opening fields, network and integrity tag", async () => {
    const token = await encodeClaim(opening());
    for (const index of [0, 1, 2, 34, 66, 98, 130, 162, 177, 178, 209]) {
      const bytes = Buffer.from(token.slice(4), "base64url"); bytes[index] = bytes[index]! ^ 1;
      await expect(decodeClaim(`mm2.${bytes.toString("base64url")}`)).rejects.toThrow();
    }
  });
  it("bounds malformed input and rejects noncanonical encodings", async () => {
    const token = await encodeClaim(opening());
    for (const malformed of ["", "mm2.", token + "=", token + "A", token.slice(0, -1), "A".repeat(100_000)]) {
      await expect(decodeClaim(malformed)).rejects.toThrow();
    }
  });
  it("extracts only a fragment token from the claim route", async () => {
    const token = await encodeClaim(opening());
    expect(extractClaim(`http://127.0.0.1:3000/claim#${token}`) === token).toBe(true);
    expect(extractClaim(`  ${token}  `) === token).toBe(true);
    expect(() => extractClaim(`http://127.0.0.1:3000/claim?payload=${token}`)).toThrow();
    expect(() => extractClaim(`http://127.0.0.1:3000/#${token}`)).toThrow();
  });
  it("renders the complete maximum-amount local link as a bounded QR without networking", async () => {
    const link = `http://127.0.0.1:3000/claim#${await encodeClaim(opening(MAX_AMOUNT.toString()))}`;
    const code = QRCode.create(link, { errorCorrectionLevel: "M" });
    expect(link.length).toBe(312);
    expect(320 / (code.modules.size + 8)).toBeGreaterThanOrEqual(4);
    expect((await QRCode.toDataURL(link, { errorCorrectionLevel: "M", margin: 4, width: 320 })).startsWith("data:image/png;base64,")).toBe(true);
  });
});
