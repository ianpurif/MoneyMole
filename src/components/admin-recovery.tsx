"use client";
import { useState } from "react";
import type { OneAmSession } from "@/lib/midnight/oneam";
import { useRecovery } from "./recovery-provider";
import { validPassphrase } from "@/lib/private-state/passphrase";
import { RecoveryWorkspaceMismatch } from "@/lib/private-state/storage-identity";
export function AdminRecovery({ kind }: { session: OneAmSession; kind: "issuer" | "escrow" }) {
  const recovery = useRecovery();
  const [original, setOriginal] = useState(""), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Use the same wallet that created the export. Existing records are never replaced.");
  return <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium">Restore encrypted {kind} recovery</summary>
    <label className="field">Original export passphrase<input type="password" autoComplete="off" value={original} onChange={e => setOriginal(e.target.value)} disabled={busy} /></label>
    <label className="field">Encrypted recovery file<input type="file" accept=".json,application/json" disabled={busy || !recovery?.authenticated || !validPassphrase(original)} onChange={e => {
      const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
      if (f.size > 3_000_000) { setMessage("Recovery file is too large."); return; }
      setBusy(true); void f.text().then(text => recovery!.restoreAdmin(kind, text, original)).then(() => setMessage("Recovery imported into your shared MoneyMole session. Check the escrow status before continuing.")).catch(error => setMessage(error instanceof RecoveryWorkspaceMismatch ? error.message : "Import failed. Check the original export passphrase and wallet. Existing records were preserved.")).finally(() => { setOriginal(""); setBusy(false); });
    }} /></label><p role="status">{message}</p>
  </details>;
}
