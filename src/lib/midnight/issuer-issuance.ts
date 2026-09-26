import "client-only";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Contract, ledger } from "../../../managed/test-asset/contract/index.js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { ContractCall, CostModel, LedgerParameters, Transaction, ZswapChainState, rawTokenType } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenCallTxFromInitialStates } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import type { BrowserPrivateStore } from "../private-state/indexed-db";

const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const bytes = (s: string) => { if (!/^(?:[a-f0-9]{2})+$/.test(s)) throw new Error("Invalid local encoding"); return Uint8Array.from(s.match(/../g)!, h => parseInt(h, 16)); };
type RecordData = { version: 1; nonce: string; transaction?: string; phase: "planned" | "prepared" | "authorization_requested" | "outcome_unknown" | "submitted" | "finalized"; transactionId?: string; blockHash?: string };
export type IssuanceReview = { phase: RecordData["phase"]; asset: string; amount: "1000000"; transactionId?: string; blockHash?: string; walletCredited: boolean };

/** Reads only public chain data. No wallet authority or opening is sent to the indexer. */
async function observation(address: string) {
  const query = `query Issuer($address: HexEncoded!) { contractAction(address: $address) { state zswapState transaction { block { hash ledgerParameters } ... on RegularTransaction { identifiers transactionResult { status } } } } }`;
  const response = await fetch("https://indexer.preprod.midnight.network/api/v4/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables: { address } }), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Indexer unavailable");
  const body = await response.json();
  if (body.errors || !body.data?.contractAction) throw new Error("Issuer state unavailable");
  return body.data.contractAction;
}

export async function openIssuance(api: ConnectedAPI, store: BrowserPrivateStore, address: string, authority: Uint8Array, coinKey: string, encKey: string, keys: ZKConfigProvider<"issue">) {
  setNetworkId("preprod");
  const connectedAddress = (await api.getShieldedAddresses()).shieldedAddress;
  const asset = rawTokenType(bytes(hex(new TextEncoder().encode("moneymole/test/v1")).padEnd(64, "0")), address);
  let revision = 0, record: RecordData, walletCredited = false;
  const saved = await store.read("issuance");
  if (saved) {
    try { record = JSON.parse(new TextDecoder().decode(saved.plaintext)); } finally { saved.plaintext.fill(0); }
    if (record.version !== 1 || !/^[a-f0-9]{64}$/.test(record.nonce) || !["planned", "prepared", "authorization_requested", "outcome_unknown", "submitted", "finalized"].includes(record.phase)) throw new Error("Preserve invalid issuance recovery record");
    revision = saved.revision;
  } else record = { version: 1, nonce: hex(crypto.getRandomValues(new Uint8Array(32))), phase: "planned" };
  async function persist() {
    const plaintext = new TextEncoder().encode(JSON.stringify(record));
    try { revision = await store.write("issuance", plaintext, revision); } finally { plaintext.fill(0); }
  }
  if (!saved) await persist();
  const review = (): IssuanceReview => ({ phase: record.phase, asset, amount: "1000000", ...(record.transactionId ? { transactionId: record.transactionId } : {}), ...(record.blockHash ? { blockHash: record.blockHash } : {}), walletCredited });
  async function checkWallet() {
    const status = await api.getConnectionStatus();
    if (status.status !== "connected" || status.networkId !== "preprod" || (await api.getShieldedAddresses()).shieldedAddress !== connectedAddress) throw new Error("Reconnect the issuing wallet");
    // The caller also runs OneAmSession.check to bind the connected account.
  }
  async function reconcile() {
    await checkWallet();
    const action = await observation(address), state = ContractState.deserialize(bytes(action.state));
    if (ledger(state.data).issued) {
      if (!record.transactionId || !action.transaction.identifiers?.includes(record.transactionId) || action.transaction.transactionResult?.status !== "SUCCESS") throw new Error("Issued state does not match this local transaction; do not retry");
      record.phase = "finalized"; record.blockHash = action.transaction.block.hash; await persist();
      walletCredited = (await api.getShieldedBalances())[asset] === 1000000n;
    }
    return review();
  }
  return {
    review, reconcile,
    async prepare() {
      await checkWallet();
      if (record.phase !== "planned") return review();
      const action = await observation(address), state = ContractState.deserialize(bytes(action.state));
      if (ledger(state.data).issued) throw new Error("Supply already issued; reconcile instead");
      const compiledContract = CompiledContract.make("test-asset", Contract<{ authority: Uint8Array }>).pipe(CompiledContract.withWitnesses({ issuerAuthority: ({ privateState }) => [privateState, privateState.authority], mintNonce: ({ privateState }) => [privateState, bytes(record.nonce)] }), CompiledContract.withCompiledFileAssets("test-asset"));
      const call = await createUnprovenCallTxFromInitialStates(keys, { compiledContract, circuitId: "issue", contractAddress: address, coinPublicKey: coinKey, initialPrivateState: { authority }, initialContractState: state, initialZswapChainState: ZswapChainState.deserialize(bytes(action.zswapState)), ledgerParameters: LedgerParameters.deserialize(bytes(action.transaction.block.ledgerParameters)) }, encKey);
      // Private proof preimages go directly to this trusted loopback service, never Next.js.
      const proven = await call.private.unprovenTx.prove(httpClientProvingProvider("http://127.0.0.1:6300", keys, { timeout: 120000 }), CostModel.initialCostModel());
      record.transaction = hex(proven.serialize()); record.phase = "prepared"; await persist();
      return review();
    },
    async approveAndSubmit() {
      await checkWallet();
      if (!["prepared", "authorization_requested"].includes(record.phase) || !record.transaction) throw new Error("Prepare or reconcile issuance first");
      const action = await observation(address);
      if (ledger(ContractState.deserialize(bytes(action.state)).data).issued) throw new Error("Supply already issued; do not retry");
      record.phase = "authorization_requested"; await persist();
      const original = Transaction.deserialize("signature", "proof", "pre-binding", bytes(record.transaction));
      const originalCalls = [...(original.intents?.values() ?? [])].flatMap(i => i.actions);
      const balanced = await api.balanceUnsealedTransaction(record.transaction);
      const sealed = Transaction.deserialize("signature", "proof", "binding", bytes(balanced.tx));
      const calls = [...(sealed.intents?.values() ?? [])].flatMap(i => i.actions);
      if (calls.length !== 1 || originalCalls.length !== 1 || !(calls[0] instanceof ContractCall) || calls[0].address !== address || calls[0].toString() !== originalCalls[0]!.toString()) throw new Error("Wallet changed the reviewed issuance call");
      const id = sealed.identifiers()[0]; if (!id) throw new Error("Missing transaction identifier");
      record.transactionId = id; record.phase = "outcome_unknown"; await persist();
      await api.submitTransaction(balanced.tx);
      record.phase = "submitted"; await persist();
      return reconcile();
    },
    exportEncrypted: () => store.exportEncrypted("issuance"),
    lock: () => { authority.fill(0); delete record.transaction; },
  };
}
