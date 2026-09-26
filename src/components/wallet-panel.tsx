"use client";

import { useEffect, useRef, useState } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Button } from "@/components/ui/button";
import { discoverOneAm, OneAmSession, walletErrorMessage } from "@/lib/midnight/oneam";
import { IssuerSetup } from "./issuer-setup";
import { PaymentWorkspace } from "./payment-workspace";

export function WalletPanel({ claimToken, onClaimConsumed }: { claimToken?: string; onClaimConsumed?: () => void } = {}) {
  const [providers, setProviders] = useState<InitialAPI[]>([]);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState<OneAmSession | null>(null);
  const [message, setMessage] = useState("Check for 1AM to connect on Preprod.");
  const session = useRef<OneAmSession | null>(null);
  const generation = useRef(0);

  useEffect(() => () => { generation.current++; session.current?.disconnect(); }, []);
  useEffect(() => {
    if (!connected) return;
    let checking = false;
    const check = async () => {
      const current = session.current;
      if (!current || checking) return;
      checking = true;
      try { await current.check(); }
      catch {
        if (session.current === current) {
          session.current = null; setConnected(null);
          setMessage("Wallet connection changed. Connect again to continue.");
        }
      } finally { checking = false; }
    };
    const timer = setInterval(() => void check(), 10_000);
    window.addEventListener("focus", check);
    return () => { clearInterval(timer); window.removeEventListener("focus", check); };
  }, [connected]);

  async function connect(provider: InitialAPI) {
    const attempt = ++generation.current;
    setBusy(true); setMessage("Approve the connection in 1AM.");
    try {
      const current = await OneAmSession.connect(provider);
      if (attempt !== generation.current) { current.disconnect(); return; }
      const readiness = await current.check();
      if (attempt !== generation.current) { current.disconnect(); return; }
      session.current = current; setConnected(current);
      setMessage(readiness.dustAvailable ? "Connected to Preprod. DUST is available; transaction fees have not been estimated." : "Connected to Preprod. No DUST is currently available for fees.");
    } catch (error) { if (attempt === generation.current) setMessage(walletErrorMessage(error)); }
    finally { if (attempt === generation.current) setBusy(false); }
  }
  function discover() {
    const found = discoverOneAm(window.midnight);
    setProviders(found);
    setMessage(found.length ? "Choose 1AM and approve the connection in your wallet." : "A single supported 1AM API v4 provider was not found. Open 1AM and disable duplicate 1AM extensions, then check again.");
  }
  return <section aria-label="1AM connection" className="mt-8 rounded-xl border border-border p-5">
    <h2 className="font-medium">Your wallet</h2>
    <p role="status" className="mt-2 text-sm text-muted">{message}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      {!connected && !busy && <Button variant="outline" onClick={discover}>Check for 1AM</Button>}
      {!connected && providers.map((provider, index) => <Button key={index} disabled={busy} onClick={() => void connect(provider)}>Connect 1AM</Button>)}
      {(connected || busy) && <Button variant="outline" onClick={() => {
        generation.current++; session.current?.disconnect(); session.current = null;
        setConnected(null); setBusy(false); setMessage("Browser session cleared. Revoke site permissions inside 1AM if needed.");
      }}>{busy ? "Cancel connection" : "Disconnect"}</Button>}
    </div>
    <p className="mt-3 text-xs text-muted">Wallet authorization and private payment records stay in this browser.</p>
    {connected && <><PaymentWorkspace session={connected} {...(claimToken ? { claimToken } : {})} {...(onClaimConsumed ? { onClaimConsumed } : {})} /><details className="mt-6"><summary className="cursor-pointer font-medium">Test asset issuer administration</summary><IssuerSetup session={connected} /></details></>}
  </section>;
}
