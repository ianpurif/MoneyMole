"use client";
import { useId, useState } from "react";
import { validPassphrase } from "@/lib/private-state/passphrase";
import { useRecovery, useRecoveryInitialization } from "./recovery-provider";
import { Button } from "./ui/button";
import { ForgotRecovery } from "./forgot-recovery";

export function RecoveryAccess({ security = false }: { security?: boolean }) {
  const recovery = useRecovery(), id = useId();
  const initialization = useRecoveryInitialization();
  const [alternative, setAlternative] = useState(false), [password, setPassword] = useState(""), [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  if (!recovery) return <div className="recovery-access"><p role="status" className="small-note">{initialization.message}</p>{!initialization.pending && <Button onClick={initialization.retry}>Retry local recovery</Button>}</div>;
  if (recovery.authenticated && !security) return null;
  security = security && recovery.authenticated;
  const title = security ? "Security" : recovery.existing ? "Unlock MoneyMole" : "Secure MoneyMole";
  return <section className="recovery-access" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{title}</h2>
    <p className="small-note">{security ? "Your local records, protected on this device." : "One unlock for your payments and escrow."}</p>
    {(!security || !recovery.hasPasskey) && <Button className="passkey-action" disabled={recovery.busy} onClick={() => { setError(""); void recovery.continueWithPasskey(); }}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="3"/><path d="M2 20v-2a6 6 0 0 1 12 0v2m3-6V7a3 3 0 1 1 3 3h-3m0 3h3"/></svg>
      {security ? "Add a passkey" : recovery.existing ? "Login with Passkey" : "Continue with Passkey"}<span>Recommended</span>
    </Button>}
    {security && recovery.hasPasskey && <p className="small-note">Passkey enabled</p>}
    <button className="embroidered-button embroidered-light quiet-button recovery-alternative" disabled={recovery.busy} onClick={() => { setAlternative(!alternative); setPassword(""); setError(""); }}>
      {security ? recovery.hasFallback ? "Update recovery passphrase" : "Add recovery passphrase" : "Use recovery passphrase instead"}
    </button>
    {alternative && <form onSubmit={event => {
      event.preventDefault();
      if (!validPassphrase(password)) { setError("Enter at least 7 characters (up to 1,024 bytes)."); return; }
      setError("");
      const value = password; setPassword("");
      void (security ? recovery.addFallback(value) : recovery.unlockWithPassphrase(value));
    }}>
      <label className="field" htmlFor={`${id}-password`}>Local recovery passphrase</label>
      <input id={`${id}-password`} className="recovery-input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={security || !recovery.existing ? "new-password" : "current-password"} aria-describedby={`${id}-hint`} aria-invalid={!!error} disabled={recovery.busy} />
      <p id={`${id}-hint`} className="small-note">At least 7 characters. Only for MoneyMole. Never enter a wallet seed or private key.</p>
      {error && <p role="alert" className="recovery-error">{error}</p>}
      <Button disabled={recovery.busy} type="submit">{recovery.busy ? "Please wait…" : security ? "Save recovery passphrase" : recovery.existing ? "Unlock MoneyMole" : "Secure MoneyMole"}</Button>
    </form>}
    {!security && <>
      <button className="embroidered-button embroidered-light quiet-button recovery-alternative" disabled={recovery.busy} onClick={() => { setForgot(!forgot); setPassword(""); setError(""); }}>Forgot recovery passphrase?</button>
      {(forgot || recovery.recoveryNeeded) && <ForgotRecovery />}
      {recovery.previousWorkspaces.length > 0 && <details className="forgot-recovery"><summary>Switch to a preserved workspace</summary>
        <p>Each workspace needs its own passkey or original passphrase. No records are deleted when switching.</p>
        {recovery.previousWorkspaces.map(item => <button key={item.id} className="embroidered-button embroidered-light quiet-button preserved-workspace" disabled={recovery.busy} onClick={() => { void recovery.selectPreserved(item.id).catch(() => setError("Could not switch workspaces. Your records are preserved.")); }}>Workspace saved {new Date(item.createdAt).toLocaleString()}</button>)}
      </details>}
    </>}
    {security && !recovery.hasFallback && <p className="small-note">Add a recovery passphrase to restore exported backups on another device.</p>}
    {error && !alternative && <p role="alert" className="recovery-error">{error}</p>}
    {recovery.message && <p role="status" className="recovery-status">{recovery.message}</p>}
  </section>;
}
