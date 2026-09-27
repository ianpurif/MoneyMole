"use client";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { walletName } from "@/lib/midnight/oneam";
import { ContextSheet } from "./context-sheet";
const wallets = [
  { name: "1AM", icon: "/images/wallets/1am.ico", url: "https://1am.xyz/" },
  { name: "Lace", icon: "/images/wallets/lace.png", url: "https://www.lace.io/" },
] as const;
function safeIcon(icon: string | undefined, fallback: string) {
  return icon && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/i.test(icon) ? icon : fallback;
}
export function WalletConnectModal({ providers, busy, message, onSelect, onClose, onRefresh }: {
  providers: InitialAPI[]; busy: boolean; message: string;
  onSelect: (provider: InitialAPI) => void; onClose: () => void; onRefresh: () => void;
}) {
  return <ContextSheet title="Connect Wallet" eyebrow="" onClose={onClose}>
    <div className="wallet-choice-list">{wallets.map(wallet => {
      const provider = providers.find(item => walletName(item) === wallet.name);
      return <div key={wallet.name} className="wallet-choice-row">
        <button className="wallet-choice" aria-label={wallet.name} disabled={busy || !provider} onClick={() => { if (provider) onSelect(provider); }}>
          {/* Provider-supplied brand image is rendered as an image, never markup. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={safeIcon(provider?.icon, wallet.icon)} alt="" width="40" height="40" referrerPolicy="no-referrer" onError={event => { if (!event.currentTarget.src.endsWith(wallet.icon)) event.currentTarget.src = wallet.icon; }} />
          <span>{wallet.name}<small>{provider ? "Connect" : "Not detected"}</small></span><span aria-hidden="true">↗</span>
        </button>
        {!provider && <a href={wallet.url} target="_blank" rel="noreferrer" className="quiet-button">Get {wallet.name}</a>}
      </div>;
    })}</div>
    {message && <p role="status" className="recovery-status">{message}</p>}
    <button className="quiet-button" disabled={busy} onClick={onRefresh}>Refresh wallets</button>
  </ContextSheet>;
}
