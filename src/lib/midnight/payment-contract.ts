import "client-only";
import { Contract, ledger, type Witnesses } from "../../../managed/private-payments/contract/index.js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { unhex, type ClaimPayload } from "./payment-codec";
export type PaymentPrivate = { payload?: ClaimPayload; index?: bigint };
const requirePayload = (p: PaymentPrivate) => { if (!p.payload) throw new Error("Missing private payment opening"); return p.payload; };
const witnesses: Witnesses<PaymentPrivate> = {
  fundingCoin: ({ privateState }) => { const p = requirePayload(privateState); return [privateState, { nonce: unhex(p.nonce, 32), color: unhex(p.asset, 32), value: BigInt(p.amount) }]; },
  escrowCoin: ({ privateState }) => { const p = requirePayload(privateState); if (privateState.index === undefined) throw new Error("Escrow coin is not qualified"); return [privateState, { nonce: unhex(p.nonce, 32), color: unhex(p.asset, 32), value: BigInt(p.amount), mt_index: privateState.index }]; },
  claimAuthority: ({ privateState }) => [privateState, unhex(requirePayload(privateState).authority, 32)],
  membership: ({ privateState, ledger: l }, note) => { const path = l.notes.findPathForLeaf(note); if (!path) throw new Error("Funded note not present in the current contract state"); return [privateState, path]; },
};
export const paymentContract = () => CompiledContract.make("private-payments", Contract<PaymentPrivate>).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets("private-payments"));
export { ledger };
