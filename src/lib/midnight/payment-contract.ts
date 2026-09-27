import "client-only";
import { Contract, ledger, type Witnesses } from "../../../managed/night-payments/contract/index.js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { unhex, type ClaimPayload } from "./payment-codec";
export type PaymentPrivate = { payload?: ClaimPayload };
const requirePayload = (p: PaymentPrivate) => { if (!p.payload) throw new Error("Missing private payment opening"); return p.payload; };
const witnesses: Witnesses<PaymentPrivate> = {
  paymentAmount: ({ privateState }) => [privateState, BigInt(requirePayload(privateState).amount)],
  paymentNonce: ({ privateState }) => [privateState, unhex(requirePayload(privateState).nonce, 32)],
  claimAuthority: ({ privateState }) => [privateState, unhex(requirePayload(privateState).authority, 32)],
  membership: ({ privateState, ledger: l }, note) => { const path = l.notes.findPathForLeaf(note); if (!path) throw new Error("Funded note not present in the current contract state"); return [privateState, path]; },
};
export const paymentContract = () => CompiledContract.make("night-payments", Contract<PaymentPrivate>).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets("night-payments"));
export { ledger };
