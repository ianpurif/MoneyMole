"use client";
import { useCallback, useEffect, useState } from "react";
import { WalletPanel } from "./wallet-panel";
export function ClaimCapture() {
  const [token, setToken] = useState<string>();
  const [message, setMessage] = useState("Capturing the claim locally…");
  const clear = useCallback(() => setToken(undefined), []);
  useEffect(() => {
    const fragment = location.hash.slice(1);
    // Never route a fragment through a server, storage log or analytics service.
    history.replaceState(null, "", location.pathname);
    if (fragment.length > 0 && fragment.length <= 400) { setToken(fragment); setMessage("Claim captured in browser memory. Connect 1AM and save it encrypted before closing this tab."); }
    else setMessage("Open a complete claim link or paste it into Receive payment after connecting.");
  }, []);
  return <><p className="mt-5 text-sm text-muted">{message}</p><WalletPanel {...(token ? { claimToken: token } : {})} onClaimConsumed={clear} /></>;
}
