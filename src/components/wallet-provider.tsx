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
  const [balancesStale, setBalancesStale] = useState(true);
  const session = useRef<OneAmSession | null>(null), generation = useRef(0);
  const refreshId = useRef(0);
  const refreshing = useRef<{ wallet: OneAmSession; promise: Promise<void> } | null>(null);

  const refreshBalances = useCallback(function refresh(afterCurrent = false): Promise<void> {
    if (session.current && refreshing.current?.wallet === session.current) {
      return afterCurrent ? refreshing.current.promise.then(() => refresh()) : refreshing.current.promise;
    }
    const current = session.current, id = ++refreshId.current;
    if (!current) return Promise.resolve();
    const promise = (async () => {
    try {
      const next = await current.balances();
      if (session.current !== current || id !== refreshId.current) return;
      setBalances(previous => ({ night: next.night ?? previous.night, dust: next.dust ?? previous.dust }));
      setBalancesStale(next.night === null || next.dust === null);
      setMessage(next.night === null || next.dust === null ? "Refreshing wallet totals. Last known balances stay visible." : "");
    } catch (error) {
      if (session.current !== current || id !== refreshId.current) return;
      setBalancesStale(true);
      if (error instanceof WalletSessionInvalid) {
        setBalances({ night: null, dust: null });
        session.current = null; setConnected(null); toast.dismiss();
        setMessage("Wallet invalidated this session or changed account/network. Connect again on Preprod.");
      } else setMessage("Wallet is reconnecting. Connection retained; saved payments are unchanged.");
    }
    })().finally(() => { if (refreshing.current?.promise === promise) refreshing.current = null; });
    refreshing.current = { wallet: current, promise }; return promise;
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
      setBalances({ night: null, dust: null }); setBalancesStale(true); setMessage("");
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
    setConnected(null); setBalances({ night: null, dust: null }); setBalancesStale(true); setBusy(false); toast.dismiss();
    setMessage("Browser session cleared.");
  }
  return { connected, busy, message, setMessage, balances, balancesStale, refreshBalances, connect, cancel, disconnect };
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
