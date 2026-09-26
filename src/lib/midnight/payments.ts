import "client-only";
import { createUnprovenCallTxFromInitialStates } from "@midnight-ntwrk/midnight-js-contracts";
import { Event, Transaction, ZswapInput, ZswapOutput } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { encodeClaim, decodeClaim, hex, unhex, randomHex, MAX_AMOUNT, type ClaimPayload } from "./payment-codec";
import { noteDigest, spentDigest } from "./payment-crypto";
import { ledger, paymentContract } from "./payment-contract";
import { PaymentKeys, verifiedPaymentState, observeTransaction, outputObservations, type ObservedTx } from "./payment-network";
import { qualifyEscrowCoin } from "./feasibility/qualify-escrow";
import { openStore, readRecord, writeRecord, paymentAsset, provePayment, submitPrepared, reconcileTx, validateTx, validateRecipient, type WalletContext, type TxRecord } from "./payment-session";

type RecordData = { version: 1; role: "sender" | "receiver"; payload: ClaimPayload; tx: TxRecord; baseline: string; output?: string; input?: string; spend?: TxRecord; spendRecipient?: string; spendBaseline?: string };
export type PaymentView = { id: string; role: RecordData["role"]; amount: string; phase: TxRecord["phase"]; transactionId?: string; transactionHash?: string; blockHash?: string; funded: boolean; claimed: boolean; walletSynced: boolean; spent: boolean; spendPhase?: TxRecord["phase"]; spendTransactionId?: string; spendVerified: boolean };
export async function openPayments(wallet: WalletContext, contract: string, password: string) {
  const asset = paymentAsset(); await verifiedPaymentState(contract, asset);
  const store = await openStore(wallet, contract, password);
  const observations = new Map<string, { funded: boolean; claimed: boolean; walletSynced: boolean; spent: boolean; spendVerified: boolean }>();
  async function load(id: string) {
    if (!/^[sr]_[a-f0-9]{64}$/.test(id)) throw new Error("Invalid local payment identifier");
    const found = await readRecord<RecordData>(store, id); if (!found) throw new Error("Local payment not found");
    const r = found.value;
    if (r.version !== 1 || !["sender", "receiver"].includes(r.role) || r.payload.contract !== contract || r.payload.asset !== asset || !/^(0|[1-9][0-9]*)$/.test(r.baseline)) throw new Error("Recovery record has an incompatible namespace");
    await encodeClaim(r.payload); validateTx(r.tx); if (r.spend) validateTx(r.spend);
    if (id !== `${r.role === "sender" ? "s" : "r"}_${hex(noteDigest(r.payload))}`) throw new Error("Recovery payment identity mismatch");
    return found;
  }
  const view = (id: string, r: RecordData): PaymentView => ({ id, role: r.role, amount: r.payload.amount, phase: r.tx.phase, ...(r.tx.transactionId ? { transactionId: r.tx.transactionId } : {}), ...(r.tx.transactionHash ? { transactionHash: r.tx.transactionHash } : {}), ...(r.tx.blockHash ? { blockHash: r.tx.blockHash } : {}), ...(observations.get(id) ?? { funded: false, claimed: false, walletSynced: false, spent: false, spendVerified: false }), ...(r.spend ? { spendPhase: r.spend.phase } : {}), ...(r.spend?.transactionId ? { spendTransactionId: r.spend.transactionId } : {}) });
  async function balance() { await wallet.guard(); const balances = await wallet.api.getShieldedBalances(); return balances[asset] ?? 0n; }
  async function funded(payload: ClaimPayload) {
    const tx = await observeTransaction(payload.fundingId);
    if (!tx || tx.transactionResult.status !== "SUCCESS") throw new Error("Funding is not finalized successfully");
    const historical = tx.contractActions.find(a => a.address === contract);
    if (!historical || !ledger(ContractState.deserialize(unhex(historical.state)).data).notes.findPathForLeaf(noteDigest(payload))) throw new Error("Funding transaction does not contain this note");
    const current = await verifiedPaymentState(contract, asset);
    if (!ledger(current.state.data).notes.findPathForLeaf(noteDigest(payload))) throw new Error("Payment note is absent");
    return { tx, current, spent: ledger(current.state.data).spent.member(spentDigest(payload)) };
  }
  function eventMatches(tx: ObservedTx, tag: string, field: string, value: string) {
    return tx.zswapLedgerEvents.some(row => { const e = Event.deserialize(unhex(row.raw)); return e.source.transactionHash === tx.hash && e.content.tag === tag && field in e.content && (e.content as unknown as Record<string, unknown>)[field] === value; });
  }
  async function reconcile(id: string) {
    await wallet.guard(); const found = await load(id), r = found.value;
    const persist = async () => { found.revision = await writeRecord(store, id, r, found.revision); };
    const own = await reconcileTx(r.tx, persist);
    if (r.role === "sender" && r.tx.transactionId) r.payload.fundingId = r.tx.transactionId;
    let funding: Awaited<ReturnType<typeof funded>>;
    try { funding = await funded(r.payload); } catch (error) { observations.delete(id); if (r.tx.phase === "draft" || r.tx.phase === "prepared" || r.tx.phase === "authorization_requested" || !own) return view(id, r); throw error; }
    const flags = { funded: true, spent: funding.spent, claimed: false, walletSynced: false, spendVerified: false };
    if (!funding.spent) qualifyEscrowCoin(contract, { nonce: r.payload.nonce, type: asset, value: BigInt(r.payload.amount) }, outputObservations(funding.tx), funding.current.zswap);
    if (r.role === "receiver" && own?.transactionResult.status === "SUCCESS") {
      if (!funding.spent || !r.output || !r.input || !eventMatches(own, "zswapOutput", "commitment", r.output) || !eventMatches(own, "zswapInput", "nullifier", r.input)) throw new Error("Claim settlement does not match the expected coin transfer");
      flags.claimed = true; flags.walletSynced = await balance() >= BigInt(r.baseline) + BigInt(r.payload.amount);
    }
    if (r.spend?.transactionId) {
      const spendTx = await reconcileTx(r.spend, persist);
      const after = await balance();
      flags.spendVerified = !!spendTx && spendTx.transactionResult.status === "SUCCESS" && r.baseline === "0" && r.spendBaseline === r.payload.amount && after === 0n && spendTx.zswapLedgerEvents.some(row => Event.deserialize(unhex(row.raw)).content.tag === "zswapInput");
      if (flags.spendVerified) flags.walletSynced = true;
    }
    observations.set(id, flags); await persist(); return view(id, r);
  }
  async function prepare(id: string) {
    await wallet.guard(); const found = await load(id), r = found.value;
    if (r.tx.transactionId) throw new Error("Reconcile the submitted transaction; do not resubmit");
    const current = await verifiedPaymentState(contract, asset);
    let index: bigint | undefined;
    if (r.role === "receiver") {
      const f = await funded(r.payload); if (f.spent) throw new Error("This payment has already been claimed");
      const qualified = qualifyEscrowCoin(contract, { nonce: r.payload.nonce, type: asset, value: BigInt(r.payload.amount) }, outputObservations(f.tx), current.zswap); index = qualified.mt_index;
      r.input = ZswapInput.newContractOwned(qualified, undefined, contract, current.zswap).nullifier;
    } else if (await balance() < BigInt(r.payload.amount)) throw new Error("Insufficient shielded test asset balance");
    if ((await wallet.api.getDustBalance()).balance <= 0n) throw new Error("DUST is required for transaction fees");
    r.baseline = (await balance()).toString();
    // Persist the recoverable opening before any proving or wallet action.
    found.revision = await writeRecord(store, id, r, found.revision);
    const call = await createUnprovenCallTxFromInitialStates(new PaymentKeys(), { compiledContract: paymentContract(), circuitId: r.role === "sender" ? "fund" : "claim", contractAddress: contract, coinPublicKey: wallet.coinKey, initialPrivateState: { payload: r.payload, ...(index === undefined ? {} : { index }) }, initialContractState: current.state, initialZswapChainState: current.zswap, ledgerParameters: current.parameters }, wallet.encKey);
    if (r.role === "receiver") {
      const coin = call.private.newCoins[0];
      if (call.private.newCoins.length !== 1 || !coin || coin.type !== asset || coin.value !== BigInt(r.payload.amount)) throw new Error("Claim did not produce the exact receiver coin");
      r.output = ZswapOutput.new(coin, undefined, wallet.coinKey, wallet.encKey).commitment;
    }
    r.tx = { phase: "prepared", transaction: await provePayment(call.private.unprovenTx) };
    await wallet.guard(); found.revision = await writeRecord(store, id, r, found.revision); return view(id, r);
  }
  return {
    contract, asset, balance, prepare, reconcile,
    async list() { const out: PaymentView[] = []; for (const id of await store.keys()) { if (/^[sr]_/.test(id)) out.push(view(id, (await load(id)).value)); } return out; },
    async create(amount: string) {
      if (!/^[1-9][0-9]{0,38}$/.test(amount) || BigInt(amount) > MAX_AMOUNT) throw new Error("Enter a positive whole number of test units");
      const payload: ClaimPayload = { version: 1, network: "preprod", contract, asset, amount, nonce: randomHex(), authority: randomHex(), fundingId: "00".repeat(32) };
      const id = `s_${hex(noteDigest(payload))}`, record: RecordData = { version: 1, role: "sender", payload, baseline: (await balance()).toString(), tx: { phase: "draft" } };
      await writeRecord(store, id, record, 0); return view(id, record);
    },
    async receive(token: string) {
      const payload = await decodeClaim(token); if (payload.contract !== contract || payload.asset !== asset) throw new Error("Claim belongs to another deployment or asset");
      const f = await funded(payload); if (f.spent) throw new Error("This payment has already been claimed");
      const id = `r_${hex(noteDigest(payload))}`;
      if (await readRecord(store, id)) return reconcile(id);
      const record: RecordData = { version: 1, role: "receiver", payload, baseline: (await balance()).toString(), tx: { phase: "draft" } };
      await writeRecord(store, id, record, 0); return reconcile(id);
    },
    async approve(id: string) {
      const found = await load(id), r = found.value;
      if (r.role === "receiver" && (await funded(r.payload)).spent) throw new Error("This payment has already been claimed");
      if (r.role === "sender" && await balance() < BigInt(r.payload.amount)) throw new Error("Insufficient shielded test asset balance");
      r.baseline = (await balance()).toString();
      await submitPrepared(wallet, r.tx, async () => { if (r.role === "sender" && r.tx.transactionId) r.payload.fundingId = r.tx.transactionId; found.revision = await writeRecord(store, id, r, found.revision); });
      return reconcile(id);
    },
    async share(id: string) {
      const status = await reconcile(id), r = (await load(id)).value;
      if (r.role !== "sender" || !status.funded || status.spent) throw new Error("Only finalized unclaimed funding can be shared");
      return `${location.origin}/claim#${await encodeClaim(r.payload)}`;
    },
    async spend(id: string, recipient: string) {
      await wallet.guard(); validateRecipient(recipient); if (recipient === wallet.address) throw new Error("Choose another wallet for the controlled spend");
      const status = await reconcile(id); if (!status.claimed || !status.walletSynced) throw new Error("Confirm claim and wallet synchronization first");
      const found = await load(id), r = found.value;
      if (r.spend?.transactionId) throw new Error("Reconcile the existing controlled spend");
      r.spend = { phase: "authorization_requested" }; r.spendRecipient = recipient; r.spendBaseline = (await balance()).toString();
      found.revision = await writeRecord(store, id, r, found.revision);
      const made = await wallet.api.makeTransfer([{ kind: "shielded", type: asset, value: BigInt(r.payload.amount), recipient }]);
      await wallet.guard(); const tx = Transaction.deserialize("signature", "proof", "binding", unhex(made.tx));
      if ([...(tx.intents?.values() ?? [])].some(i => i.actions.length)) throw new Error("Unexpected contract action in wallet transfer");
      const identifier = tx.identifiers()[0]; if (!identifier) throw new Error("Missing spend identifier");
      r.spend.transactionId = identifier; r.spend.phase = "outcome_unknown"; found.revision = await writeRecord(store, id, r, found.revision);
      await wallet.api.submitTransaction(made.tx); r.spend.phase = "submitted"; found.revision = await writeRecord(store, id, r, found.revision); return reconcile(id);
    },
    async exportEncrypted(id: string) { await load(id); return JSON.stringify({ version: 1, contract, id, envelope: JSON.parse(await store.exportEncrypted(id)) }); },
    async importEncrypted(text: string, originalPassword: string) {
      if (text.length > 1_500_000) throw new Error("Recovery file too large");
      const v = JSON.parse(text) as { version: number; contract: string; id: string; envelope: unknown };
      if (v.version !== 1 || v.contract !== contract || !/^[sr]_[a-f0-9]{64}$/.test(v.id)) throw new Error("Incompatible recovery file");
      await store.importEncrypted(v.id, JSON.stringify(v.envelope), originalPassword); return view(v.id, (await load(v.id)).value);
    },
    async receipt(id: string) { const v = await reconcile(id); if (!v.funded && !v.claimed) throw new Error("No confirmed receipt"); return { schemaVersion: 1, network: "preprod", contract, role: v.role, transactionId: v.transactionId, transactionHash: v.transactionHash, blockHash: v.blockHash, claimConfirmed: v.claimed, walletSynced: v.walletSynced, spendVerified: v.spendVerified, spendTransactionId: v.spendTransactionId, observedAt: new Date().toISOString() }; },
    lock: () => { observations.clear(); store.lock(); },
  };
}
