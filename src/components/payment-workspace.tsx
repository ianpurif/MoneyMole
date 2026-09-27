"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";
import { parseAmount, formatAmount } from "@/domain/amount";
import type { OneAmSession } from "@/lib/midnight/oneam";
import type { PaymentView } from "@/lib/midnight/payments";
import { decodeClaim, extractClaim } from "@/lib/midnight/payment-codec";
import { Button } from "./ui/button";
import { PaymentDeployment } from "./payment-deployment";
import { WalletCard } from "./wallet-card";
import { downloadLocal } from "./download";
const night = (atomic: string) => formatAmount(BigInt(atomic), 6);
type Controller = Awaited<ReturnType<OneAmSession["openPayments"]>>;
export function PaymentWorkspace({ session, claimToken, onClaimConsumed, initialAction = "send", initialAmount = "10", onTools, onDisconnect }: { onTools: () => void; onDisconnect: () => void; session: OneAmSession; claimToken?: string; onClaimConsumed?: () => void; initialAction?: "send" | "receive" | "activity"; initialAmount?: string }) {
  const controller = useRef<Controller | null>(null), generation = useRef(0);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [contract, setContract] = useState(""), [password, setPassword] = useState("");
  const [amount, setAmount] = useState(initialAmount), [claim, setClaim] = useState("");
  const [busy, setBusy] = useState(false), [unlocked, setUnlocked] = useState(false);
  const [balance, setBalance] = useState<string | null>(null), [asset, setAsset] = useState("");
  const [records, setRecords] = useState<PaymentView[]>([]), [selected, setSelected] = useState("");
  const [message, setMessage] = useState("Unlock encrypted records to continue. Use your existing escrow address.");
  const [link, setLink] = useState(""), [qr, setQr] = useState("");
  const [recipient, setRecipient] = useState(""), [importPassword, setImportPassword] = useState("");
  const [tab, setTab] = useState<"send" | "receive" | "activity">(initialAction);
  useEffect(() => { scrollArea.current?.scrollTo({ top: 0 }); }, [tab, unlocked]);
  let amountValid = false;
  try { parseAmount(amount, 6); amountValid = true; } catch { /* Inline validation only; the controller still validates. */ }
  const current = records.find(r => r.id === selected);
  function lock() {
    generation.current++; controller.current?.lock(); controller.current = null;
    setUnlocked(false); setRecords([]); setSelected(""); setLink(""); setQr(""); setClaim(""); setPassword(""); setImportPassword(""); setBalance(null); setBusy(false); toast.dismiss();
    setMessage("Private workspace locked. Unlock with the same wallet and passphrase to recover saved payments.");
  }
  useEffect(() => {
    const lifetime = generation, attempt = lifetime.current;
    const saved = localStorage.getItem("moneymole/night-escrow/v2");
    queueMicrotask(() => { if (attempt === lifetime.current && saved && /^[a-f0-9]{64}$/.test(saved)) setContract(saved); });
    return () => { lifetime.current++; controller.current?.lock(); };
  }, []);
  useEffect(() => {
    if (!claimToken) return;
    let active = true; const attempt = generation.current;
    void decodeClaim(claimToken).then(p => { if (active && attempt === generation.current) { setClaim(claimToken); setContract(p.contract); setTab("receive"); setMessage("Claim captured locally and removed from the address bar. Unlock and save it before closing this tab."); onClaimConsumed?.(); } }).catch(() => { if (active) setMessage("This claim link is unsupported or damaged. Ask the sender for the original link."); });
    return () => { active = false; };
  }, [claimToken, onClaimConsumed]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState === "hidden") lock(); };
    document.addEventListener("visibilitychange", hide); const timer = setTimeout(lock, 5 * 60_000);
    return () => { document.removeEventListener("visibilitychange", hide); clearTimeout(timer); };
  }, [unlocked]);
  async function refresh() {
    const c = controller.current, attempt = generation.current; if (!c) return;
    const list = await c.list(), value = night((await c.balance()).toString());
    if (attempt === generation.current) { setRecords(list); setBalance(value); }
  }
  async function operate(action: () => Promise<void>) {
    const attempt = generation.current; setBusy(true); setLink(""); setQr("");
    try { await action(); if (attempt === generation.current) await refresh(); }
    catch { if (attempt === generation.current) { setMessage("The operation could not finish. Check the wallet, balance, local prover and connection. Unlock if needed. Preserve saved records and reconcile any transaction identifier before retrying."); try { await refresh(); } catch { /* Preserve stored recovery; never log private errors. */ } } }
    finally { if (attempt === generation.current) setBusy(false); }
  }
  async function unlock() {
    const attempt = generation.current; setBusy(true);
    try {
      const c = await session.openPayments(contract.trim(), password);
      if (attempt !== generation.current) { c.lock(); return; }
      controller.current?.lock(); controller.current = c; setUnlocked(true); setAsset(c.asset);
      localStorage.setItem("moneymole/night-escrow/v2", c.contract); setContract(c.contract);
      await refresh(); if (attempt === generation.current) setMessage("Workspace unlocked. Reconcile saved records before relying on their state.");
    } catch { if (attempt === generation.current) setMessage("Could not unlock. Check the Preprod escrow address, node/indexer availability and local passphrase. Existing encrypted data was preserved."); }
    finally { if (attempt === generation.current) { setPassword(""); setBusy(false); } }
  }
  async function poll(id: string) {
    const c = controller.current, attempt = generation.current; if (!c) return;
    for (let n = 0; n < 12 && attempt === generation.current; n++) {
      const result = await c.reconcile(id); await refresh();
      if (attempt !== generation.current) return;
      if (result.phase === "failed") { setMessage("The transaction failed on the finalized chain. If Retry failed claim is available, reset it and prepare a fresh proof; the failed attempt stays in recovery history."); return; }
      if (result.role === "sender" && result.funded) { setMessage(result.spent ? "This payment has already been claimed." : "NIGHT funding is finalized and the escrow deposit is verified. Sharing is available."); return; }
      if (result.spendTransactionId) {
        if (result.spendVerified) { setMessage("Controlled spend finalized and the receiver NIGHT balance returned to its starting balance."); return; }
        if (result.spendPhase === "failed") { setMessage("The controlled spend failed on-chain. Use Retry failed spend to preserve the failed attempt and request a new approval."); return; }
      } else if (result.role === "receiver" && result.claimed && result.walletSynced) { setMessage("Claim confirmed and receiver balance synchronized. A controlled spend can establish spendability."); return; }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    if (attempt === generation.current) setMessage("Confirmation or wallet synchronization is pending. Use Reconcile; do not submit again.");
  }
  async function showShare() {
    if (!controller.current || !current) return;
    const attempt = generation.current;
    const value = await controller.current.share(current.id);
    const dataUrl = await QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 4, width: 320 });
    if (attempt !== generation.current) return;
    setLink(value); setQr(dataUrl); setMessage("Anyone with this link can claim, including you. Share it privately. There is no expiry or refund.");
  }
  return <section aria-label="Payments" className="workspace" aria-busy={busy}>
    <WalletCard action={tab} onAction={value => { setTab(value); setLink(""); setQr(""); }} disabled={busy} connected balance={unlocked ? balance : null} controls={<><button className="quiet-button" onClick={onTools} aria-label="Open workspace tools">Tools</button>{unlocked && <button className="quiet-button" onClick={lock}>Lock workspace</button>}<button className="quiet-button" onClick={onDisconnect}>Disconnect</button></>} />
    <div ref={scrollArea} className="wallet-scroll" tabIndex={0} role="region" aria-label="Payment content">
    {!unlocked && <div className="unlock-heading"><span className="step-number">YOUR LOCAL WORKSPACE</span><h2>Unlock. Pick up where you left off.</h2><p>Your passphrase unlocks encrypted records on this device.</p></div>}
    {!unlocked && tab === "receive" && <details className="claim-address"><summary>Select escrow from a claim link</summary><label className="field">Claim link or token<textarea value={claim} onChange={e => setClaim(e.target.value)} spellCheck={false} autoComplete="off" rows={3} disabled={busy} /></label><Button variant="outline" disabled={busy || !claim} onClick={() => void operate(async () => { const p = await decodeClaim(extractClaim(claim)); setContract(p.contract); setMessage("Claim address selected. Unlock the workspace and save the claim."); })}>Use claim escrow</Button></details>}
    {!unlocked &&
    <div className="panel">
      <label className="field">Preprod escrow address<input value={contract} onChange={e => setContract(e.target.value.trim())} disabled={unlocked || busy} spellCheck={false} autoComplete="off" /></label>
      {!unlocked && <><label className="field">Local recovery passphrase<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" disabled={busy} /></label><p className="mb-3 text-xs text-muted">At least 16 characters. Encrypts records on this device. Never use or enter a wallet seed or private key.</p><Button disabled={busy || password.length < 16 || !/^[a-f0-9]{64}$/.test(contract)} onClick={() => void unlock()}>Unlock payment workspace</Button></>}
    </div>}
    {unlocked && <div key={tab} className="state-view">
    {tab === "send" ? <div className="panel"><div className="flow-heading"><h2>Send NIGHT.</h2><p>Fund a bearer claim link. NIGHT amounts and addresses are public.</p></div><label className="field amount-entry">Amount in NIGHT<input aria-invalid={!amountValid} aria-describedby="amount-help" maxLength={46} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} disabled={busy} /></label><p className="mb-3 text-sm text-muted">Sharing unlocks after funding is finalized. DUST covers network fees.</p><p id="amount-help" className="field-error">{!amountValid ? "Enter a positive NIGHT amount with up to 6 decimal places." : ""}</p><Button className="primary-action" disabled={!unlocked || busy || !amountValid} onClick={() => void operate(async () => { const v = await controller.current!.create(amount); setSelected(v.id); setTab("activity"); setMessage("Private draft saved. Prepare its proof, then approve funding."); })}>Save payment draft</Button></div> : tab === "receive" ?
      <div className="panel"><h3 className="font-medium">Open a bearer claim</h3><label className="field">Claim link or token<textarea value={claim} onChange={e => setClaim(e.target.value)} spellCheck={false} autoComplete="off" rows={3} disabled={busy} /></label><p className="mb-3 text-sm text-muted">The link stays in this browser. If using a different escrow, lock and choose the address from the claim first.</p><div className="flex flex-wrap gap-2"><Button disabled={!unlocked || busy || !claim} onClick={() => void operate(async () => { const v = await controller.current!.receive(extractClaim(claim)); setSelected(v.id); setTab("activity"); setClaim(""); setMessage("Funded claim verified and saved encrypted. Prepare the claim proof and approve with the receiver wallet."); })}>Verify and save claim</Button></div></div> : null}
    {tab === "activity" && <div className="panel activity-panel"><h2 className="section-heading">{current ? "Review payment" : "Saved payments and receipts"}</h2>{records.length === 0 && <div className="empty-history"><span aria-hidden="true">↺</span><h3>A quiet start.</h3><p>Your saved payments will appear here. Send a payment, receive a claim, or import encrypted recovery below.</p></div>}{!current && <p className="mt-2 text-xs text-muted">Reloaded records need reconciliation before their state can be verified.</p>}
      {records.length > 0 && <label className="field">Select payment<select value={selected} onChange={e => { setSelected(e.target.value); setLink(""); setQr(""); }}><option value="">Select a saved payment</option>{records.map(r => <option key={r.id} value={r.id}>{r.role === "sender" ? "Send" : "Receive"} {night(r.amount)} · {r.phase} · {r.id.slice(2, 10)}</option>)}</select></label>}
      {current && <div className="space-y-3 text-sm"><div className="payment-summary"><span>{current.role === "sender" ? "Sending" : "Receiving"}</span><strong>{night(current.amount)} <small>NIGHT</small></strong><span className="phase-label">{current.phase.replaceAll("_", " ")}</span></div><details><summary>Transaction details</summary><p>Saved failed attempts: {current.failedAttempts} · Transaction: {current.phase} · {current.funded ? "funding verified" : "funding not verified this session"}{current.spent ? " · already claimed" : ""}</p>{current.transactionId && <p className="break-all">Identifier: {current.transactionId}</p>}{current.blockHash && <p className="break-all">Finalized block: {current.blockHash}</p>}
        </details><div className="transaction-actions"><Button variant="outline" hidden={!!current.transactionId || current.phase === "outcome_unknown" || ["prepared", "authorization_requested"].includes(current.phase)} disabled={busy || !!current.transactionId} onClick={() => void operate(async () => { setMessage("Preparing with the trusted local prover. Keep this tab visible."); await controller.current!.prepare(current.id); setMessage("Proof prepared. Review the amount and approve the transaction in 1AM."); })}>Prepare {current.role === "sender" ? "funding" : "claim"}</Button><Button hidden={!!current.transactionId || !["prepared", "authorization_requested"].includes(current.phase)} disabled={busy || !!current.transactionId || !["prepared", "authorization_requested"].includes(current.phase)} onClick={() => void operate(async () => { setMessage("Review and approve this payment transaction in 1AM."); await controller.current!.approve(current.id); await poll(current.id); })}>Approve {current.role === "sender" ? "funding" : "claim"} of {night(current.amount)}</Button><Button variant="outline" disabled={busy} onClick={() => void operate(() => poll(current.id))}>Reconcile</Button>
          {current.claimRetryAvailable && <Button variant="outline" disabled={busy} onClick={() => void operate(async () => { await controller.current!.retryFailed(current.id, "claim"); setMessage("Failed claim archived. Prepare a fresh claim proof, then approve it in 1AM."); })}>Retry failed claim</Button>}
          {current.spendRetryAvailable && <Button variant="outline" disabled={busy} onClick={() => void operate(async () => { await controller.current!.retryFailed(current.id, "spend"); setMessage("Failed spend archived. Review the destination and approve a new controlled spend."); })}>Retry failed spend</Button>}
          {current.role === "sender" && current.funded && !current.spent && <Button disabled={busy || !current.funded || current.spent} onClick={() => void operate(showShare)}>Show claim link / QR</Button>}
        </div><details><summary>Recovery & receipts</summary><div className="transaction-actions"><Button variant="outline" disabled={busy} onClick={() => void operate(async () => downloadLocal("moneymole-encrypted-payment.json", await controller.current!.exportEncrypted(current.id)))}>Save encrypted recovery</Button><Button variant="outline" disabled={busy || !current.funded} onClick={() => void operate(async () => downloadLocal("moneymole-public-receipt.json", JSON.stringify(await controller.current!.receipt(current.id), null, 2)))}>Save public receipt</Button>
        </div></details>
        {current.role === "receiver" && current.claimed && <details><summary className="cursor-pointer font-medium">Controlled spendability check</summary><p className="mt-2 text-muted">Sends the received {night(current.amount)} NIGHT to another Preprod unshielded wallet. Keep both wallets free of unrelated transfers so the recorded balance change can be verified.</p><label className="field">Destination NIGHT address<input value={recipient} onChange={e => setRecipient(e.target.value.trim())} autoComplete="off" spellCheck={false} disabled={busy} /></label><Button disabled={busy || !current.walletSynced || !!current.spendTransactionId || !recipient} onClick={() => void operate(async () => { await controller.current!.spend(current.id, recipient); await poll(current.id); })}>Approve controlled spend of {night(current.amount)}</Button><p className="mt-2">Spend: {current.spendPhase ?? "not submitted"} · {current.spendVerified ? "verified" : "not verified"}</p>{current.spendTransactionId && <p className="break-all">Spend identifier: {current.spendTransactionId}</p>}</details>}
      </div>}
      {link && <div className="mt-5 space-y-3"><label className="field">Private bearer link<textarea readOnly value={link} rows={3} /></label><Button variant="outline" onClick={() => void navigator.clipboard.writeText(link).then(() => { setMessage("Bearer link copied. Share privately."); toast.success("Private link copied", { description: "Anyone holding it can claim. Share privately." }); }).catch(() => { setMessage("Clipboard unavailable. Select and copy the link manually."); toast.error("Clipboard unavailable", { description: "Select and copy the link manually." }); })}>Copy private link</Button>{qr && <Image unoptimized src={qr} width={320} height={320} alt="Private payment claim QR generated on this device" />}</div>}
      <details className="mt-5"><summary className="cursor-pointer font-medium">Import encrypted payment recovery</summary><label className="field">Original export passphrase<input type="password" value={importPassword} onChange={e => setImportPassword(e.target.value)} autoComplete="off" disabled={busy} /></label><label className="field">Recovery JSON file<input type="file" accept="application/json,.json" disabled={busy || importPassword.length < 16} onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_500_000) { setMessage("Recovery file is too large."); return; } void operate(async () => { const v = await controller.current!.importEncrypted(await file.text(), importPassword); setSelected(v.id); setImportPassword(""); setMessage("Encrypted record imported. Reconcile before relying on its state."); }); e.target.value = ""; }} /></label></details>
    </div>}
    </div>}
    <p role="status" aria-live="polite" className="workspace-status">{busy && <span className="busy-indicator" aria-hidden="true" />}{message}</p>
    {unlocked && <details className="workspace-info"><summary>Asset & workspace details</summary><p className="break-all text-xs text-muted">Asset: {asset}</p><p className="break-all text-xs text-muted">Escrow: {contract}</p><p className="text-xs text-muted">Native Preprod NIGHT · 6 decimals · public amounts and addresses. DUST covers fees. Private state locks when this tab is hidden or after five minutes.</p></details>}
    {!unlocked && <PaymentDeployment session={session} onSelect={setContract} />}
    </div>
  </section>;
}
