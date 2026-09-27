"use client";

import type { ReactNode } from "react";
import { BrandImage } from "./product-shell";

export type PaymentAction = "send" | "receive" | "activity";
export function WalletCard({ action, onAction, disabled, connected, balances, walletName, controls }: {
  action: PaymentAction; onAction: (action: PaymentAction) => void; disabled: boolean;
  connected: boolean; balances?: { night: string | null; dust: string | null }; walletName?: string; controls?: ReactNode;
}) {
  return <div className="wallet-card" aria-label="MoneyMole wallet card">
    <div className="wallet-card-brand"><span><BrandImage size={32} alt="MoneyMole logo" />MoneyMole</span><span className="card-network">PREPROD</span></div>
    <div className="wallet-card-body"><div className="card-account">
      {connected ? <dl className="card-balances">{(["night", "dust"] as const).map(asset => <div key={asset}><dt className="card-caption">Total {asset.toUpperCase()}</dt><dd className={`card-value${(balances?.[asset]?.length ?? 0) > 13 ? " balance-precise" : ""}`} aria-label={`Total ${asset.toUpperCase()}`}>{balances?.[asset] ?? "Unavailable"}</dd></div>)}</dl> : <><span className="card-caption">YOUR NIGHT WALLET</span><p className="card-value">On your terms.</p></>}
      <span className="card-connection"><span className={connected ? "card-dot online" : "card-dot"} />{connected ? `${walletName} connected` : "Connect your wallet"}</span>
    </div>{!connected && <span className="card-chip" aria-hidden="true"><i /><i /><i /></span>}</div>
    <div className="card-controls">{controls ?? <span>Native NIGHT <span aria-hidden="true">·</span> DUST fees</span>}</div>
    <div className="action-switch card-actions" role="group" aria-label="Payment action">{(["send", "receive", "activity"] as const).map((value, index) => <button key={value} disabled={disabled} aria-pressed={action === value} onClick={() => onAction(value)}><span aria-hidden="true">{["↗", "↙", "↺"][index]}</span>{value === "send" ? "Send" : value === "receive" ? "Receive" : "Activity"}</button>)}</div>
  </div>;
}
