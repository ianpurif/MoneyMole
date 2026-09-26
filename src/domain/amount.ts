/** Decimal display units <-> unsigned integer atomic units. Never use floating point. */
export const MAX_SHIELDED_AMOUNT = (1n << 128n) - 1n;
function checkDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new RangeError("Unsupported asset precision");
}
export function parseAmount(input: string, decimals: number): bigint {
  checkDecimals(decimals);
  if (input.length > 80 || !/^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(input)) throw new TypeError("Invalid decimal amount");
  const [whole = "", fraction = ""] = input.split(".");
  if (fraction.length > decimals) throw new RangeError("Too many fractional digits");
  const value = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
  if (value <= 0n || value > MAX_SHIELDED_AMOUNT) throw new RangeError("Amount out of range");
  return value;
}
export function formatAmount(value: bigint, decimals: number): string {
  checkDecimals(decimals);
  if (value < 0n || value > MAX_SHIELDED_AMOUNT) throw new RangeError("Amount out of range");
  if (decimals === 0) return value.toString();
  const divisor = 10n ** BigInt(decimals);
  const fraction = (value % divisor).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${value / divisor}.${fraction}` : (value / divisor).toString();
}
export function parseAtomicUnits(input: string): bigint {
  if (input.length > 39 || !/^(0|[1-9][0-9]*)$/.test(input)) throw new TypeError("Invalid serialized atomic units");
  const value = BigInt(input);
  if (value > MAX_SHIELDED_AMOUNT) throw new RangeError("Atomic units out of range");
  return value;
}
