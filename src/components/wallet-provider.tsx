"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { OneAmSession, WalletSessionInvalid, walletErrorMessage } from "@/lib/midnight/oneam";
import { toast } from "sonner";

function useWalletState() {
  const [connected, setConnected] = useState<OneAmSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Check for 1AM to connect on Preprod.");
  const session = useRef<OneAmSession | null>(null), generation = useRef(0);

  useEffect(() => () => { generation.current++; session.current?.disconnect(); session.current = null; }, []);
  useEffect(() => {
    if (!connected) return;
    let checking = false, stopped = false;
    const check = async () => {
      if (checking || stopped || document.visibilityState === "hidden") return;
      checking = true;
      try {
        await connected.check();
        const dust = await connected.dustAvailable();
        if (!stopped && session.current === connected) setMessage(dust === null
          ? "Connected to Preprod. DUST balance is temporarily unavailable; checking again shortly."
          : dust ? "Connected to Preprod. DUST is available; transaction fees have not been estimated."
            : "Connected to Preprod. No DUST is currently available for fees.");
      } catch (error) {
        if (!stopped && session.current === connected) {
          if (error instanceof WalletSessionInvalid) {
            session.current = null; setConnected(null); toast.dismiss();
            setMessage("1AM invalidated this session or changed account/network. Connect again on Preprod.");
          } else setMessage("1AM is temporarily unavailable. Connection retained; checking again shortly. Actions require a fresh wallet check.");
        }
      } finally { checking = false; }
    };
    // Reading fee readiness is independent from accepting the authorized session.
    void check();
    const timer = setInterval(() => void check(), 15_000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { stopped = true; clearInterval(timer); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, [connected]);

  async function connect(provider: InitialAPI) {
    const attempt = ++generation.current;
    setBusy(true); setMessage("Approve the connection in 1AM.");
    try {
      const current = await OneAmSession.connect(provider);
      if (attempt !== generation.current) { current.disconnect(); return; }
      session.current = current; setConnected(current);
      setMessage("Connected to Preprod. Checking DUST availability for fees.");
      toast.success("1AM connected", { description: "Your wallet is on Preprod." });
    } catch (error) { if (attempt === generation.current) setMessage(walletErrorMessage(error)); }
    finally { if (attempt === generation.current) setBusy(false); }
  }
  function cancel() {
    generation.current++; setBusy(false);
    setMessage("Connection cancelled. You can connect again when ready."); toast.dismiss();
  }
  function disconnect() {
    generation.current++; session.current?.disconnect(); session.current = null;
    setConnected(null); setBusy(false); toast.dismiss();
    setMessage("Browser session cleared. Revoke site permissions inside 1AM if needed.");
  }
  return { connected, busy, message, setMessage, connect, cancel, disconnect };
}
const WalletContext = createContext<ReturnType<typeof useWalletState> | null>(null);
/** Root-layout lifetime: client navigation keeps authorization in memory only.
 * Connector v4 offers no passive restore API; reload never prompts automatically. */
export function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletContext.Provider value={useWalletState()}>{children}</WalletContext.Provider>;
}
export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error("WalletProvider is required");
  return wallet;
}
