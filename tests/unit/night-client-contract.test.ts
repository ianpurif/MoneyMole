import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { ChargedState, ContractState, sampleSigningKey } from "@midnight-ntwrk/compact-runtime";
import { LedgerParameters, ZswapChainState, nativeToken, sampleCoinPublicKey, sampleEncryptionPublicKey } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenDeployTxFromVerifierKeys, createUnprovenCallTxFromInitialStates } from "@midnight-ntwrk/midnight-js-contracts";
import { ZKConfigProvider, createVerifierKey, createProverKey, createZKIR } from "@midnight-ntwrk/midnight-js-types";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { paymentContract, ledger } from "../../src/lib/midnight/payment-contract";
import { noteDigest, spentDigest } from "../../src/lib/midnight/payment-crypto";
import type { ClaimPayload } from "../../src/lib/midnight/payment-codec";

class Keys extends ZKConfigProvider<"fund" | "claim"> {
  async getVerifierKey(c: "fund" | "claim") { return createVerifierKey(new Uint8Array(await readFile(`managed/night-payments/keys/${c}.verifier`))); }
  async getProverKey(c: "fund" | "claim") { return createProverKey(new Uint8Array(await readFile(`managed/night-payments/keys/${c}.prover`))); }
  async getZKIR(c: "fund" | "claim") { return createZKIR(new Uint8Array(await readFile(`managed/night-payments/zkir/${c}.bzkir`))); }
}

it("production witnesses and note/nullifier encoding agree with compiled NIGHT SDK calls", async () => {
  // Synthetic state only. No wallet, prover, signing or submission.
  setNetworkId("preprod");
  const compiledContract = paymentContract(), keys = new Keys();
  const coinPublicKey = sampleCoinPublicKey(), encryptionKey = sampleEncryptionPublicKey();
  const deployment = await createUnprovenDeployTxFromVerifierKeys(keys, coinPublicKey, { compiledContract, initialPrivateState: {}, signingKey: sampleSigningKey() }, encryptionKey);
  const payload: ClaimPayload = { version: 2, network: "preprod", contract: deployment.public.contractAddress, asset: nativeToken().raw, amount: "1234567", nonce: "19".repeat(32), authority: "20".repeat(32), fundingId: "00".repeat(32) };
  const common = { compiledContract, contractAddress: payload.contract, coinPublicKey, initialPrivateState: { payload }, initialZswapChainState: new ZswapChainState(), ledgerParameters: LedgerParameters.initialParameters() };
  const fund = await createUnprovenCallTxFromInitialStates(keys, { ...common, circuitId: "fund", initialContractState: deployment.public.initialContractState }, encryptionKey);
  expect(ledger(fund.public.nextContractState).notes.findPathForLeaf(noteDigest(payload))).toBeDefined();
  const funded = ContractState.deserialize(deployment.public.initialContractState.serialize());
  funded.data = new ChargedState(fund.public.nextContractState);
  funded.balance = new Map([[nativeToken(), BigInt(payload.amount)]]);
  const claim = await createUnprovenCallTxFromInitialStates(keys, { ...common, circuitId: "claim", args: [{ bytes: new Uint8Array(32).fill(21) }], initialContractState: funded }, encryptionKey);
  expect(ledger(claim.public.nextContractState).spent.member(spentDigest(payload))).toBe(true);
  const changed = { ...payload, amount: "1234568" };
  expect(ledger(fund.public.nextContractState).notes.findPathForLeaf(noteDigest(changed))).toBeUndefined();
});
