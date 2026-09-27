"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { OneAmSession, WalletSessionInvalid, walletErrorMessage, walletName, type WalletBalances } from "@/lib/midnight/oneam";
import { toast } from "sonner";

function useWalletState() {
  const [connected, setConnected] = useState<OneAmSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [balances, setBalances] = useState<WalletBalances>({ night: null, dust: null });
  const session = useRef<OneAmSession | null>(null), generation = useRef(0);
  const refreshId = useRef(0);

  const refreshBalances = useCallback(async () => {
    const current = session.current, id = ++refreshId.current;
    if (!current) return;
    try {
      const next = await current.balances();
      if (session.current !== current || id !== refreshId.current) return;
      setBalances(next);
      setMessage(next.night === null || next.dust === null ? "Balance temporarily unavailable. Retrying shortly." : "");
    } catch (error) {
      if (session.current !== current || id !== refreshId.current) return;
      setBalances({ night: null, dust: null });
      if (error instanceof WalletSessionInvalid) {
        session.current = null; setConnected(null); toast.dismiss();
        setMessage("Wallet invalidated this session or changed account/network. Connect again on Preprod.");
      } else setMessage("Wallet temporarily unavailable. Connection retained; retrying shortly.");
    }
  }, []);

  useEffect(() => () => { generation.current++; session.current?.disconnect(); session.current = null; }, []);
  useEffect(() => {
    if (!connected) return;
    let checking = false, stopped = false;
    const check = async () => {
      if (checking || stopped || document.visibilityState === "hidden") return;
      checking = true;
      try { await refreshBalances(); } finally { checking = false; }
    };
    // Reading fee readiness is independent from accepting the authorized session.
    void check();
    const timer = setInterval(() => void check(), 15_000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { stopped = true; clearInterval(timer); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, [connected, refreshBalances]);

  async function connect(provider: InitialAPI) {
    const attempt = ++generation.current;
    setBusy(true); setMessage(`Approve the connection in ${walletName(provider)}.`);
    try {
      const current = await OneAmSession.connect(provider);
      if (attempt !== generation.current) { current.disconnect(); return; }
      session.current = current; setConnected(current);
      setBalances({ night: null, dust: null }); setMessage("");
      toast.success(`${current.name} connected`, { description: "Your wallet is on Preprod." });
    } catch (error) { if (attempt === generation.current) setMessage(walletErrorMessage(error)); }
    finally { if (attempt === generation.current) setBusy(false); }
  }
  function cancel() {
    generation.current++; setBusy(false);
    setMessage("Connection cancelled. You can connect again when ready."); toast.dismiss();
  }
  function disconnect() {
    generation.current++; session.current?.disconnect(); session.current = null;
    setConnected(null); setBalances({ night: null, dust: null }); setBusy(false); toast.dismiss();
    setMessage("Browser session cleared.");
  }
  return { connected, busy, message, setMessage, balances, refreshBalances, connect, cancel, disconnect };
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
