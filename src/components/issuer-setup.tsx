"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import type { OneAmSession } from "@/lib/midnight/oneam";
import type { DeploymentReview } from "@/lib/midnight/issuer-deployment";
import { IssuanceSetup } from "./issuance-setup";
import { AdminRecovery } from "./admin-recovery";
type Prepared = Awaited<ReturnType<OneAmSession["prepareIssuer"]>>;

export function IssuerSetup({ session }: { session: OneAmSession }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<DeploymentReview | null>(null);
  const [message, setMessage] = useState("Use Wallet A in Chrome. Preparing does not submit a transaction.");
  const prepared = useRef<Prepared | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; prepared.current?.lock(); }, []);
  const unlocked = review !== null;
  useEffect(() => {
    const lock = () => { generation.current++; prepared.current?.lock(); prepared.current = null; setReview(null); setPassword(""); setBusy(false); setMessage("Issuer locked. Unlock the existing record to continue."); };
    const hide = () => { if (document.visibilityState === "hidden") lock(); };
    document.addEventListener("visibilitychange", hide);
    const timer = unlocked ? setTimeout(lock, 5 * 60_000) : undefined;
    return () => { document.removeEventListener("visibilitychange", hide); clearTimeout(timer); };
  }, [unlocked]);
  async function reconcile(current: Prepared, attempt: number) {
    for (let count = 0; count < 12 && attempt === generation.current; count++) {
      const state = await current.reconcile();
      if (attempt !== generation.current) return;
      setReview(state);
      if (state.phase === "finalized") { setMessage("Issuer deployment confirmed by the Preprod indexer. Issuance is a separate operation below. Keep your local recovery passphrase and record."); return; }
      if (!state.transactionId) return;
      setMessage("Waiting for the Preprod indexer to confirm deployment. Do not deploy again.");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    if (attempt === generation.current) setMessage("Confirmation is still pending. Use Check deployment to reconcile the same transaction.");
  }
  async function prepare() {
    const attempt = ++generation.current;
    setBusy(true); setMessage("Preparing the issuer deployment locally…");
    try {
      prepared.current?.lock();
      const current = await session.prepareIssuer(password);
      if (attempt !== generation.current) { current.lock(); return; }
      prepared.current = current;
      setReview(prepared.current.review());
      setMessage("Review the deployment below. No tokens will be issued by this action.");
      if (current.review().transactionId) await reconcile(current, attempt);
    } catch { if (attempt === generation.current) setMessage("Preparation failed. Check Preprod, compiled artifacts and your local unlock passphrase. Existing recovery data was preserved."); }
    finally { if (attempt === generation.current) { setPassword(""); setBusy(false); } }
  }
  async function deploy() {
    const current = prepared.current, attempt = generation.current; if (!current) return;
    setBusy(true); setMessage("Review and approve the issuer deployment in 1AM. This uses DUST and does not issue tokens.");
    try {
      await session.check();
      const result = await current.approveAndSubmit();
      if (attempt !== generation.current) return;
      setReview(result); await reconcile(current, attempt);
    } catch {
      if (attempt === generation.current) { setReview(current.review()); setMessage("Deployment did not finish. Keep this record. An unknown outcome must be reconciled before retrying."); }
    } finally { if (attempt === generation.current) setBusy(false); }
  }
  async function check() {
    if (!prepared.current) return;
    setBusy(true);
    try { await reconcile(prepared.current, generation.current); }
    catch { setMessage("Unable to confirm deployment. Unlock the existing record if this tab was hidden or idle, then check again. Do not redeploy."); }
    finally { setBusy(false); }
  }
  async function backup() {
    if (!prepared.current) return;
    try {
      const url = URL.createObjectURL(new Blob([await prepared.current.exportEncrypted()], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "moneymole-encrypted-issuer.json"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMessage("Unlock the existing record before exporting encrypted recovery."); }
  }
  return <section aria-label="Preprod issuer setup" className="mt-6 border-t border-border pt-5">
    <h3 className="font-medium">Preprod test-asset issuer</h3>
    <p className="mt-2 text-sm text-muted">Deploys a separate issuer contract with a one-time supply cap of 1,000,000 non-redeemable test units. Issuance and payment funding are separate approvals.</p>
    <label className="mt-4 block text-sm">Local recovery passphrase (at least 16 characters)
      <input aria-label="Local recovery passphrase" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className="mt-2 block w-full rounded border border-border bg-transparent p-2" />
    </label>
    <p className="mt-2 text-xs text-muted">Choose your own passphrase and keep it private. It encrypts issuer authority on this device. Never enter a wallet seed phrase or private key.</p>
    <Button variant="outline" disabled={busy || password.length < 16} onClick={() => void prepare()}>Prepare / unlock issuer deployment</Button>
    {review && <div className="mt-4 space-y-2 text-sm">
      <p>Network: Preprod · Deployment only · No token issuance</p>
      <p className="break-all">Contract: {review.address}</p>
      <p>State: {review.phase}</p>
      {review.transactionId && <p className="break-all">Transaction: {review.transactionId}</p>}
      {review.blockHash && <p className="break-all">Observed block: {review.blockHash}</p>}
      <Button variant="outline" disabled={busy} onClick={() => void backup()}>Save encrypted recovery</Button>
      <Button disabled={busy || !["prepared", "authorization_requested"].includes(review.phase)} onClick={() => void deploy()}>Approve issuer deployment on Preprod</Button>
      {review.transactionId && <Button variant="outline" disabled={busy} onClick={() => void check()}>Check deployment</Button>}
    </div>}
    <p aria-live="polite" className="mt-3 text-sm text-muted">{message}</p>
    {!review && <AdminRecovery session={session} kind="issuer" />}
    {!busy && review?.phase === "finalized" && <IssuanceSetup open={async () => {
      await session.check();
      if (!prepared.current) throw new Error("Unlock issuer first");
      return prepared.current.openIssuance();
    }} />}
  </section>;
}
