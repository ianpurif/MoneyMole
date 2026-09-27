import "client-only";
import { createUnprovenCallTxFromInitialStates } from "@midnight-ntwrk/midnight-js-contracts";
import { Transaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { encodeClaim, decodeClaim, hex, unhex, randomHex, type ClaimPayload } from "./payment-codec";
import { noteDigest, spentDigest } from "./payment-crypto";
import { ledger, paymentContract } from "./payment-contract";
import { PaymentKeys, verifiedPaymentState, observeTransaction } from "./payment-network";
import { verifyNightCall, verifyNightSpend } from "./night-settlement";
import { parseAmount } from "../../domain/amount";
import { PaymentError, paymentStep } from "./payment-errors";
import { readWallet } from "./oneam";
import { openStore, readRecord, writeRecord, paymentAsset, provePayment, submitPrepared, submitOnce, reconcileTx, validateTx, validateRecipient, recipientKey, NIGHT_DECIMALS, type WalletContext, type TxRecord } from "./payment-session";

type FailedAttempt = { action: "fund" | "claim" | "spend"; transactionId: string; transactionHash: string; blockHash: string; blockHeight: number };
type RecordData = { version: 2; role: "sender" | "receiver"; payload: ClaimPayload; tx: TxRecord; baseline: string; recipient?: string; spend?: TxRecord; spendRecipient?: string; spendBaseline?: string; failedAttempts?: FailedAttempt[] };
export type PaymentView = { id: string; role: RecordData["role"]; amount: string; phase: TxRecord["phase"]; transactionId?: string; transactionHash?: string; blockHash?: string; funded: boolean; claimed: boolean; walletSynced: boolean; spent: boolean; spendPhase?: TxRecord["phase"]; spendTransactionId?: string; spendVerified: boolean; fundingRetryAvailable?: boolean; claimRetryAvailable: boolean; spendRetryAvailable: boolean; failedAttempts: number };
export async function openPayments(wallet: WalletContext, contract: string, password: string) {
  const asset = paymentAsset(); await verifiedPaymentState(contract, asset);
  const store = await openStore(wallet, contract, password, 2);
  async function exclusive<T>(id: string, action: () => Promise<T>) {
    if (!navigator.locks) throw new PaymentError("busy");
    return navigator.locks.request(`moneymole-payment/${wallet.walletId}/${contract}/${id}`, { mode: "exclusive", ifAvailable: true }, lock => {
      if (lock === null) throw new PaymentError("busy");
      return action();
    });
  }
  const observations = new Map<string, { funded: boolean; claimed: boolean; walletSynced: boolean; spent: boolean; spendVerified: boolean; fundingRetryAvailable?: boolean; claimRetryAvailable: boolean; spendRetryAvailable: boolean }>();
  async function load(id: string) {
    if (!/^[sr]_[a-f0-9]{64}$/.test(id)) throw new Error("Invalid local payment identifier");
    const found = await readRecord<RecordData>(store, id); if (!found) throw new Error("Local payment not found");
    const r = found.value;
    if (r.version !== 2 || !["sender", "receiver"].includes(r.role) || r.payload.contract !== contract || r.payload.asset !== asset || !/^(0|[1-9][0-9]*)$/.test(r.baseline)) throw new Error("Recovery record has an incompatible namespace");
    await encodeClaim(r.payload); validateTx(r.tx); if (r.spend) validateTx(r.spend);
    if (r.failedAttempts !== undefined) {
      if (!Array.isArray(r.failedAttempts)) throw new Error("Invalid attempt history");
      for (const attempt of r.failedAttempts) {
        if (!["fund", "claim", "spend"].includes(attempt.action) || !Number.isSafeInteger(attempt.blockHeight) || attempt.blockHeight < 0) throw new Error("Invalid failed attempt");
        for (const field of [attempt.transactionId, attempt.transactionHash, attempt.blockHash]) unhex(field, 32);
      }
    }
    if (id !== `${r.role === "sender" ? "s" : "r"}_${hex(noteDigest(r.payload))}`) throw new Error("Recovery payment identity mismatch");
    return found;
  }
  const view = (id: string, r: RecordData): PaymentView => ({ id, role: r.role, amount: r.payload.amount, phase: r.tx.phase, failedAttempts: r.failedAttempts?.length ?? 0, ...(r.tx.transactionId ? { transactionId: r.tx.transactionId } : {}), ...(r.tx.transactionHash ? { transactionHash: r.tx.transactionHash } : {}), ...(r.tx.blockHash ? { blockHash: r.tx.blockHash } : {}), ...(observations.get(id) ?? { funded: false, claimed: false, walletSynced: false, spent: false, spendVerified: false, claimRetryAvailable: false, spendRetryAvailable: false }), ...(r.spend ? { spendPhase: r.spend.phase } : {}), ...(r.spend?.transactionId ? { spendTransactionId: r.spend.transactionId } : {}) });
  async function balance() { return paymentStep("wallet", async () => { await wallet.guard(); const balances = await readWallet(() => wallet.api.getUnshieldedBalances()); const value = balances[asset] ?? 0n; if (typeof value !== "bigint" || value < 0n) throw new PaymentError("wallet"); return value; }); }
  async function readiness(id: string) {
    const r = (await load(id)).value;
    const available = await balance();
    if (r.role === "sender" && available < BigInt(r.payload.amount)) throw new PaymentError("night");
    const dust = await paymentStep("wallet", () => readWallet(() => wallet.api.getDustBalance()));
    if (typeof dust.balance !== "bigint" || dust.balance <= 0n) throw new PaymentError("dust");
    return available;
  }
  async function funded(payload: ClaimPayload) {
    const tx = await observeTransaction(payload.fundingId);
    if (!tx || tx.transactionResult.status !== "SUCCESS") throw new Error("Funding is not finalized successfully");
    const historical = tx.contractActions.find(a => a.address === contract);
    if (!historical || !ledger(ContractState.deserialize(unhex(historical.state)).data).notes.findPathForLeaf(noteDigest(payload))) throw new Error("Funding transaction does not contain this note");
    verifyNightCall(tx, contract, "fund", BigInt(payload.amount));
    const current = await verifiedPaymentState(contract, asset);
    if (!ledger(current.state.data).notes.findPathForLeaf(noteDigest(payload))) throw new Error("Payment note is absent");
    return { tx, current, spent: ledger(current.state.data).spent.member(spentDigest(payload)) };
  }
  async function reconcile(id: string) {
    // A failed refresh must not leave earlier success/retry flags visible.
    observations.delete(id);
    const found = await load(id), r = found.value;
    // A local sender draft has nothing to reconcile on-chain. Never query the
    // all-zero placeholder or require a wallet/prover to inspect saved progress.
    if (r.role === "sender" && !r.tx.transactionId) return view(id, r);
    await wallet.guard();
    const persist = async () => { found.revision = await writeRecord(store, id, r, found.revision); };
    const own = await reconcileTx(r.tx, persist);
    if (r.role === "sender" && r.tx.transactionId) r.payload.fundingId = r.tx.transactionId;
    if (r.role === "sender" && own?.transactionResult.status === "FAILURE") {
      const current = await verifiedPaymentState(contract, asset);
      const absent = !ledger(current.state.data).notes.findPathForLeaf(noteDigest(r.payload));
      observations.set(id, { funded: false, claimed: false, walletSynced: false, spent: false, spendVerified: false, fundingRetryAvailable: absent, claimRetryAvailable: false, spendRetryAvailable: false });
      return view(id, r);
    }
    let funding: Awaited<ReturnType<typeof funded>>;
    try { funding = await funded(r.payload); } catch (error) { observations.delete(id); if (r.tx.phase === "draft" || r.tx.phase === "prepared" || r.tx.phase === "authorization_requested" || !own) return view(id, r); throw error; }
    const flags = { funded: true, spent: funding.spent, claimed: false, walletSynced: false, spendVerified: false, claimRetryAvailable: r.role === "receiver" && own?.transactionResult.status === "FAILURE" && !funding.spent, spendRetryAvailable: false };
    if (r.role === "receiver" && own?.transactionResult.status === "SUCCESS") {
      if (!funding.spent || r.recipient !== wallet.unshieldedKey) throw new Error("Claim settlement does not match the receiver");
      verifyNightCall(own, contract, "claim", BigInt(r.payload.amount), r.recipient);
      flags.claimed = true; flags.walletSynced = await balance() === BigInt(r.baseline) + BigInt(r.payload.amount);
    }
    if (r.spend?.transactionId) {
      const spendTx = await reconcileTx(r.spend, persist);
      const after = await balance();
      if (spendTx?.transactionResult.status === "SUCCESS") {
        if (!flags.claimed || !r.spendRecipient) throw new Error("Missing confirmed claim or spend destination");
        verifyNightSpend(spendTx, wallet.unshieldedKey, recipientKey(r.spendRecipient), BigInt(r.payload.amount));
        flags.spendVerified = r.spendBaseline === (BigInt(r.baseline) + BigInt(r.payload.amount)).toString() && after === BigInt(r.baseline);
      }
      if (flags.spendVerified) flags.walletSynced = true;
      flags.spendRetryAvailable = spendTx?.transactionResult.status === "FAILURE" && flags.claimed && flags.walletSynced;
    }
    observations.set(id, flags); await persist(); return view(id, r);
  }
  async function prepare(id: string) {
    await wallet.guard(); const found = await load(id), r = found.value;
    if (r.tx.transactionId) throw new Error("Reconcile the submitted transaction; do not resubmit");
    if (r.tx.phase === "prepared" || r.tx.phase === "authorization_requested") return view(id, r);
    const current = await verifiedPaymentState(contract, asset);
    if (r.role === "sender" && ledger(current.state.data).notes.isFull()) throw new Error("Escrow capacity reached; retain this address for existing claims and use another approved escrow for new funding");
    if (r.role === "receiver") {
      const f = await funded(r.payload); if (f.spent) throw new Error("This payment has already been claimed");
      r.recipient = wallet.unshieldedKey;
    }
    r.baseline = (await readiness(id)).toString();
    // Persist the recoverable opening before any proving or wallet action.
    found.revision = await writeRecord(store, id, r, found.revision);
    const base = { compiledContract: paymentContract(), contractAddress: contract, coinPublicKey: wallet.coinKey, initialPrivateState: { payload: r.payload }, initialContractState: current.state, initialZswapChainState: current.zswap, ledgerParameters: current.parameters };
    const call = await paymentStep("prepare", async () => r.role === "sender"
      ? await createUnprovenCallTxFromInitialStates(new PaymentKeys(), { ...base, circuitId: "fund" }, wallet.encKey)
      : await createUnprovenCallTxFromInitialStates(new PaymentKeys(), { ...base, circuitId: "claim", args: [{ bytes: unhex(wallet.unshieldedKey, 32) }] }, wallet.encKey));
    r.tx = { phase: "prepared", transaction: await provePayment(call.private.unprovenTx) };
    await wallet.guard(); found.revision = await writeRecord(store, id, r, found.revision); return view(id, r);
  }
  return {
    contract, asset, balance, readiness,
    prepare: (id: string) => exclusive(id, () => prepare(id)),
    reconcile: (id: string) => exclusive(id, () => reconcile(id)),
    retryFailed: (id: string, action: "fund" | "claim" | "spend") => exclusive(id, async () => {
      // Reloaded/imported phases are never authority to retry. Recheck native
      // identity, canonical finality, the original note and wallet balance now.
      const status = await reconcile(id);
      if (action === "fund" ? !status.fundingRetryAvailable : action === "claim" ? !status.claimRetryAvailable : action !== "spend" || !status.spendRetryAvailable) throw new Error("A confirmed complete failure is required before retry");
      const found = await load(id), r = found.value;
      const tx = action === "spend" ? r.spend : r.tx;
      const observedId = action === "spend" ? status.spendTransactionId : status.transactionId;
      if (r.role !== (action === "fund" ? "sender" : "receiver") || !tx || tx.phase !== "failed" || tx.transactionId !== observedId || !tx.transactionId || !tx.transactionHash || !tx.blockHash || tx.blockHeight === undefined) throw new Error("Attempt changed; reconcile before retry");
      r.failedAttempts = [...(r.failedAttempts ?? []), { action, transactionId: tx.transactionId, transactionHash: tx.transactionHash, blockHash: tx.blockHash, blockHeight: tx.blockHeight }];
      if (action !== "spend") { r.tx = { phase: "draft" }; delete r.recipient; if (action === "fund") r.payload.fundingId = "00".repeat(32); }
      else { delete r.spend; delete r.spendRecipient; delete r.spendBaseline; }
      await wallet.guard();
      // One atomic CAS archives the old attempt and resets only the failed leg.
      // Conflicts or storage errors prevent reset; this operation never signs.
      await writeRecord(store, id, r, found.revision);
      observations.delete(id);
      return reconcile(id);
    }),
    async list() { const out: PaymentView[] = []; for (const id of await store.keys()) { if (/^[sr]_/.test(id)) out.push(view(id, (await load(id)).value)); } return out; },
    async create(input: string) {
      const amount = parseAmount(input, NIGHT_DECIMALS).toString();
      const payload: ClaimPayload = { version: 2, network: "preprod", contract, asset, amount, nonce: randomHex(), authority: randomHex(), fundingId: "00".repeat(32) };
      const id = `s_${hex(noteDigest(payload))}`, record: RecordData = { version: 2, role: "sender", payload, baseline: "0", tx: { phase: "draft" } };
      await writeRecord(store, id, record, 0); return view(id, record);
    },
    async receive(token: string) {
      const payload = await decodeClaim(token); if (payload.contract !== contract || payload.asset !== asset) throw new Error("Claim belongs to another deployment or asset");
      const f = await funded(payload); if (f.spent) throw new Error("This payment has already been claimed");
      const id = `r_${hex(noteDigest(payload))}`;
      if (await readRecord(store, id)) return reconcile(id);
      const record: RecordData = { version: 2, role: "receiver", payload, baseline: (await balance()).toString(), tx: { phase: "draft" } };
      await writeRecord(store, id, record, 0); return reconcile(id);
    },
    approve: (id: string, onStage?: (stage: "authorization" | "submission") => void) => exclusive(id, async () => {
      const found = await load(id), r = found.value;
      if (r.role === "receiver" && (await funded(r.payload)).spent) throw new Error("This payment has already been claimed");
      r.baseline = (await readiness(id)).toString();
      await submitPrepared(wallet, r.tx, async () => { if (r.role === "sender" && r.tx.transactionId) r.payload.fundingId = r.tx.transactionId; found.revision = await writeRecord(store, id, r, found.revision); }, onStage);
      // Submission acknowledgement is not confirmation. Reconciliation is a
      // separate resumable step and cannot turn a sent payment into an approval retry.
      return view(id, r);
    }),
    async share(id: string) {
      const status = await reconcile(id), r = (await load(id)).value;
      if (r.role !== "sender" || !status.funded || status.spent) throw new Error("Only finalized unclaimed funding can be shared");
      return `${location.origin}/claim#${await encodeClaim(r.payload)}`;
    },
    spend: (id: string, recipient: string, onStage?: (stage: "authorization" | "submission") => void) => exclusive(id, async () => {
      await wallet.guard();
      try { validateRecipient(recipient); if (recipient === wallet.address) throw new Error(); } catch { throw new PaymentError("address"); }
      const status = await reconcile(id); if (!status.claimed || !status.walletSynced) throw new PaymentError("sync");
      const found = await load(id), r = found.value;
      if (r.spend?.transactionId) throw new Error("Reconcile the existing controlled spend");
      if (await balance() !== BigInt(r.baseline) + BigInt(r.payload.amount)) throw new PaymentError("sync");
      if ((await wallet.api.getDustBalance()).balance <= 0n) throw new Error("DUST is required for fees");
      r.spend = { phase: "authorization_requested" }; r.spendRecipient = recipient; r.spendBaseline = (await balance()).toString();
      found.revision = await writeRecord(store, id, r, found.revision);
      onStage?.("authorization");
      const made = await paymentStep("approval", () => wallet.api.makeTransfer([{ kind: "unshielded", type: asset, value: BigInt(r.payload.amount), recipient }]));
      await wallet.guard(); const tx = Transaction.deserialize("signature", "proof", "binding", unhex(made.tx));
      if ([...(tx.intents?.values() ?? [])].some(i => i.actions.length)) throw new Error("Unexpected contract action in wallet transfer");
      const identifier = tx.identifiers()[0]; if (!identifier) throw new Error("Missing spend identifier");
      verifyNightSpend({ raw: made.tx, identifiers: [identifier] }, wallet.unshieldedKey, recipientKey(recipient), BigInt(r.payload.amount));
      r.spend.transactionId = identifier; r.spend.phase = "outcome_unknown"; found.revision = await writeRecord(store, id, r, found.revision);
      onStage?.("submission");
      await submitOnce(wallet.api, made.tx); r.spend.phase = "submitted"; found.revision = await writeRecord(store, id, r, found.revision); return view(id, r);
    }),
    async exportEncrypted(id: string) { await load(id); return JSON.stringify({ version: 2, contract, id, envelope: JSON.parse(await store.exportEncrypted(id)) }); },
    async importEncrypted(text: string, originalPassword: string) {
      if (text.length > 1_500_000) throw new Error("Recovery file too large");
      const v = JSON.parse(text) as { version: number; contract: string; id: string; envelope: unknown };
      if (v.version !== 2 || v.contract !== contract || !/^[sr]_[a-f0-9]{64}$/.test(v.id)) throw new Error("Incompatible recovery file");
      await store.importEncrypted(v.id, JSON.stringify(v.envelope), originalPassword); return view(v.id, (await load(v.id)).value);
    },
    async receipt(id: string) { const v = await reconcile(id); if (!v.funded && !v.claimed) throw new Error("No confirmed receipt"); return { schemaVersion: 2, asset: "NIGHT", amountAtomic: (await load(id)).value.payload.amount, network: "preprod", contract, role: v.role, walletAddress: wallet.address, walletAddressHex: wallet.unshieldedKey, spendRecipientAddressHex: (await load(id)).value.spendRecipient ? recipientKey((await load(id)).value.spendRecipient!) : undefined, transactionId: v.transactionId, transactionHash: v.transactionHash, blockHash: v.blockHash, claimConfirmed: v.claimed, walletSynced: v.walletSynced, spendVerified: v.spendVerified, spendTransactionId: v.spendTransactionId, observedAt: new Date().toISOString() }; },
    lock: () => { observations.clear(); store.lock(); },
  };
}
