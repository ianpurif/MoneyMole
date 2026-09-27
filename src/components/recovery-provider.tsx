"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { RecoverySession } from "@/lib/private-state/recovery-session";
import { WalletReadUnavailable, WalletSessionInvalid } from "@/lib/midnight/oneam";
import { useWallet } from "./wallet-provider";
const Context = createContext<RecoverySession | null>(null);
const InitializationContext = createContext({ message: "Preparing local recovery…", pending: true, retry: () => {} });
export function RecoveryProvider({ children }: { children: ReactNode }) {
  const { connected, refreshBalances } = useWallet();
  const [value, setValue] = useState<{ wallet: typeof connected; recovery: RecoverySession } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [initialization, setInitialization] = useState({ wallet: connected, message: "Preparing local recovery…", pending: true });
  useEffect(() => {
    if (!connected) return;
    let active = true, recovery: RecoverySession | undefined, retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined, deadline: ReturnType<typeof setTimeout> | undefined;
    let cancelAttempt = () => {};
    const start = async () => {
      if (!active) return;
      setInitialization({ wallet: connected, message: retries ? "Wallet is still starting. Retrying local recovery…" : "Preparing local recovery…", pending: true });
      let current = true;
      cancelAttempt = () => { current = false; };
      try {
        await Promise.race([
          (async () => {
            const id = await connected.localIdentity();
            if (!active || !current) return;
            const candidate = new RecoverySession(connected, id);
            await candidate.initialize();
            if (!active || !current) { candidate.lock(); return; }
            recovery = candidate;
          })(),
          new Promise<never>((_, reject) => { deadline = setTimeout(() => reject(new Error("Recovery initialization timed out")), 30_000); }),
        ]);
        if (active && current && recovery) setValue({ wallet: connected, recovery });
      } catch (error) {
        if (!active) return;
        current = false;
        if (error instanceof WalletReadUnavailable && retries++ < 2) {
          retryTimer = setTimeout(() => void start(), 1000 * retries);
        } else {
          setInitialization({ wallet: connected, pending: false, message: error instanceof WalletSessionInvalid
            ? "Wallet session changed. Disconnect and connect again on Preprod."
            : "Local recovery could not start. Check that your wallet is unlocked, then retry. Your saved records are unchanged." });
        }
      } finally { clearTimeout(deadline); }
    };
    queueMicrotask(() => void start());
    return () => { active = false; cancelAttempt(); clearTimeout(deadline); clearTimeout(retryTimer); recovery?.lock(); };
  }, [connected, attempt]);
  const recovery = value?.wallet === connected ? value.recovery : null;
  useEffect(() => {
    if (!recovery) return;
    let last = Date.now();
    const expire = () => { if (Date.now() - last >= 5 * 60_000 && recovery.authenticated) recovery.lock(); };
    const activity = () => { expire(); if (document.visibilityState === "visible") last = Date.now(); };
    const timeout = setInterval(expire, 1000);
    let lastPaymentStep = "";
    const unsubscribe = recovery.subscribe(() => {
      if (recovery.busy) last = Date.now();
      const flow = recovery.paymentFlow, step = `${flow?.payment?.id ?? ""}/${flow?.stage ?? ""}`;
      if (step !== lastPaymentStep && (flow?.stage === "confirmation" || flow?.stage === "success")) void refreshBalances(flow.stage === "success");
      lastPaymentStep = step;
    });
    window.addEventListener("pointerdown", activity); window.addEventListener("keydown", activity);
    window.addEventListener("pagehide", recovery.lock);
    window.addEventListener("focus", expire); document.addEventListener("visibilitychange", expire);
    const changedElsewhere = (event: StorageEvent) => {
      if (event.key === null || event.key === `moneymole/auth/v1/${recovery.walletId}`) {
        recovery.lock(); void recovery.initialize().catch(() => { recovery.message = "Local authentication changed. Reconnect your wallet to continue."; recovery.changed(); });
      }
    };
    window.addEventListener("storage", changedElsewhere);
    return () => { clearInterval(timeout); unsubscribe(); window.removeEventListener("pointerdown", activity); window.removeEventListener("keydown", activity); window.removeEventListener("pagehide", recovery.lock); window.removeEventListener("focus", expire); document.removeEventListener("visibilitychange", expire); window.removeEventListener("storage", changedElsewhere); };
  }, [recovery, refreshBalances]);
  const status = initialization.wallet === connected ? initialization : { message: "Preparing local recovery…", pending: true };
  return <InitializationContext.Provider value={{ ...status, retry: () => setAttempt(value => value + 1) }}><Context.Provider value={recovery}>{children}</Context.Provider></InitializationContext.Provider>;
}
export function useRecoveryInitialization() { return useContext(InitializationContext); }
const subscribeEmpty = () => () => {};
const emptySnapshot = () => 0;
export function useRecovery() {
  const recovery = useContext(Context);
  useSyncExternalStore(recovery?.subscribe ?? subscribeEmpty, recovery?.snapshot ?? emptySnapshot, emptySnapshot);
  return recovery;
}
