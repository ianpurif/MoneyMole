import "client-only";
import { transitionTransaction, type TransactionEvent, type TransactionState } from "../../domain/transaction";
import type { UnlockedPrivateStore } from "./port";

type RecordData = { version: 1; intent: string; transaction: TransactionState };
const encode = (record: RecordData) => new TextEncoder().encode(JSON.stringify(record));
function parse(bytes: Uint8Array): RecordData {
  try {
    if (bytes.length > 70_000) throw new Error();
    const r = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!r || r.version !== 1 || Object.keys(r).sort().join() !== "intent,transaction,version" ||
        typeof r.intent !== "string" || !r.intent.length || r.intent.length > 16_000) throw new Error();
    const t = r.transaction;
    if (!t || typeof t !== "object") throw new Error();
    const id = (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 256 && v.trim() === v;
    if (!id(t.intentId)) throw new Error();
    const keys = ["phase", "intentId"];
    if (["submitted", "included", "finalized", "wallet_synced", "outcome_unknown"].includes(t.phase)) {
      keys.push("transactionId");
      if (!(t.phase === "outcome_unknown" && t.transactionId === null) && !id(t.transactionId)) throw new Error();
      if (["finalized", "wallet_synced"].includes(t.phase)) { keys.push("blockId"); if (!id(t.blockId)) throw new Error(); }
    } else if (!["prepared", "awaiting_authorization", "rejected"].includes(t.phase)) throw new Error();
    if (Object.keys(t).sort().join() !== keys.sort().join()) throw new Error();
    return r as RecordData;
  } catch { throw new Error("Invalid recovery record; preserve it for recovery"); }
}

/** Durable local recovery, not proof of settlement. Restored observations require reconciliation. */
export class TransactionJournal {
  #busy = false;
  private constructor(private store: UnlockedPrivateStore, private key: string, private revision: number, private record: RecordData) {}
  static async create(store: UnlockedPrivateStore, key: string, intentId: string, intent: string): Promise<TransactionJournal> {
    const record: RecordData = { version: 1, intent, transaction: transitionTransaction({ phase: "draft" }, { type: "intent_persisted", intentId }) };
    const bytes = encode(record);
    try { parse(bytes); return new TransactionJournal(store, key, await store.write(key, bytes, 0), record); }
    finally { bytes.fill(0); }
  }
  static async load(store: UnlockedPrivateStore, key: string): Promise<TransactionJournal> {
    const stored = await store.read(key);
    if (!stored) throw new Error("Recovery record not found");
    try { return new TransactionJournal(store, key, stored.revision, parse(stored.plaintext)); }
    finally { stored.plaintext.fill(0); }
  }
  snapshot(): { transaction: TransactionState; verified: false } {
    return { transaction: { ...this.record.transaction }, verified: false };
  }
  private async persist(event: TransactionEvent): Promise<void> {
    const next = { ...this.record, transaction: transitionTransaction(this.record.transaction, event) };
    const bytes = encode(next);
    try {
      const revision = await this.store.write(this.key, bytes, this.revision);
      this.revision = revision; this.record = next;
    } finally { bytes.fill(0); }
  }
  async apply(event: TransactionEvent): Promise<void> {
    if (this.#busy) throw new Error("Recovery operation already in progress");
    this.#busy = true;
    try { await this.persist(event); } finally { this.#busy = false; }
  }
  /** Caller must already hold explicit owner approval; this utility never obtains it. */
  async submit(approvedSubmission: () => Promise<string>): Promise<void> {
    if (this.#busy) throw new Error("Recovery operation already in progress");
    this.#busy = true;
    try {
      // CAS conflict/storage failure prevents the side effect entirely.
      await this.persist({ type: "submission_started" });
      let transactionId: string;
      try { transactionId = await approvedSubmission(); }
      catch { throw new Error("Submission outcome unknown; reconcile before retry"); }
      // If this write fails, the durable record still forbids blind resubmission.
      await this.persist({ type: "submitted", transactionId });
    } finally { this.#busy = false; }
  }
}
