export const MIN_PASSPHRASE_CHARACTERS = 7;
/** App-local encryption only. Never applied to wallet or protocol secrets. */
export function validPassphrase(value: string): boolean {
  return [...value].length >= MIN_PASSPHRASE_CHARACTERS && new TextEncoder().encode(value).length <= 1024;
}
export function requirePassphrase(value: string): void {
  if (!validPassphrase(value)) throw new Error("Use at least 7 characters, up to 1,024 bytes. Enter your MoneyMole passphrase, never a wallet seed or private key.");
}
