import { describe, expect, it } from "vitest";
import { transitionTransaction as step, type TransactionState } from "../../src/domain/transaction";

const prepared: TransactionState = { phase: "prepared", intentId: "local-intent" };
describe("transaction recovery guards", () => {
  it("requires durable intent before authorization", () => {
    expect(() => step({ phase: "draft" }, { type: "request_authorization" })).toThrow();
  });
  it("preserves a rejected draft for an explicit retry", () => {
    const waiting = step(prepared, { type: "request_authorization" });
    const rejected = step(waiting, { type: "authorization_rejected" });
    expect(step(rejected, { type: "request_authorization" })).toEqual(waiting);
  });
  it("records uncertainty before submission and cannot retry without reconciliation", () => {
    const waiting = step(prepared, { type: "request_authorization" });
    const unknown = step(waiting, { type: "submission_started" });
    expect(unknown).toEqual({ phase: "outcome_unknown", intentId: "local-intent", transactionId: null });
    expect(() => step(unknown, { type: "request_authorization" })).toThrow();
    expect(() => step(unknown, { type: "authorization_rejected" })).toThrow();
    expect(() => step(unknown, { type: "observed_finalized", transactionId: "other", blockId: "block" })).toThrow();
  });
  it("reconciles the original submission after losing a response", () => {
    const submitted: TransactionState = { phase: "submitted", intentId: "local-intent", transactionId: "tx-original" };
    const unknown = step(submitted, { type: "connection_lost" });
    expect(() => step(unknown, { type: "observed_finalized", transactionId: "tx-other", blockId: "b" })).toThrow();
    const finalized = step(unknown, { type: "observed_finalized", transactionId: "tx-original", blockId: "b" });
    expect(finalized.phase).toBe("finalized");
    expect(step(finalized, { type: "observed_wallet_synced", transactionId: "tx-original" }).phase).toBe("wallet_synced");
    expect(() => step(finalized, { type: "observed_included", transactionId: "tx-original" })).toThrow();
    expect(() => step(finalized, { type: "request_authorization" })).toThrow();
  });
  it("cannot confuse inclusion with wallet synchronization", () => {
    expect(() => step({ phase: "included", intentId: "i", transactionId: "t" }, { type: "observed_wallet_synced", transactionId: "t" })).toThrow();
  });
});
