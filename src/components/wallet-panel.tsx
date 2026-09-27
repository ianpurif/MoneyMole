"use client";

import { useState, useSyncExternalStore } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Button } from "@/components/ui/button";
import { discoverOneAm } from "@/lib/midnight/oneam";
import { useWallet } from "./wallet-provider";
import { ContextSheet } from "./context-sheet";
import { WalletCard } from "./wallet-card";
import { PaymentWorkspace } from "./payment-workspace";
const subscribeHydration = () => () => {};

export function WalletPanel({ claimToken, onClaimConsumed, initialAction = "send" }: { claimToken?: string; onClaimConsumed?: () => void; initialAction?: "send" | "receive" | "activity" } = {}) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [action, setAction] = useState<"send" | "receive" | "activity">(claimToken ? "receive" : initialAction);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [draftAmount, setDraftAmount] = useState("10");
  const [providers, setProviders] = useState<InitialAPI[]>([]);
  const { connected, busy, message, setMessage, connect, cancel, disconnect } = useWallet();
  function discover() {
    const found = discoverOneAm(window.midnight);
    setProviders(found);
    setMessage(found.length ? "Choose 1AM and approve the connection in your wallet." : "A single supported 1AM API v4 provider was not found. Open 1AM and disable duplicate 1AM extensions, then check again.");
  }

  return <section aria-label="1AM connection" className="payment-app">
    {!connected && <>
      <WalletCard action={action} onAction={setAction} disabled={!hydrated || busy} connected={false} />
      <div className="wallet-scroll" tabIndex={0} role="region" aria-label="Payment content">
      <div key={action} className="disconnected-action state-view">
        {action === "send" ? <><div className="flow-heading"><h2>Send NIGHT.</h2><p>One amount. One bearer claim link.</p></div><label className="amount-field"><span>You send</span><div><input aria-label="Amount in NIGHT" inputMode="decimal" value={draftAmount} onChange={e => setDraftAmount(e.target.value)} maxLength={46} autoComplete="off" /><span className="asset-label"><span aria-hidden="true">◈</span> NIGHT</span></div><small>Native Preprod NIGHT · Public transfers</small></label><div className="delivery-row"><span className="delivery-icon" aria-hidden="true">↗</span><div><strong>A link they can claim</strong><span>Ready after funding is finalized</span></div><span aria-hidden="true">⌁</span></div></> : action === "receive" ? <div className="empty-action"><span className="empty-symbol" aria-hidden="true">↙</span><h2>A payment, just a link away.</h2><p>{claimToken ? "Your claim is held in this browser. Connect to verify and save it encrypted." : "Connect your wallet, then paste a private claim link to receive its funded value."}</p><span className="small-note">The sender does not need to stay online.</span></div> : <div className="empty-action"><span className="empty-symbol" aria-hidden="true">↺</span><h2>Your payments live with you.</h2><p>Connect the same wallet and unlock local recovery to see your saved payments.</p><span className="small-note">Encrypted on this device. No account needed.</span></div>}
      </div>
      <div className="connection-actions">
        {!busy && providers.length === 0 && <Button className="primary-action" disabled={!hydrated} onClick={discover}>Check for 1AM <span aria-hidden="true">↗</span></Button>}
        {providers.map((provider, index) => <Button className="primary-action" key={index} disabled={busy} onClick={() => void connect(provider)}>{busy ? "Waiting for 1AM…" : "Connect 1AM"}</Button>)}
        {busy && <button className="quiet-button" onClick={cancel}>Cancel connection</button>}
      </div>
      <p className="app-disclaimer">Anyone with a claim link can redeem it.<br />Live acceptance of this implementation is pending.</p>
      </div>
    </>}
    {connected && <PaymentWorkspace session={connected} onTools={() => setToolsOpen(true)} onDisconnect={() => { disconnect(); setToolsOpen(false); }} initialAction={action} initialAmount={draftAmount} {...(claimToken ? { claimToken } : {})} {...(onClaimConsumed ? { onClaimConsumed } : {})} />}
    <p role="status" className={connected ? "connection-status connected" : "connection-status"}>{message}</p>
    {toolsOpen && connected && <ContextSheet title="Advanced setup" onClose={() => setToolsOpen(false)}><p className="sheet-intro">Use native Preprod NIGHT from your 1AM wallet. DUST pays fees; no MoneyMole token issuance is needed.</p><p>NIGHT amounts and wallet addresses are public on-chain. Bearer secrets and encrypted recovery stay in your browser.</p><p>To deploy or recover a NIGHT escrow, lock your workspace and use Create / recover a payment escrow. Old test-token escrows and mm1 links are incompatible; their saved data is preserved.</p></ContextSheet>}
  </section>;
}
