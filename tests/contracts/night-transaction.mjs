import assert from "node:assert/strict";
import { Contract } from "../../managed/night-payments/contract/index.js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { sampleSigningKey, ContractState, ChargedState } from "@midnight-ntwrk/compact-runtime";
import { CostModel, LedgerParameters, ZswapChainState, sampleCoinPublicKey, sampleEncryptionPublicKey, Transaction, ContractCall, nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenDeployTxFromVerifierKeys, createUnprovenCallTxFromInitialStates } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

/** Actual SDK construction/proving/serialization. Synthetic state; never signs or submits. */
export async function proveNightTransactions(keys, prover) {
  setNetworkId("preprod");
  const state = { amount: 1_234_567n, nonce: new Uint8Array(32).fill(19), authority: new Uint8Array(32).fill(20) };
  const compiledContract = CompiledContract.make("night-payments", Contract).pipe(CompiledContract.withWitnesses({
    paymentAmount: ({ privateState: p }) => [p, p.amount], paymentNonce: ({ privateState: p }) => [p, p.nonce], claimAuthority: ({ privateState: p }) => [p, p.authority],
    membership: ({ privateState: p, ledger: l }, note) => { const path = l.notes.findPathForLeaf(note); assert(path); return [p, path]; },
  }), CompiledContract.withCompiledFileAssets("night-payments"));
  const coinPublicKey = sampleCoinPublicKey(), enc = sampleEncryptionPublicKey();
  const deployment = await createUnprovenDeployTxFromVerifierKeys(keys, coinPublicKey, { compiledContract, initialPrivateState: state, signingKey: sampleSigningKey() }, enc);
  const common = { compiledContract, contractAddress: deployment.public.contractAddress, coinPublicKey, initialPrivateState: state, initialZswapChainState: new ZswapChainState(), ledgerParameters: LedgerParameters.initialParameters() };
  const fund = await createUnprovenCallTxFromInitialStates(keys, { ...common, circuitId: "fund", initialContractState: deployment.public.initialContractState }, enc);
  const fundedState = ContractState.deserialize(deployment.public.initialContractState.serialize());
  fundedState.data = new ChargedState(fund.public.nextContractState);
  // Simulate only the public deposited balance; no claim of ledger execution.
  fundedState.balance = new Map([[nativeToken(), state.amount]]);
  const recipient = new Uint8Array(32).fill(21);
  const claim = await createUnprovenCallTxFromInitialStates(keys, { ...common, circuitId: "claim", args: [{ bytes: recipient }], initialContractState: fundedState }, enc);
  const checks = [];
  for (const [entry, call] of [["fund", fund], ["claim", claim]]) {
    const proven = await call.private.unprovenTx.prove(prover, CostModel.initialCostModel());
    const recovered = Transaction.deserialize("signature", "proof", "pre-binding", proven.serialize());
    const actions = [...recovered.intents.values()].flatMap(i => i.actions);
    assert.equal(actions.length, 1); assert(actions[0] instanceof ContractCall); assert.equal(actions[0].address, deployment.public.contractAddress);
    const effects = [actions[0].guaranteedTranscript?.effects, actions[0].fallibleTranscript?.effects].filter(Boolean);
    const amount = effects.flatMap(e => [...(entry === "fund" ? e.unshieldedInputs : e.unshieldedOutputs)]).filter(([t]) => t.tag === "unshielded" && t.raw === nativeToken().raw).reduce((sum, [,value]) => sum + value, 0n);
    assert.equal(amount, state.amount);
    assert(effects.every(e => !e.shieldedMints.size && !e.unshieldedMints.size));
    if (entry === "claim") {
      const outputs = [...recovered.intents.values()].flatMap(i => [i.guaranteedUnshieldedOffer, i.fallibleUnshieldedOffer]).flatMap(o => o?.outputs ?? []);
      assert(outputs.some(o => o.owner === Buffer.from(recipient).toString("hex") && o.type === nativeToken().raw && o.value === state.amount));
    }
    checks.push({ circuit: entry, proofGeneration: "passed", transactionRoundTrip: "passed", nativeEffects: "passed" });
  }
  state.authority.fill(0); state.nonce.fill(0);
  return { scope: "synthetic_unbalanced_night_transactions_not_sealed_or_submitted", checks };
}
