import { requirePassphrase } from "../private-state/passphrase";
import "client-only";
import preprod from "../../../config/preprod.json";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Contract, type Witnesses } from "../../../managed/test-asset/contract/index.js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { sampleSigningKey } from "@midnight-ntwrk/compact-runtime";
import { CostModel, Transaction, ContractDeploy } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenDeployTxFromVerifierKeys } from "@midnight-ntwrk/midnight-js-contracts";
import { ZKConfigProvider, createZKIR, createProverKey, createVerifierKey } from "@midnight-ntwrk/midnight-js-types";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";
import { BrowserPrivateStore } from "../private-state/indexed-db";
import { finalized } from "./payment-network";

const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const unhex = (value: string) => { if (!/^(?:[a-f0-9]{2})+$/.test(value)) throw new Error("Invalid local transaction encoding"); return Uint8Array.from(value.match(/../g)!, b => Number.parseInt(b, 16)); };
type PrivateState = { authority: Uint8Array };
const witnesses: Witnesses<PrivateState> = {
  issuerAuthority: ({ privateState }) => [privateState, privateState.authority],
  mintNonce: () => { throw new Error("Issuance is not part of deployment"); },
};
class IssuerKeys extends ZKConfigProvider<"issue"> {
  private async read(kind: string): Promise<Uint8Array> {
    const response = await fetch(`/api/artifacts/test-asset/${kind}/issue`, { cache: "no-store" });
    if (!response.ok) throw new Error("Compiled issuer artifacts unavailable");
    return new Uint8Array(await response.arrayBuffer());
  }
  async getZKIR() { return createZKIR(await this.read("bzkir")); }
  async getProverKey() { return createProverKey(await this.read("prover")); }
  async getVerifierKey() { return createVerifierKey(await this.read("verifier")); }
}
type Draft = { version: 1; address: string; authority: string; maintenanceKey: string; transaction: string; initialState: string; phase: "prepared" | "authorization_requested" | "outcome_unknown" | "submitted" | "finalized"; transactionId?: string; blockHash?: string; transactionHash?: string };
export type DeploymentReview = { address: string; phase: Draft["phase"]; transactionId?: string; blockHash?: string; transactionHash?: string };

/** No transaction is submitted while preparing. Secrets never leave this client module. */
export async function prepareIssuer(api: ConnectedAPI, password: string) {
  requirePassphrase(password);
  if ((await api.getConfiguration()).networkId !== "preprod") throw new Error("Select Preprod.");
  const addresses = await api.getShieldedAddresses();
  const coinKey = ShieldedCoinPublicKey.codec.decode("preprod", MidnightBech32m.parse(addresses.shieldedCoinPublicKey)).toHexString();
  const encKey = ShieldedEncryptionPublicKey.codec.decode("preprod", MidnightBech32m.parse(addresses.shieldedEncryptionPublicKey)).toHexString();
  const walletId = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(coinKey))));
  const namespace = { network: "preprod" as const, contractAddress: "issuer-deployment-staging-v1", walletIdentity: walletId, schemaVersion: 1 };
  const store = await BrowserPrivateStore.unlock(namespace, password, !await BrowserPrivateStore.exists(namespace));
  let revision = 0, draft: Draft;
  const saved = await store.read("deployment");
  if (saved) {
    try { draft = JSON.parse(new TextDecoder().decode(saved.plaintext)) as Draft; }
    finally { saved.plaintext.fill(0); }
    if (draft.version !== 1 || !/^[a-f0-9]{64}$/.test(draft.address) || !/^[a-f0-9]{64}$/.test(draft.authority) || typeof draft.maintenanceKey !== "string" || !draft.maintenanceKey || !/^(?:[a-f0-9]{2})+$/.test(draft.transaction) || !/^(?:[a-f0-9]{2})+$/.test(draft.initialState) || !["prepared", "authorization_requested", "outcome_unknown", "submitted", "finalized"].includes(draft.phase) || (["outcome_unknown", "submitted", "finalized"].includes(draft.phase) && typeof draft.transactionId !== "string")) { store.lock(); throw new Error("Invalid deployment recovery record; preserve it."); }
    revision = saved.revision;
  } else {
    setNetworkId("preprod");
    const authority = crypto.getRandomValues(new Uint8Array(32));
    const maintenanceKey = sampleSigningKey();
    const compiledContract = CompiledContract.make("test-asset", Contract<PrivateState>).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets("test-asset"));
    const data = await createUnprovenDeployTxFromVerifierKeys(new IssuerKeys(), coinKey, { compiledContract, initialPrivateState: { authority }, signingKey: maintenanceKey }, encKey);
    // Constructors contain no coin movement or circuit call; any prover request is unexpected.
    const proven = await data.private.unprovenTx.prove({ check: async () => { throw new Error("Unexpected deployment proof request"); }, prove: async () => { throw new Error("Unexpected deployment proof request"); } }, CostModel.initialCostModel());
    draft = { version: 1, address: data.public.contractAddress, authority: hex(authority), maintenanceKey, transaction: hex(proven.serialize()), initialState: hex(data.public.initialContractState.serialize()), phase: "prepared" };
    authority.fill(0);
    const bytes = new TextEncoder().encode(JSON.stringify(draft));
    try { revision = await store.write("deployment", bytes, 0); } finally { bytes.fill(0); }
  }
  store.onLock(() => { draft.authority = ""; draft.maintenanceKey = ""; draft.transaction = ""; });
  const persist = async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(draft));
    try { revision = await store.write("deployment", bytes, revision); } finally { bytes.fill(0); }
  };
  const review = (): DeploymentReview => ({ address: draft.address, phase: draft.phase, ...(draft.transactionId ? { transactionId: draft.transactionId } : {}), ...(draft.blockHash ? { blockHash: draft.blockHash, transactionHash: draft.transactionHash } : {}) });
  const reconcile = async (): Promise<DeploymentReview> => {
    if (!draft.transactionId) return review();
    // Public deployment address/identifier only; never send the draft/private state.
    const query = `fragment DeploymentData on ContractDeploy { state transaction { hash block { hash height } ... on RegularTransaction { identifiers transactionResult { status } } } } query Deployment($address: HexEncoded!) { contractAction(address: $address) { ... on ContractDeploy { ...DeploymentData } ... on ContractCall { deploy { ...DeploymentData } } } }`;
    const response = await fetch(preprod.indexerHttp, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables: { address: draft.address } }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Preprod indexer unavailable");
    const body = await response.json();
    if (body.errors) throw new Error("Preprod deployment query failed");
    const latest = body.data?.contractAction;
    const action = latest?.deploy ?? latest, tx = action?.transaction;
    if (!tx) return review();
    if (tx.transactionResult?.status !== "SUCCESS" || !tx.identifiers?.includes(draft.transactionId) || action.state !== draft.initialState || !/^[a-f0-9]{64}$/.test(tx.block?.hash ?? "")) throw new Error("Deployment observation does not match the prepared state");
    await finalized(tx.block);
    draft.phase = "finalized"; draft.blockHash = tx.block.hash; draft.transactionHash = tx.hash;
    await persist();
    return review();
  };
  return {
    review,
    reconcile,
    async exportEncrypted() {
      const records: Record<string, unknown> = {};
      for (const name of await store.keys()) if (["deployment", "issuance"].includes(name)) records[name] = JSON.parse(await store.exportEncrypted(name));
      return JSON.stringify({ version: 1, records });
    },
    async openIssuance() {
      await reconcile();
      if (draft.phase !== "finalized") throw new Error("Confirm deployment before issuance");
      const { openIssuance } = await import("./issuer-issuance");
      return openIssuance(api, store, draft.address, unhex(draft.authority), coinKey, encKey, new IssuerKeys());
    },
    lock: () => store.lock(),
    async approveAndSubmit(): Promise<DeploymentReview> {
      if (!["prepared", "authorization_requested"].includes(draft.phase)) throw new Error("Reconcile the existing deployment; do not redeploy.");
      const status = await api.getConnectionStatus();
      if (status.status !== "connected" || status.networkId !== "preprod" || (await api.getShieldedAddresses()).shieldedAddress !== addresses.shieldedAddress) throw new Error("Wallet changed; reconnect.");
      draft.phase = "authorization_requested"; await persist();
      const balanced = await api.balanceUnsealedTransaction(draft.transaction);
      if ((await api.getConfiguration()).networkId !== "preprod" || (await api.getShieldedAddresses()).shieldedAddress !== addresses.shieldedAddress) throw new Error("Wallet changed during authorization; reconnect");
      const sealed = Transaction.deserialize("signature", "proof", "binding", unhex(balanced.tx));
      const actions = [...(sealed.intents?.values() ?? [])].flatMap(intent => intent.actions);
      if (actions.length !== 1 || !(actions[0] instanceof ContractDeploy) || actions[0].address !== draft.address || hex(actions[0].initialState.serialize()) !== draft.initialState) throw new Error("Wallet changed the reviewed deployment");
      const transactionId = sealed.identifiers()[0];
      if (!transactionId) throw new Error("Wallet returned no transaction identifier");
      draft.transactionId = transactionId; draft.phase = "outcome_unknown";
      await persist(); // must be durable BEFORE invoking network submission
      await api.submitTransaction(balanced.tx);
      draft.phase = "submitted"; await persist();
      return reconcile();
    },
  };
}
