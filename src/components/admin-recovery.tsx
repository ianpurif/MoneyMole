"use client";
import { useState } from "react";
import type { OneAmSession } from "@/lib/midnight/oneam";
export function AdminRecovery({ session, kind }: { session: OneAmSession; kind: "issuer" | "escrow" }) {
  const [password, setPassword] = useState(""), [original, setOriginal] = useState(""), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Use the same wallet that created the export. Existing records are never replaced.");
  return <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium">Restore encrypted {kind} recovery</summary>
    <label className="field">Local unlock passphrase<input type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
    <label className="field">Original export passphrase<input type="password" autoComplete="off" value={original} onChange={e => setOriginal(e.target.value)} disabled={busy} /></label>
    <label className="field">Encrypted recovery file<input type="file" accept=".json,application/json" disabled={busy || password.length < 16 || original.length < 16} onChange={e => {
      const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
      if (f.size > 3_000_000) { setMessage("Recovery file is too large."); return; }
      setBusy(true); void f.text().then(text => session.restoreAdmin(kind, password, text, original)).then(() => setMessage("Recovery imported. Unlock the existing record above and reconcile it before any action.")).catch(() => setMessage("Import failed or the namespace already has records. Existing data was preserved.")).finally(() => { setPassword(""); setOriginal(""); setBusy(false); });
    }} /></label><p role="status">{message}</p>
  </details>;
}
