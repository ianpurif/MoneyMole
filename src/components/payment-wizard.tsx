"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import type { PaymentFlow, PaymentStage } from "@/lib/midnight/payment-flow";
import { formatAmount } from "@/domain/amount";
import { ContextSheet } from "./context-sheet";
import { Button } from "./ui/button";

const stages: {id: PaymentStage; label: string}[] = [
  {id:"draft",label:"Save securely"}, {id:"balance",label:"Check funds"}, {id:"prepare",label:"Prepare payment"},
  {id:"authorization",label:"Approve in wallet"}, {id:"submission",label:"Send transaction"}, {id:"confirmation",label:"Confirm payment"}, {id:"success",label:"Ready"},
];
export function PaymentWizard({ flow, onClose }: {flow: PaymentFlow; onClose: () => void}) {
  const revision = useSyncExternalStore(flow.subscribe, flow.snapshot, flow.snapshot);
  const [qr, setQr] = useState(""), [copyMessage, setCopyMessage] = useState("");
  const [recipient, setRecipient] = useState(flow.destination);
  const current = stages.findIndex(step => step.id === flow.stage);
  useEffect(() => {
    let active = true;
    if (flow.link) void QRCode.toDataURL(flow.link, {errorCorrectionLevel:"M",margin:4,width:256}).then(value => { if (active) setQr(value); }).catch(() => {});
    return () => { active = false; };
  }, [flow.link]);
  void revision;
  return <ContextSheet title={flow.payment?.role === "receiver" ? "Receive NIGHT" : "Send NIGHT"} eyebrow="" onClose={onClose}>
    <div className="payment-wizard" aria-busy={flow.busy}>
      {flow.payment && <p className="wizard-amount">{formatAmount(BigInt(flow.payment.amount), 6)} <span>NIGHT</span></p>}
      <ol className="wizard-steps" aria-label="Payment progress">{stages.map((step,index) => <li key={step.id} aria-current={index === current ? "step" : undefined} data-complete={index < current}><span aria-hidden="true">{index < current ? "✓" : index + 1}</span>{step.label}</li>)}</ol>
      <div role="status" aria-live="polite" className="wizard-status">
        {flow.busy ? <><span className="busy-indicator" aria-hidden="true" />{flow.stage === "authorization" ? "Review the request in your wallet." : flow.stage === "submission" ? "Sending your approved transaction…" : flow.stage === "confirmation" ? "Waiting for network confirmation…" : "Your progress is being saved as we go…"}</> : flow.stage === "success" ? (flow.payment?.spendVerified ? "Transfer confirmed. Your received NIGHT was sent successfully." : flow.payment?.role === "sender" ? flow.payment.spent ? "This payment has already been claimed." : "Payment confirmed. Your private claim link is ready." : "NIGHT received. Your wallet balance will update as it syncs.") : flow.stage === "authorization" && !flow.error ? "Ready for your approval. NIGHT amounts and addresses are public; DUST covers fees." : null}
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
        {qr && <Image unoptimized src={qr} alt="Private claim QR generated on this device" width={256} height={256} />}
        <p className="small-note">Anyone with this link can claim. Share it privately.</p><p role="status">{copyMessage}</p>
      </div>}
      <button className="quiet-button" onClick={onClose}>{flow.stage === "success" ? "Done" : "Close and resume later"}</button>
      {flow.stage !== "success" && <p className="small-note">Saved progress stays encrypted on this device. Closing this window does not cancel a submitted transaction.</p>}
    </div>
  </ContextSheet>;
}
