import test from "node:test";
import assert from "node:assert/strict";
import { parseAmount, formatAmount, parseAtomicUnits, MAX_SHIELDED_AMOUNT } from "../../src/domain/amount.ts";
test("six-decimal values use integer atomic units", () => assert.equal(parseAmount("1.234567", 6), 1_234_567n));
test("smallest precision unit is preserved", () => assert.equal(parseAmount("0.000001", 6), 1n));
test("balances render in display units", () => assert.equal(formatAmount(5_000_000_000n, 6), "5000"));
test("trailing zeros are display-only", () => assert.equal(formatAmount(123_450n, 4), "12.345"));
test("zero balance is displayable but not fundable", () => { assert.equal(formatAmount(0n, 6), "0"); assert.throws(() => parseAmount("0", 6)); });
test("maximum amount round trips", () => { const display = formatAmount(MAX_SHIELDED_AMOUNT, 18); assert.equal(parseAmount(display, 18), MAX_SHIELDED_AMOUNT); });
test("serialized atomic maximum round trips", () => assert.equal(parseAtomicUnits(MAX_SHIELDED_AMOUNT.toString()), MAX_SHIELDED_AMOUNT));
for (const input of ["-1", "1e3", "1,000", " 1", "1 ", "01", ".1", "1.", "NaN", "Infinity", "", "0.0000001"]) {
  test(`invalid decimal syntax or precision rejected: ${JSON.stringify(input)}`, () => assert.throws(() => parseAmount(input, 6)));
}
test("uint128 overflow rejected", () => assert.throws(() => parseAmount((MAX_SHIELDED_AMOUNT + 1n).toString(), 0)));
test("serialized decimal and signed values rejected", () => { for (const input of ["1.0", "-1", "+1", "00", "1e2"]) assert.throws(() => parseAtomicUnits(input)); });
test("precision must be bounded integer", () => { for (const d of [-1, 19, 1.5]) assert.throws(() => parseAmount("1", d)); });
test("long input is rejected before conversion", () => assert.throws(() => parseAmount("1".repeat(81), 0)));
