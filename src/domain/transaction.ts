/** Local recovery state only. This module cannot certify a payment or receipt. */
export type TransactionState =
  | { phase: "draft" }
  | { phase: "prepared"; intentId: string }
  | { phase: "awaiting_authorization"; intentId: string }
  | { phase: "rejected"; intentId: string }
  | { phase: "outcome_unknown"; intentId: string; transactionId: string | null }
  | { phase: "submitted" | "included"; intentId: string; transactionId: string }
  | { phase: "finalized" | "wallet_synced"; intentId: string; transactionId: string; blockId: string };

export type TransactionEvent =
  | { type: "intent_persisted"; intentId: string }
  | { type: "request_authorization" }
  | { type: "authorization_rejected" }
  | { type: "submission_started" }
  | { type: "submitted"; transactionId: string }
  | { type: "connection_lost" }
  | { type: "observed_included"; transactionId: string }
  | { type: "observed_finalized"; transactionId: string; blockId: string }
  | { type: "observed_wallet_synced"; transactionId: string };

function identifier(value: string): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 256 || value.trim() !== value) {
    throw new Error("Invalid transaction reference");
  }
  return value;
}

/** Persist every returned state before side effects; observations must come from the SDK adapter. */
export function transitionTransaction(state: TransactionState, event: TransactionEvent): TransactionState {
  if (event.type === "intent_persisted" && state.phase === "draft") {
    return { phase: "prepared", intentId: identifier(event.intentId) };
  }
  if (state.phase === "draft") throw new Error("Persist intent before authorization");
  const intentId = state.intentId;
  if (event.type === "request_authorization" && ["prepared", "rejected"].includes(state.phase)) {
    return { phase: "awaiting_authorization", intentId };
  }
  if (event.type === "authorization_rejected" && state.phase === "awaiting_authorization") {
    return { phase: "rejected", intentId };
  }
  // Persist uncertainty BEFORE invoking a submission API. A crash cannot authorize retry.
  if (event.type === "submission_started" && state.phase === "awaiting_authorization") {
    return { phase: "outcome_unknown", intentId, transactionId: null };
  }
  if (event.type === "submitted" && state.phase === "outcome_unknown" && state.transactionId === null) {
    return { phase: "submitted", intentId, transactionId: identifier(event.transactionId) };
  }
  if (event.type === "connection_lost" && ["awaiting_authorization", "submitted", "included", "outcome_unknown"].includes(state.phase)) {
    return { phase: "outcome_unknown", intentId, transactionId: "transactionId" in state ? state.transactionId : null };
  }
  if (["submitted", "included", "outcome_unknown", "finalized", "wallet_synced"].includes(state.phase) &&
      "transactionId" in event && "transactionId" in state && state.transactionId !== null) {
    if (identifier(event.transactionId) !== state.transactionId) throw new Error("Transaction reference mismatch");
    if (event.type === "observed_included" && ["submitted", "included", "outcome_unknown"].includes(state.phase)) {
      return { phase: "included", intentId, transactionId: state.transactionId };
    }
    if (event.type === "observed_finalized" && ["submitted", "included", "outcome_unknown"].includes(state.phase)) {
      return { phase: "finalized", intentId, transactionId: state.transactionId, blockId: identifier(event.blockId) };
    }
    if (event.type === "observed_wallet_synced" && state.phase === "finalized") {
      return { ...state, phase: "wallet_synced" };
    }
  }
  throw new Error("Transaction transition is not allowed; reconcile before retry");
}
