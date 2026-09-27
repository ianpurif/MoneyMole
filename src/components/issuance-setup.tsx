"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import type { openIssuance, IssuanceReview } from "@/lib/midnight/issuer-issuance";
type Issuance = Awaited<ReturnType<typeof openIssuance>>;

export function IssuanceSetup({ open }: { open: () => Promise<Issuance> }) {
  const current = useRef<Issuance | null>(null), generation = useRef(0);
  const [busy, setBusy] = useState(false), [review, setReview] = useState<IssuanceReview | null>(null);
  const [message, setMessage] = useState("Issue the fixed supply to Wallet A. This is a separate transaction from deployment.");
  // The shared recovery session owns the issuer store, including across navigation.
  useEffect(() => () => { generation.current++; }, []);
  async function poll(issuer: Issuance, attempt: number) {
    for (let n = 0; n < 12 && attempt === generation.current; n++) {
      const next = await issuer.reconcile();
      if (attempt !== generation.current) return;
      setReview(next);
      if (next.phase === "finalized" && next.walletCredited) { setMessage("Issuance confirmed; Wallet A reports 1,000,000 shielded test units. Payment and spendability checks are still pending."); return; }
      if (!next.transactionId) return;
      setMessage(next.phase === "finalized" ? "Issuance confirmed. Waiting for Wallet A to synchronize the shielded balance…" : "Waiting for issuance confirmation. Do not issue again.");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    setMessage("Confirmation or wallet synchronization is pending. Use Check issuance; do not submit again.");
  }
  async function run(action: "prepare" | "approve" | "check") {
    const attempt = generation.current;
    setBusy(true);
    try {
      if (!current.current) {
        const issuer = await open();
        if (attempt !== generation.current) return;
        current.current = issuer;
      }
      if (action === "prepare") {
        setMessage("Preparing issuance with the trusted local prover. Keep this tab open; no transaction is submitted.");
        const next = await current.current.prepare(); setReview(next);
        setMessage("Review 1,000,000 non-redeemable Preprod units to this wallet, then explicitly approve issuance.");
        if (next.transactionId) await poll(current.current, attempt);
      } else if (action === "approve") {
        setMessage("Approve the separate issuance transaction in 1AM.");
        setReview(await current.current.approveAndSubmit());
        await poll(current.current, attempt);
      } else await poll(current.current, attempt);
    } catch {
      if (attempt === generation.current) { setReview(current.current?.review() ?? null); setMessage("Issuance could not finish. Preserve recovery data. If locked, unlock the issuer again; check local prover availability before preparing. Reconcile any transaction identifier before retrying."); }
    } finally { if (attempt === generation.current) setBusy(false); }
  }
  return <section aria-label="Test asset issuance" className="mt-5 border-t border-border pt-4 text-sm">
    <h4 className="font-medium">Issue non-redeemable Preprod test units</h4>
    <p>Amount: 1,000,000 atomic units · Recipient: connected Wallet A · DUST fee paid by Wallet A</p>
    <Button variant="outline" disabled={busy} onClick={() => void run("prepare")}>Prepare / recover issuance</Button>
    {review && <div className="mt-3 space-y-2">
      <p className="break-all">Asset: {review.asset}</p><p>Issuance state: {review.phase}</p>
      {review.transactionId && <p className="break-all">Issuance transaction: {review.transactionId}</p>}
      <Button disabled={busy || !["prepared", "authorization_requested"].includes(review.phase)} onClick={() => void run("approve")}>Approve issuance of 1,000,000 test units</Button>
      {review.transactionId && <Button variant="outline" disabled={busy} onClick={() => void run("check")}>Check issuance</Button>}
    </div>}
    <p aria-live="polite" className="mt-3 text-muted">{message}</p>
  </section>;
}
