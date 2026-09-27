"use client";
import { useState } from "react";
import { validPassphrase } from "@/lib/private-state/passphrase";
import { useRecovery } from "./recovery-provider";
import { Button } from "./ui/button";

export function ForgotRecovery() {
  const recovery = useRecovery();
  const [confirmed, setConfirmed] = useState(false), [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null), [backupPassword, setBackupPassword] = useState(""), [error, setError] = useState("");
  if (!recovery || recovery.authenticated) return null;
  return <div className="forgot-recovery">
    <h3>Recover access</h3>
    {recovery.hasPasskey ? <>
      <p>Use your existing passkey, then choose a new recovery passphrase in Tools → Security.</p>
      <Button disabled={recovery.busy} onClick={() => void recovery.continueWithPasskey()}>Unlock with existing passkey</Button>
    </> : <p>No passkey is linked to these records. A new passkey cannot decrypt them. If you enrolled one elsewhere, use that browser and the same wallet.</p>}
    <details><summary>Unlock from encrypted backup</summary>
      <p>Use a MoneyMole backup and the passphrase used when it was exported.</p>
      <form onSubmit={event => {
        event.preventDefault(); if (!file || recovery.busy) return;
        if (file.size > 3_000_000) { setError("Choose a backup smaller than 3 MB."); return; }
        const original = backupPassword; setBackupPassword(""); setError("");
        void file.text().then(text => recovery.unlockFromBackup(text, original)).catch(() => setError("Could not read this backup. Your records are unchanged."));
      }}>
        <label className="field">Encrypted backup<input type="file" accept=".json,application/json" disabled={recovery.busy} onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>
        <label className="field">Export passphrase<input type="password" autoComplete="off" value={backupPassword} onChange={event => setBackupPassword(event.target.value)} disabled={recovery.busy} /></label>
        <Button disabled={recovery.busy || !file || !validPassphrase(backupPassword)} type="submit">Unlock from backup</Button>
      </form>
    </details>
    <details><summary>Start a new local workspace</summary>
      <p>Your old encrypted records stay in this browser. This does not recover old claims, pending payments, or escrow authority. Keep any claim links and backups, and do not clear site data.</p>
      <label className="reset-confirmation"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={recovery.busy} />I understand this starts an empty workspace and leaves old records locked.</label>
      <Button disabled={recovery.busy || !confirmed} onClick={() => void recovery.startFresh("passkey", "", confirmed)}>Create new workspace with passkey</Button>
      <details><summary>Use a new recovery passphrase instead</summary>
        <form onSubmit={event => { event.preventDefault(); const value = password; setPassword(""); void recovery.startFresh("passphrase", value, confirmed); }}>
          <label className="field">New recovery passphrase<input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} disabled={recovery.busy} /></label>
          <p>At least 7 characters. Only for the new workspace.</p>
          <Button type="submit" disabled={recovery.busy || !confirmed || !validPassphrase(password)}>Create new workspace</Button>
        </form>
      </details>
    </details>
    {error && <p role="alert">{error}</p>}
  </div>;
}
