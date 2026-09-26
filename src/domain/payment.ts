/** Domain-only design contracts. None of these types is evidence of a real transaction. */
export type Network = "preprod";
export type AtomicUnits = string;
export type PaymentPhase = "draft" | "funding_pending" | "funded" | "claim_pending" | "claimed";
export type TransactionPhase = "not_submitted" | "awaiting_authorization" | "submitted" | "included" | "finalized" | "wallet_synced" | "rejected" | "outcome_unknown";
export interface AssetMetadata { readonly network: Network; readonly color: string; readonly symbol: string; readonly decimals: number; readonly redeemable: false; }
export interface PaymentIdentity { readonly network: Network; readonly contractAddress: string; readonly schemaVersion: 1; readonly localId: string; }
export interface ObservedTransaction { readonly transactionId: string; readonly phase: TransactionPhase; readonly observedAt: string; }
export interface SettlementObservation {
  readonly network: Network; readonly contractAddress: string; readonly transactionId: string;
  readonly finalizedBlock: string; readonly assetColor: string; readonly atomicUnits: AtomicUnits;
  readonly receiverWalletSynced: boolean; readonly receiverCoinSpendabilityVerified: boolean;
}
export interface PaymentRecord extends PaymentIdentity {
  readonly phase: PaymentPhase;
  readonly transaction: ObservedTransaction | null;
  readonly receiptTrust: "local_unverified" | "chain_verified";
}
export class CapabilityUnavailable extends Error {
  constructor(capability: string) { super(`${capability} is not implemented or verified`); this.name = "CapabilityUnavailable"; }
}
