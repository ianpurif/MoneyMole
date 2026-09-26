"use client";
import { useEffect, useRef, useState } from "react";
import type { OneAmSession } from "@/lib/midnight/oneam";
import { Button } from "./ui/button";
import { downloadLocal } from "./download";
type Deployment = Awaited<ReturnType<OneAmSession["preparePaymentDeployment"]>>;
export function PaymentDeployment({ session, onSelect }: { session: OneAmSession; onSelect: (address: string) => void }) {
  const [password, setPassword] = useState(""), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Create an escrow only when you do not already have one. Keep its address and encrypted recovery file.");
  const [review, setReview] = useState<ReturnType<Deployment["review"]> | null>(null);
  const current = useRef<Deployment | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; current.current?.lock(); }, []);
  async function run(action: "unlock" | "approve" | "check" | "export" | "backup") {
    const attempt = generation.current; setBusy(true);
    try {
      if (action === "unlock") {
        current.current?.lock();
        const opened = await session.preparePaymentDeployment(password);
        if (attempt !== generation.current) { opened.lock(); return; } current.current = opened;
        setPassword(""); setReview(opened.review()); setMessage("Review Preprod and the escrow address before approving deployment. This action creates no payment and issues no tokens.");
        if (opened.review().transactionId) setReview(await opened.reconcile());
      } else if (current.current) {
        if (action === "approve") { setMessage("Approve escrow deployment in 1AM. DUST pays the fee."); setReview(await current.current.approve()); }
        if (action === "check") setReview(await current.current.reconcile());
        if (action === "export") downloadLocal("moneymole-preprod-deployment.json", JSON.stringify(await current.current.publicRecord(), null, 2));
        if (action === "backup") downloadLocal("moneymole-encrypted-escrow.json", await current.current.exportEncrypted());
        if (current.current.review().verified) { setMessage("Escrow confirmed on the finalized Preprod chain. Save its public deployment record and use this address."); onSelect(current.current.review().address); }
      }
    } catch { setMessage("Deployment operation could not finish. Preserve the record, unlock if the tab was hidden, and reconcile any existing transaction before retrying."); }
    finally { if (attempt === generation.current) { setPassword(""); setBusy(false); } }
  }
  return <details className="panel mt-6"><summary className="cursor-pointer font-medium">Create / recover a payment escrow</summary>
    <p className="mt-3 text-sm text-muted">Separate from test-asset issuance. Reuse an existing compatible escrow for more payments.</p>
    <label className="field">Local recovery passphrase<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
    <Button disabled={busy || password.length < 16} onClick={() => void run("unlock")}>Prepare / unlock escrow</Button>
    {review && <div className="mt-4 space-y-3 text-sm"><p className="break-all">Preprod escrow: {review.address}</p><p>State: {review.phase} {review.verified ? "· chain verified" : "· not verified in this session"}</p>
      {review.transactionId && <p className="break-all">Transaction: {review.transactionId}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={busy || !!review.transactionId} onClick={() => void run("approve")}>Approve escrow deployment</Button><Button variant="outline" disabled={busy} onClick={() => void run("check")}>Check deployment</Button><Button variant="outline" disabled={busy} onClick={() => void run("backup")}>Save encrypted escrow recovery</Button><Button variant="outline" disabled={busy || !review.verified} onClick={() => void run("export")}>Save public deployment record</Button></div>
    </div>}
    <p role="status" className="mt-3 text-sm text-muted">{message}</p>
  </details>;
}
