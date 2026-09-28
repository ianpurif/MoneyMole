import "client-only";
import type { openPayments, PaymentView } from "./payments";
import { PaymentError, paymentErrorMessage, type PaymentErrorCode } from "./payment-errors";

export type PaymentStage = "draft" | "balance" | "prepare" | "authorization" | "submission" | "confirmation" | "success";
type Controller = Awaited<ReturnType<typeof openPayments>>;
type Source = { amount: string } | { claim: string };
/** One in-memory coordinator per unlocked escrow. Durable transaction records,
 * not UI step numbers, determine resume behavior. No automatic authorization.
 */
export class PaymentFlow {
  #listeners = new Set<() => void>();
  #revision = 0;
  #disposed = false;
  #source: Source | undefined;
  #targetId: string | undefined;
  #wake: (() => void) | undefined;
  payment: PaymentView | null = null;
  stage: PaymentStage = "draft";
  busy = false;
  error = "";
  link = "";
  transferring = false;
  destination = "";
  constructor(public controller: Controller, readonly onChange: () => void = () => {}, readonly resolveClaim?: (token: string) => Promise<Controller>) {}
  subscribe = (listener: () => void) => { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; };
  snapshot = () => this.#revision;
  changed() { this.#revision++; for (const listener of this.#listeners) listener(); this.onChange(); }
  dispose() { this.#disposed = true; this.link = ""; this.#source = undefined; this.#wake?.(); }
  #assert() { if (this.#disposed) throw new PaymentError("storage"); }
  #step(stage: PaymentStage) { this.#assert(); this.stage = stage; this.changed(); }
  async #load() {
    const id = this.#targetId ?? this.payment?.id;
    if (!id) return;
    const payment = (await this.controller.list()).find(item => item.id === id);
    this.#assert(); if (!payment) throw new PaymentError("storage"); this.payment = payment;
  }
  async #run(action: () => Promise<void>) {
    if (this.busy || this.#disposed) return;
    this.busy = true; this.error = ""; this.changed();
    try { await action(); }
    catch (error) {
      if (!this.#disposed) {
        // Reload the committed phase even if a later response was lost.
        try { await this.#load(); } catch { /* Keep known progress; never reset a transaction. */ }
        if (this.payment?.transactionId && (!this.transferring || this.payment.spendTransactionId)) this.stage = "confirmation";
        const fallback: PaymentErrorCode = this.stage === "confirmation" || this.stage === "submission" ? "network" : this.stage === "authorization" ? "approval" : this.stage === "prepare" ? "prepare" : this.stage === "balance" ? "wallet" : "storage";
        this.error = paymentErrorMessage(error, fallback);
      }
    } finally { this.busy = false; if (!this.#disposed) this.changed(); }
  }
  start(source: Source) {
    if (this.busy) return Promise.resolve();
    if ((this.payment || this.#targetId) && this.stage !== "success") return this.retry();
    this.#targetId = undefined;
    this.transferring = false; this.destination = "";
    this.#source = source; this.payment = null; this.link = ""; this.stage = "draft";
    return this.#run(() => this.#advance());
  }
  resume(id: string) {
    if (this.busy) return Promise.resolve();
    this.#targetId = id; this.payment = null; this.link = ""; this.#source = undefined;
    this.transferring = false; this.destination = "";
    return this.#run(async () => {
      await this.#load();
      await this.#advance();
    });
  }
  retry() { return this.#run(() => this.#advance()); }
  async #advance() {
    this.#assert();
    if (this.#targetId) await this.#load();
    if (!this.payment) {
      this.#step("draft");
      if (!this.#source) throw new PaymentError("storage");
      if ("claim" in this.#source && this.resolveClaim) {
        const controller = await this.resolveClaim(this.#source.claim); this.#assert(); this.controller = controller;
      }
      this.payment = "amount" in this.#source ? await this.controller.create(this.#source.amount) : await this.controller.receive(this.#source.claim);
      this.#targetId = this.payment.id;
      this.#source = undefined; this.#assert(); this.changed();
    } else await this.#load();
    if (this.payment!.transactionId) { await this.#confirm(); return; }
    this.#step("balance"); await this.controller.readiness(this.payment!.id); this.#assert();
    if (!["prepared", "authorization_requested"].includes(this.payment!.phase)) {
      this.#step("prepare"); this.payment = await this.controller.prepare(this.payment!.id); this.#assert();
    }
    this.#step("authorization");
  }
  authorize() {
    // Called only by the user's explicit confirmation in the modal.
    if (this.stage !== "authorization" || !this.payment || this.payment.transactionId) return Promise.resolve();
    return this.#run(async () => {
      try { this.payment = await this.controller.approve(this.payment!.id, stage => { if (!this.#disposed) this.#step(stage); }); }
      catch (error) {
        // An acknowledgement can be lost after the transaction ID was saved.
        // Observe that attempt automatically; never request a second submission.
        await this.#load();
        if (!this.payment?.transactionId) throw error;
      }
      this.#assert(); await this.#confirm();
    });
  }
  retryFailed() {
    if (!this.payment || !(this.payment.fundingRetryAvailable || this.payment.claimRetryAvailable || this.payment.spendRetryAvailable)) return Promise.resolve();
    return this.#run(async () => {
      this.payment = await this.controller.retryFailed(this.payment!.id, this.payment!.spendRetryAvailable ? "spend" : this.payment!.role === "sender" ? "fund" : "claim");
      this.#assert(); await this.#advance();
    });
  }
  spend(recipient: string) {
    if (!this.payment || (this.stage !== "success" && !this.transferring) || this.payment.role !== "receiver" || this.payment.spendTransactionId) return Promise.resolve();
    if (this.busy) return Promise.resolve();
    this.transferring = true; this.destination = recipient;
    return this.#run(async () => {
      this.#step("balance"); await this.controller.readiness(this.payment!.id); this.#assert();
      this.#step("authorization");
      try { this.payment = await this.controller.spend(this.payment!.id, recipient, stage => { if (!this.#disposed) this.#step(stage); }); }
      catch (error) {
        await this.#load();
        if (!this.payment?.spendTransactionId) throw error;
      }
      this.#assert(); await this.#confirm();
    });
  }
  async #confirm() {
    this.#step("confirmation");
    while (!this.#disposed) {
      this.#assert();
      try {
        this.payment = await this.controller.reconcile(this.payment!.id); this.#assert();
        this.error = ""; this.changed();
        if (this.payment.phase === "failed" || this.payment.spendPhase === "failed") throw new PaymentError("failed");
        if (this.payment.spendTransactionId ? this.payment.spendVerified : this.payment.role === "sender" ? this.payment.funded : this.payment.claimed) {
          if (this.payment.role === "sender" && !this.payment.spent) { const link = await this.controller.share(this.payment.id); this.#assert(); this.link = link; }
          this.#step("success"); return;
        }
      } catch (error) {
        if (!(error instanceof PaymentError) || !["network", "pending", "wallet-read", "wallet-busy"].includes(error.code)) throw error;
        this.error = error.message; this.changed();
      }
      await new Promise<void>(resolve => {
        const timer = setTimeout(() => { this.#wake = undefined; resolve(); }, 5000);
        this.#wake = () => { clearTimeout(timer); resolve(); };
      });
    }
  }
}
