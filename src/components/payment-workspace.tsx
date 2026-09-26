"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import type { OneAmSession } from "@/lib/midnight/oneam";
import type { PaymentView } from "@/lib/midnight/payments";
import { decodeClaim, extractClaim } from "@/lib/midnight/payment-codec";
import { Button } from "./ui/button";
import { PaymentDeployment } from "./payment-deployment";
import { downloadLocal } from "./download";
type Controller = Awaited<ReturnType<OneAmSession["openPayments"]>>;
export function PaymentWorkspace({ session, claimToken, onClaimConsumed }: { session: OneAmSession; claimToken?: string; onClaimConsumed?: () => void }) {
  const controller = useRef<Controller | null>(null), generation = useRef(0);
  const [contract, setContract] = useState(""), [password, setPassword] = useState("");
  const [amount, setAmount] = useState("10"), [claim, setClaim] = useState("");
  const [busy, setBusy] = useState(false), [unlocked, setUnlocked] = useState(false);
  const [balance, setBalance] = useState<string | null>(null), [asset, setAsset] = useState("");
  const [records, setRecords] = useState<PaymentView[]>([]), [selected, setSelected] = useState("");
  const [message, setMessage] = useState("Use an existing escrow address, or create one below. Final E2E acceptance is pending.");
  const [link, setLink] = useState(""), [qr, setQr] = useState("");
  const [recipient, setRecipient] = useState(""), [importPassword, setImportPassword] = useState("");
  const [tab, setTab] = useState<"send" | "receive">("send");
  const current = records.find(r => r.id === selected);
  function lock() {
    generation.current++; controller.current?.lock(); controller.current = null;
    setUnlocked(false); setRecords([]); setSelected(""); setLink(""); setQr(""); setClaim(""); setPassword(""); setImportPassword(""); setBalance(null); setBusy(false);
    setMessage("Private workspace locked. Unlock with the same wallet and passphrase to recover saved payments.");
  }
  useEffect(() => {
    const saved = localStorage.getItem("moneymole/current-escrow"); if (saved && /^[a-f0-9]{64}$/.test(saved)) setContract(saved);
    return () => { generation.current++; controller.current?.lock(); };
  }, []);
  useEffect(() => {
    if (!claimToken) return;
    let active = true;
    void decodeClaim(claimToken).then(p => { if (active) { setClaim(claimToken); setContract(p.contract); setTab("receive"); setMessage("Claim captured locally and removed from the address bar. Unlock and save it before closing this tab."); onClaimConsumed?.(); } }).catch(() => { if (active) setMessage("This claim link is unsupported or damaged. Ask the sender for the original link."); });
    return () => { active = false; };
  }, [claimToken, onClaimConsumed]);
  useEffect(() => {
    if (!unlocked) return;
    const hide = () => { if (document.visibilityState === "hidden") lock(); };
    document.addEventListener("visibilitychange", hide); const timer = setTimeout(lock, 5 * 60_000);
    return () => { document.removeEventListener("visibilitychange", hide); clearTimeout(timer); };
  }, [unlocked]);
  async function refresh() {
    const c = controller.current; if (!c) return;
    const list = await c.list(); setRecords(list); setBalance((await c.balance()).toString());
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
      localStorage.setItem("moneymole/current-escrow", c.contract); setContract(c.contract);
      await refresh(); setMessage("Workspace unlocked. Reconcile saved records before relying on their state.");
    } catch { setMessage("Could not unlock. Check the Preprod escrow address, node/indexer availability and local passphrase. Existing encrypted data was preserved."); }
    finally { setPassword(""); setBusy(false); }
  }
  async function poll(id: string) {
    const c = controller.current, attempt = generation.current; if (!c) return;
    for (let n = 0; n < 12 && attempt === generation.current; n++) {
      const result = await c.reconcile(id); await refresh();
      if (result.phase === "failed") { setMessage("The finalized transaction failed. This record is preserved; do not reuse its transaction."); return; }
      if (result.role === "sender" && result.funded) { setMessage(result.spent ? "This payment has already been claimed." : "Funding is finalized and the escrow coin is qualified. Sharing is available."); return; }
      if (result.role === "receiver" && result.claimed && result.walletSynced) { setMessage("Claim confirmed and receiver balance synchronized. A controlled spend can establish spendability."); return; }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    setMessage("Confirmation or wallet synchronization is pending. Use Reconcile; do not submit again.");
  }
  async function showShare() {
    if (!controller.current || !current) return;
    const attempt = generation.current;
    const value = await controller.current.share(current.id);
    const dataUrl = await QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 4, width: 320 });
    if (attempt !== generation.current) return;
    setLink(value); setQr(dataUrl); setMessage("Anyone with this link can claim, including you. Share it privately. There is no expiry or refund.");
  }
  return <section aria-label="Payments" className="mt-6 space-y-6">
    <div className="panel">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Your payment workspace</h2>{unlocked && <Button variant="outline" onClick={lock}>Lock</Button>}</div>
      <label className="field">Preprod escrow address<input value={contract} onChange={e => setContract(e.target.value.trim())} disabled={unlocked || busy} spellCheck={false} autoComplete="off" /></label>
      {!unlocked && <><label className="field">Local recovery passphrase<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" disabled={busy} /></label><p className="mb-3 text-xs text-muted">At least 16 characters. Encrypts records on this device. Never use or enter a wallet seed or private key.</p><Button disabled={busy || password.length < 16 || !/^[a-f0-9]{64}$/.test(contract)} onClick={() => void unlock()}>Unlock payment workspace</Button></>}
      {unlocked && <><p className="mt-3 text-sm">Shielded test balance: <strong>{balance ?? "checking"}</strong> atomic units · zero decimals · non-redeemable</p><p className="mt-1 break-all text-xs text-muted">Asset: {asset}</p><p className="mt-2 text-xs text-muted">DUST covers fees. The wallet presents its actual fee request before authorization.</p></>}
    </div>
    <div className="flex gap-3" role="tablist" aria-label="Payment action"><Button role="tab" aria-selected={tab === "send"} variant={tab === "send" ? "default" : "outline"} onClick={() => setTab("send")}>Send payment</Button><Button role="tab" aria-selected={tab === "receive"} variant={tab === "receive" ? "default" : "outline"} onClick={() => setTab("receive")}>Receive payment</Button></div>
    {tab === "send" ? <div className="panel"><h3 className="font-medium">Fund a claim link</h3><label className="field">Whole test units<input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} disabled={busy} /></label><p className="mb-3 text-sm text-muted">An exact shielded amount is escrowed. A link becomes shareable only after funding is finalized.</p><Button disabled={!unlocked || busy} onClick={() => void operate(async () => { const v = await controller.current!.create(amount); setSelected(v.id); setMessage("Private draft saved. Prepare its proof, then approve funding."); })}>Save payment draft</Button></div> :
      <div className="panel"><h3 className="font-medium">Open a bearer claim</h3><label className="field">Claim link or token<textarea value={claim} onChange={e => setClaim(e.target.value)} spellCheck={false} autoComplete="off" rows={3} disabled={busy} /></label><p className="mb-3 text-sm text-muted">The link stays in this browser. If using a different escrow, lock and choose the address from the claim first.</p><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || unlocked || !claim} onClick={() => void operate(async () => { const p = await decodeClaim(extractClaim(claim)); setContract(p.contract); setMessage("Claim address selected. Unlock the workspace and save the claim."); })}>Use claim escrow</Button><Button disabled={!unlocked || busy || !claim} onClick={() => void operate(async () => { const v = await controller.current!.receive(extractClaim(claim)); setSelected(v.id); setClaim(""); setMessage("Funded claim verified and saved encrypted. Prepare the claim proof and approve with the receiver wallet."); })}>Verify and save claim</Button></div></div>}
    {unlocked && <div className="panel"><h3 className="font-medium">Saved payments and receipts</h3><p className="mt-2 text-xs text-muted">Reloaded records are unverified until reconciled. Hiding this tab or five minutes idle locks private state.</p>
      <label className="field">Select payment<select value={selected} onChange={e => { setSelected(e.target.value); setLink(""); setQr(""); }}><option value="">Select a saved payment</option>{records.map(r => <option key={r.id} value={r.id}>{r.role === "sender" ? "Send" : "Receive"} {r.amount} · {r.phase} · {r.id.slice(2, 10)}</option>)}</select></label>
      {current && <div className="space-y-3 text-sm"><p>Transaction: {current.phase} · {current.funded ? "funding verified" : "funding not verified this session"}{current.spent ? " · already claimed" : ""}</p>{current.transactionId && <p className="break-all">Identifier: {current.transactionId}</p>}{current.blockHash && <p className="break-all">Finalized block: {current.blockHash}</p>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || !!current.transactionId} onClick={() => void operate(async () => { setMessage("Preparing with the trusted local prover. Keep this tab visible."); await controller.current!.prepare(current.id); setMessage("Proof prepared. Review the amount and approve the transaction in 1AM."); })}>Prepare {current.role === "sender" ? "funding" : "claim"}</Button><Button disabled={busy || !!current.transactionId || !["prepared", "authorization_requested"].includes(current.phase)} onClick={() => void operate(async () => { setMessage("Review and approve this payment transaction in 1AM."); await controller.current!.approve(current.id); await poll(current.id); })}>Approve {current.role === "sender" ? "funding" : "claim"} of {current.amount}</Button><Button variant="outline" disabled={busy} onClick={() => void operate(() => poll(current.id))}>Reconcile</Button>
          {current.role === "sender" && <Button disabled={busy || !current.funded || current.spent} onClick={() => void operate(showShare)}>Show claim link / QR</Button>}
          <Button variant="outline" disabled={busy} onClick={() => void operate(async () => downloadLocal("moneymole-encrypted-payment.json", await controller.current!.exportEncrypted(current.id)))}>Save encrypted recovery</Button><Button variant="outline" disabled={busy || !current.funded} onClick={() => void operate(async () => downloadLocal("moneymole-public-receipt.json", JSON.stringify(await controller.current!.receipt(current.id), null, 2)))}>Save public receipt</Button>
        </div>
        {current.role === "receiver" && current.claimed && <details><summary className="cursor-pointer font-medium">Controlled spendability check</summary><p className="mt-2 text-muted">Sends the received {current.amount} units to another Preprod shielded wallet. To attribute spendability to this payment, use a receiver whose prior balance was zero and keep it free of other transfers.</p><label className="field">Destination shielded address<input value={recipient} onChange={e => setRecipient(e.target.value.trim())} autoComplete="off" spellCheck={false} disabled={busy} /></label><Button disabled={busy || !current.walletSynced || !!current.spendTransactionId || !recipient} onClick={() => void operate(async () => { await controller.current!.spend(current.id, recipient); await poll(current.id); })}>Approve controlled spend of {current.amount}</Button><p className="mt-2">Spend: {current.spendPhase ?? "not submitted"} · {current.spendVerified ? "verified" : "not verified"}</p>{current.spendTransactionId && <p className="break-all">Spend identifier: {current.spendTransactionId}</p>}</details>}
      </div>}
      {link && <div className="mt-5 space-y-3"><label className="field">Private bearer link<textarea readOnly value={link} rows={3} /></label><Button variant="outline" onClick={() => void navigator.clipboard.writeText(link).then(() => setMessage("Bearer link copied. Share privately.")).catch(() => setMessage("Clipboard unavailable. Select and copy the link manually."))}>Copy private link</Button>{qr && <Image unoptimized src={qr} width={320} height={320} alt="Private payment claim QR generated on this device" />}</div>}
      <details className="mt-5"><summary className="cursor-pointer font-medium">Import encrypted payment recovery</summary><label className="field">Original export passphrase<input type="password" value={importPassword} onChange={e => setImportPassword(e.target.value)} autoComplete="off" disabled={busy} /></label><label className="field">Recovery JSON file<input type="file" accept="application/json,.json" disabled={busy || importPassword.length < 16} onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_500_000) { setMessage("Recovery file is too large."); return; } void operate(async () => { const v = await controller.current!.importEncrypted(await file.text(), importPassword); setSelected(v.id); setImportPassword(""); setMessage("Encrypted record imported. Reconcile before relying on its state."); }); e.target.value = ""; }} /></label></details>
    </div>}
    <p role="status" aria-live="polite" className="rounded-lg border border-border p-4 text-sm">{message}</p>
    {!unlocked && <PaymentDeployment session={session} onSelect={setContract} />}
  </section>;
}
