"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { RecoverySession } from "@/lib/private-state/recovery-session";
import { useWallet } from "./wallet-provider";
const Context = createContext<RecoverySession | null>(null);
export function RecoveryProvider({ children }: { children: ReactNode }) {
  const { connected } = useWallet();
  const [value, setValue] = useState<{ wallet: typeof connected; recovery: RecoverySession } | null>(null);
  useEffect(() => {
    if (!connected) return;
    let active = true, recovery: RecoverySession | undefined;
    void connected.localIdentity().then(async id => {
      if (!active) return;
      recovery = new RecoverySession(connected, id); await recovery.initialize();
      if (active) setValue({ wallet: connected, recovery }); else recovery.lock();
    }).catch(() => { /* Wallet status handles connection failures; allow an explicit reconnect. */ });
    return () => { active = false; recovery?.lock(); };
  }, [connected]);
  const recovery = value?.wallet === connected ? value.recovery : null;
  useEffect(() => {
    if (!recovery) return;
    let last = Date.now();
    const expire = () => { if (Date.now() - last >= 5 * 60_000 && recovery.authenticated) recovery.lock(); };
    const activity = () => { expire(); if (document.visibilityState === "visible") last = Date.now(); };
    const timeout = setInterval(expire, 1000);
    const unsubscribe = recovery.subscribe(() => { if (recovery.busy) last = Date.now(); });
    window.addEventListener("pointerdown", activity); window.addEventListener("keydown", activity);
    window.addEventListener("pagehide", recovery.lock);
    window.addEventListener("focus", expire); document.addEventListener("visibilitychange", expire);
    return () => { clearInterval(timeout); unsubscribe(); window.removeEventListener("pointerdown", activity); window.removeEventListener("keydown", activity); window.removeEventListener("pagehide", recovery.lock); window.removeEventListener("focus", expire); document.removeEventListener("visibilitychange", expire); };
  }, [recovery]);
  return <Context.Provider value={recovery}>{children}</Context.Provider>;
}
const subscribeEmpty = () => () => {};
const emptySnapshot = () => 0;
export function useRecovery() {
  const recovery = useContext(Context);
  useSyncExternalStore(recovery?.subscribe ?? subscribeEmpty, recovery?.snapshot ?? emptySnapshot, emptySnapshot);
  return recovery;
}
