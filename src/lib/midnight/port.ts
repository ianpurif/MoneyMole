import type { AssetMetadata, Network, SettlementObservation } from "../../domain/payment";
/** Implement against inspected 4.1.1 types; never return synthetic observations. */
export interface WalletIdentity { readonly network: Network; readonly publicIdentity: string; }
export interface FundingReadiness { readonly asset: AssetMetadata; readonly assetAtomicUnits: string; readonly feeReady: boolean; readonly proverReady: boolean; }
export interface MidnightPaymentPort {
  connect(): Promise<WalletIdentity>;
  disconnect(): Promise<void>;
  readiness(): Promise<FundingReadiness>;
  reconcile(transactionId: string): Promise<SettlementObservation | null>;
}
// Funding/claim interfaces are intentionally not frozen before the M1 coin and proof gates.
