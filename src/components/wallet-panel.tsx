"use client";

import { useState, useSyncExternalStore } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Button } from "@/components/ui/button";
import { discoverMidnightWallets } from "@/lib/midnight/oneam";
import { WalletConnectModal } from "./wallet-connect-modal";
import { useWallet } from "./wallet-provider";
import { WalletCard } from "./wallet-card";
import { PaymentWorkspace } from "./payment-workspace";
const subscribeHydration = () => () => {};

export function WalletPanel({ claimToken, onClaimConsumed, initialAction = "send" }: { claimToken?: string; onClaimConsumed?: () => void; initialAction?: "send" | "receive" | "activity" } = {}) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [action, setAction] = useState<"send" | "receive" | "activity">(claimToken ? "receive" : initialAction);
  const [providers, setProviders] = useState<InitialAPI[]>([]);
  const [choosing, setChoosing] = useState(false);
  const { connected, busy, message, setMessage, connect, cancel, disconnect } = useWallet();
  function discover() {
    const found = discoverMidnightWallets(window.midnight);
    setProviders(found);
    setChoosing(true);
    setMessage(found.length ? "" : "No supported wallet found. Open 1AM or Lace, disable duplicate extensions, then Connect again.");
  }

  return <section aria-label="Midnight wallet connection" className={`payment-app${connected ? "" : " payment-app-disconnected"}`}>
    {!connected && <>
      <WalletCard action={action} onAction={setAction} disabled={!hydrated || busy} connected={false} />
      <div key={action} className="wallet-scroll" tabIndex={0} role="region" aria-label="Payment content">
      <div key={action} className="disconnected-action state-view">
        {action === "send" ? null : action === "receive" ? <div className="empty-action"><span className="empty-symbol" aria-hidden="true">↙</span><h2>A payment, just a link away.</h2><p>{claimToken ? "Your claim is held in this browser. Connect to verify and save it encrypted." : "Connect your wallet, then paste a private claim link to receive its funded value."}</p><span className="small-note">The sender does not need to stay online.</span></div> : <div className="empty-action"><span className="empty-symbol" aria-hidden="true">↺</span><h2>Your payments live with you.</h2><p>Connect the same wallet and unlock local recovery to see your saved payments.</p><span className="small-note">Encrypted on this device. No account needed.</span></div>}
      </div>
      <div className="connection-actions">
        <Button className="primary-action" disabled={!hydrated || busy} onClick={discover}>Connect Wallet</Button>
        {choosing && <WalletConnectModal providers={providers} busy={busy} message={message} onSelect={provider => { void connect(provider); }} onClose={() => { cancel(); setChoosing(false); }} onRefresh={discover} />}
      </div>
      <p className="app-disclaimer">Anyone with a claim link can redeem it.<br />Live acceptance of this implementation is pending.</p>
      </div>
    </>}
    {connected && <PaymentWorkspace session={connected} onDisconnect={() => { disconnect(); setChoosing(false); }} initialAction={action} {...(claimToken ? { claimToken } : {})} {...(onClaimConsumed ? { onClaimConsumed } : {})} />}
    {message && <p role="status" className={connected ? "connection-status connected" : "connection-status"}>{message}</p>}
  </section>;
}
