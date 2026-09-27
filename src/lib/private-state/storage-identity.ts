/** A fresh local workspace never changes the authorized blockchain wallet. */
export class RecoveryWorkspaceMismatch extends Error {
  constructor() { super("This backup belongs to another local workspace. Lock MoneyMole, then switch to its preserved workspace or use Forgot recovery passphrase → Unlock from backup."); }
}
export function storageIdentity(wallet: string, requested?: string): string {
  if (requested === undefined || requested === wallet) return wallet;
  if (!requested.startsWith(`${wallet}/local/`) || !/^[a-f0-9-]{36}$/.test(requested.slice(wallet.length + 7)))
    throw new Error("Local authentication workspace does not belong to this wallet.");
  return requested;
}
