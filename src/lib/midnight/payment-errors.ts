import { WalletReadUnavailable, WalletSessionInvalid } from "./wallet-reads";
export type PaymentErrorCode = "wallet" | "wallet-read" | "wallet-busy" | "night" | "dust" | "network" | "artifacts" | "prover" | "prepare" | "storage" | "busy" | "pending" | "failed" | "approval" | "address" | "sync";
const messages: Record<PaymentErrorCode, string> = {
  wallet: "Your wallet account or network changed. Reconnect the original wallet on Preprod, then resume this payment.",
  "wallet-read": "Your wallet has not answered yet. Open it and let it finish syncing, then retry. Your saved progress is safe.",
  "wallet-busy": "Your wallet is receiving too many requests. Pause other wallet tabs, wait a moment, then retry.",
  night: "Your wallet needs more NIGHT for this amount. Add NIGHT or start a payment for a smaller amount.",
  dust: "Your wallet needs available DUST to pay fees. Wait for DUST to become available, then retry.",
  network: "The network could not confirm this payment yet. Check your connection and retry. Your saved progress is safe.",
  artifacts: "Payment files could not be verified. Reload the app and resume this payment.",
  prover: "The local proof service could not prepare this payment. Start or reconnect the local prover, then retry preparation.",
  prepare: "This payment could not be prepared from the current escrow state. Retry preparation to refresh it.",
  storage: "Your payment could not be saved securely. Keep this browser’s data, unlock MoneyMole if needed, then resume.",
  busy: "This payment is already open in another operation or tab. Let it finish, then resume here.",
  pending: "Confirmation is still pending. Check again to continue; this will not send another payment.",
  failed: "The network confirmed that this attempt failed. Your saved record is preserved.",
  approval: "Wallet approval did not complete. Unlock your wallet and retry approval when ready.",
  address: "Enter another wallet’s valid Preprod NIGHT address.",
  sync: "Wait for your wallet to synchronize the received NIGHT, then retry. Unrelated transfers can prevent verification of the original balance change.",
};
export class PaymentError extends Error {
  constructor(readonly code: PaymentErrorCode) { super(messages[code]); }
}
export async function paymentStep<T>(code: PaymentErrorCode, action: () => Promise<T>): Promise<T> {
  try { return await action(); } catch (error) { throw error instanceof PaymentError ? error : error instanceof WalletSessionInvalid ? new PaymentError("wallet") : error instanceof WalletReadUnavailable ? new PaymentError(error.reason === "rate-limit" ? "wallet-busy" : "wallet-read") : new PaymentError(code === "wallet" ? "wallet-read" : code); }
}
export function paymentErrorMessage(error: unknown, fallback: PaymentErrorCode) {
  return error instanceof PaymentError ? error.message : messages[fallback];
}
