import { describe, expect, it } from "vitest";
import { parseAmount, formatAmount, parseAtomicUnits, MAX_SHIELDED_AMOUNT } from "../../src/domain/amount";
describe("amount serialization", () => {
  it("keeps six-decimal precision", () => expect(parseAmount("0.000001", 6)).toBe(1n));
  it("formats balance units", () => expect(formatAmount(5_000_000_000n, 6)).toBe("5000"));
  it("round trips the ledger maximum", () => expect(parseAtomicUnits(MAX_SHIELDED_AMOUNT.toString())).toBe(MAX_SHIELDED_AMOUNT));
  it.each(["0", "-1", "1e3", "1,000", " 1", "01", "NaN"])("rejects %s", input => expect(() => parseAmount(input, 6)).toThrow());
});
