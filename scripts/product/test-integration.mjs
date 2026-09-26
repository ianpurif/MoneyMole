import { run as execute, saveJson, hashFile } from "../lib.mjs";
export async function run() {
  const result = execute("npm", ["exec", "vitest", "run", "--project", "integration"], { timeout: 120000 });
  const path = "reports/integration.json";
  saveJson(path, { scope: "local_journal_crypto_storage_integration_fake_indexeddb_synthetic_submission", observedAt: new Date().toISOString(), result: result.ok ? "passed" : "failed", exit: result.status,
    subjects: ["src/lib/private-state/transaction-journal.ts", "src/lib/private-state/indexed-db.ts", "src/domain/transaction.ts", "tests/integration/recovery.test.ts"].map(path => ({ path, sha256: hashFile(path) })),
    limitations: ["No wallet authorization or live submission", "No chain reconciliation or funded payment", "Restored local states are unverified"] });
  if (!result.ok) throw new Error("Recovery integration failed; run the synthetic test suite locally");
  return { status: "passed", evidencePaths: [path] };
}
