import "client-only";
import { sampleSigningKey } from "@midnight-ntwrk/compact-runtime";
import { CostModel, ContractDeploy, Transaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createUnprovenDeployTxFromVerifierKeys } from "@midnight-ntwrk/midnight-js-contracts";
import { paymentContract } from "./payment-contract";
import { hex, unhex } from "./payment-codec";
import { PaymentKeys, verifiedPaymentState } from "./payment-network";
import { openStore, paymentAsset, readRecord, writeRecord, submitPrepared, reconcileTx, validateTx, type WalletContext, type TxRecord } from "./payment-session";
type Build = { sourceHash: string; buildHash: string; toolchainHash: string };
type Deployment = { version: 1; address: string; signingKey: string; initialState: string; build: Build; tx: TxRecord };
export async function openPaymentDeployment(wallet: WalletContext, password: string) {
  const store = await openStore(wallet, "payment-deployment-staging-v1", password);
  let found = await readRecord<Deployment>(store, "deployment");
  if (!found) {
    const response = await fetch("/api/build", { cache: "no-store" }); if (!response.ok) throw new Error("Build metadata unavailable");
    const build = await response.json() as Build; for (const h of [build.sourceHash, build.buildHash, build.toolchainHash]) unhex(h, 32);
    const signingKey = sampleSigningKey();
    const data = await createUnprovenDeployTxFromVerifierKeys(new PaymentKeys(), wallet.coinKey, { compiledContract: paymentContract(), initialPrivateState: {}, signingKey, args: [unhex(paymentAsset(), 32)] }, wallet.encKey);
    const proven = await data.private.unprovenTx.prove({ check: async () => { throw new Error("Unexpected constructor proof"); }, prove: async () => { throw new Error("Unexpected constructor proof"); } }, CostModel.initialCostModel());
    const value: Deployment = { version: 1, address: data.public.contractAddress, signingKey, initialState: hex(data.public.initialContractState.serialize()), build, tx: { phase: "prepared", transaction: hex(proven.serialize()) } };
    found = { value, revision: await writeRecord(store, "deployment", value, 0) };
  }
  const d = found.value; let revision = found.revision, verified = false;
  if (d.version !== 1) throw new Error("Unsupported deployment recovery"); unhex(d.address, 32); validateTx(d.tx);
  const persist = async () => { revision = await writeRecord(store, "deployment", d, revision); };
  const review = () => ({ address: d.address, asset: paymentAsset(), phase: d.tx.phase, transactionId: d.tx.transactionId, verified });
  async function reconcile() {
    const observed = await reconcileTx(d.tx, persist);
    if (!observed || d.tx.phase !== "finalized") return review();
    const tx = Transaction.deserialize("signature", "proof", "binding", unhex(observed.raw));
    const matches = [...(tx.intents?.values() ?? [])].flatMap(i => i.actions).filter(a => a instanceof ContractDeploy && a.address === d.address && hex(a.initialState.serialize()) === d.initialState);
    if (matches.length !== 1) throw new Error("Deployment identity mismatch");
    await verifiedPaymentState(d.address, paymentAsset()); verified = true; return review();
  }
  return {
    review, reconcile,
    async approve() { await submitPrepared(wallet, d.tx, persist); return reconcile(); },
    async publicRecord() {
      await reconcile(); if (!verified || !d.tx.transactionId) throw new Error("Confirm deployment first");
      return { schemaVersion: 1, network: "preprod", address: d.address, transactionId: d.tx.transactionId, finality: { block: d.tx.blockHash, observed: true }, ...d.build, observedAt: new Date().toISOString() };
    },
    exportEncrypted: () => store.exportEncrypted("deployment"),
    lock: () => { store.lock(); d.signingKey = ""; delete d.tx.transaction; },
  };
}
