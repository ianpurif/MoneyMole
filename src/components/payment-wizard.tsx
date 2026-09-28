"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import type { PaymentFlow, PaymentStage } from "@/lib/midnight/payment-flow";
import { formatAmount } from "@/domain/amount";
import { ContextSheet } from "./context-sheet";
import { Button } from "./ui/button";

const phases = ["Prepare payment", "Approve in wallet", "Confirm payment"];
const phaseIndex: Record<PaymentStage, number> = { draft: 0, balance: 0, prepare: 0, authorization: 1, submission: 2, confirmation: 2, success: 2 };
export function PaymentWizard({ flow, onClose }: {flow: PaymentFlow; onClose: () => void}) {
  const revision = useSyncExternalStore(flow.subscribe, flow.snapshot, flow.snapshot);
  const [qr, setQr] = useState(""), [copyMessage, setCopyMessage] = useState("");
  const [recipient, setRecipient] = useState(flow.destination);
  const current = phaseIndex[flow.stage];
  useEffect(() => {
    let active = true;
    if (flow.link) void QRCode.toDataURL(flow.link, {errorCorrectionLevel:"M",margin:4,width:256}).then(value => { if (active) setQr(value); }).catch(() => {});
    return () => { active = false; };
  }, [flow.link]);
  void revision;
  return <ContextSheet title={flow.payment?.role === "receiver" ? "Receive NIGHT" : "Send NIGHT"} eyebrow="" onClose={onClose}>
    <div className="payment-wizard" aria-busy={flow.busy}>
      {flow.payment && <p className="wizard-amount">{formatAmount(BigInt(flow.payment.amount), 6)} <span>NIGHT</span></p>}
      <ol className="wizard-steps" aria-label="Payment progress">{phases.map((label, index) => <li key={label} aria-current={index === current ? "step" : undefined} data-complete={index < current || flow.stage === "success"}><span aria-hidden="true" />{label}</li>)}</ol>
      <div role="status" aria-live="polite" className="wizard-status">
        {flow.busy ? <><span className="busy-indicator" aria-hidden="true" />{flow.stage === "authorization" ? "Review the request in your wallet." : flow.stage === "submission" ? "Sending your approved transaction…" : flow.stage === "confirmation" ? "Waiting for network confirmation…" : "Checking funds and preparing your payment…"}</> : flow.stage === "success" ? (flow.payment?.spendVerified ? "Transfer confirmed. Your received NIGHT was sent successfully." : flow.payment?.role === "sender" ? flow.payment.spent ? "This payment has already been claimed." : "Payment confirmed. Your private claim link is ready." : "NIGHT received. Your wallet balance will update as it syncs.") : flow.stage === "authorization" && !flow.error ? "Ready for your approval. NIGHT amounts and addresses are public; DUST covers fees." : null}
      </div>
      {flow.error && <p className="recovery-error" role="alert">{flow.error}</p>}
      {!flow.busy && flow.stage !== "success" && (flow.payment?.fundingRetryAvailable || flow.payment?.claimRetryAvailable || flow.payment?.spendRetryAvailable ? <Button onClick={() => void flow.retryFailed()}>Retry confirmed failed payment</Button> : flow.transferring && !flow.payment?.spendTransactionId ? <><label className="field">Destination NIGHT address<input value={recipient} onChange={event => setRecipient(event.target.value.trim())} /></label><Button onClick={() => void flow.spend(recipient)}>Retry transfer approval</Button></> : flow.stage === "authorization" && !flow.payment?.transactionId ? <Button onClick={() => void flow.authorize()}>Approve {flow.payment?.role === "receiver" ? "claim" : "payment"} in wallet</Button> : <Button onClick={() => void flow.retry()}>{flow.stage === "confirmation" ? "Check confirmation" : "Retry this step"}</Button>)}
      {flow.stage === "success" && flow.payment?.role === "receiver" && !flow.payment.spendTransactionId && <details>
        <summary>Send received NIGHT</summary>
        <p className="small-note">Send this received amount to another Preprod wallet. Avoid unrelated transfers while verifying its balance change.</p>
        <label className="field">Destination NIGHT address<input value={recipient} onChange={event => setRecipient(event.target.value.trim())} autoComplete="off" spellCheck={false} /></label>
        <Button disabled={flow.busy || !recipient} onClick={() => void flow.spend(recipient)}>Approve transfer in wallet</Button>
      </details>}
      {flow.stage === "success" && flow.link && <div className="wizard-share">
        <label className="field">Private claim link<textarea readOnly value={flow.link} rows={3} /></label>
        <Button onClick={() => { void navigator.clipboard.writeText(flow.link).then(() => setCopyMessage("Copied. Share privately.")).catch(() => setCopyMessage("Select and copy the link above.")); }}>Copy private link</Button>
        {qr && <details><summary>Show QR code</summary><Image unoptimized src={qr} alt="Private claim QR generated on this device" width={192} height={192} /></details>}
        <p className="small-note">Anyone with this link can claim. Share it privately.</p><p role="status">{copyMessage}</p>
      </div>}
      <button className="embroidered-button embroidered-light quiet-button" onClick={onClose}>{flow.stage === "success" ? "Done" : "Close and resume later"}</button>
      {flow.stage !== "success" && <p className="small-note">Progress is saved securely. You can close this window and resume.</p>}
    </div>
  </ContextSheet>;
}
