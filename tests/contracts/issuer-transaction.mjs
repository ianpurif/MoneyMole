import assert from "node:assert/strict";
import { Contract } from "../../managed/test-asset/contract/index.js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { sampleSigningKey } from "@midnight-ntwrk/compact-runtime";
import { CostModel, LedgerParameters, ZswapChainState, sampleCoinPublicKey, sampleEncryptionPublicKey, Transaction, ContractCall } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenDeployTxFromVerifierKeys, createUnprovenCallTxFromInitialStates } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

/** Synthetic constructor and issuance; genuine transaction proof, no wallet/network mutation. */
export async function proveIssuerTransaction(keys, prover) {
  setNetworkId("preprod");
  const authority = new Uint8Array(32).fill(17), nonce = new Uint8Array(32).fill(18);
  const compiledContract = CompiledContract.make("test-asset", Contract).pipe(CompiledContract.withWitnesses({ issuerAuthority: ({ privateState }) => [privateState, authority], mintNonce: ({ privateState }) => [privateState, nonce] }), CompiledContract.withCompiledFileAssets("test-asset"));
  const coinPublicKey = sampleCoinPublicKey(), enc = sampleEncryptionPublicKey();
  const deployment = await createUnprovenDeployTxFromVerifierKeys(keys, coinPublicKey, { compiledContract, initialPrivateState: {}, signingKey: sampleSigningKey() }, enc);
  const call = await createUnprovenCallTxFromInitialStates(keys, { compiledContract, circuitId: "issue", contractAddress: deployment.public.contractAddress, coinPublicKey, initialPrivateState: {}, initialContractState: deployment.public.initialContractState, initialZswapChainState: new ZswapChainState(), ledgerParameters: LedgerParameters.initialParameters() }, enc);
  const proven = await call.private.unprovenTx.prove(prover, CostModel.initialCostModel());
  const recovered = Transaction.deserialize("signature", "proof", "pre-binding", proven.serialize());
  const actions = [...recovered.intents.values()].flatMap(i => i.actions);
  assert.equal(actions.length, 1); assert(actions[0] instanceof ContractCall);
  assert.equal(actions[0].address, deployment.public.contractAddress);
  authority.fill(0); nonce.fill(0);
  return { transactionProofGeneration: "passed", proofTransactionRoundTrip: "passed", scope: "synthetic_unbalanced_transaction_not_sealed_or_submitted" };
}
