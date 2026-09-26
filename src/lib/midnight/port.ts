import type { AssetMetadata, Network, SettlementObservation } from "../../domain/payment";
/** Legacy domain port. Concrete browser operations are typed by payment-session.ts and payments.ts. */
export interface WalletIdentity { readonly network: Network; readonly publicIdentity: string; }
export interface FundingReadiness { readonly asset: AssetMetadata; readonly assetAtomicUnits: string; readonly feeReady: boolean; readonly proverReady: boolean; }
export interface MidnightPaymentPort {
  connect(): Promise<WalletIdentity>;
  disconnect(): Promise<void>;
  readiness(): Promise<FundingReadiness>;
  reconcile(transactionId: string): Promise<SettlementObservation | null>;
}
// Production UI uses the concrete typed controller in payments.ts.
