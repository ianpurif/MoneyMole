import { run as execute, saveJson, hashFile, readJson } from "../lib.mjs";
export async function run() {
  const result = execute("npm", ["exec", "--", "vitest", "run", "--project", "integration", "--reporter=json", "--outputFile=reports/integration-run.json"], { timeout: 180000 });
  const summary = result.ok ? readJson("reports/integration-run.json") : null;
  const passed = result.ok && summary?.success === true && summary.numPassedTests > 0 && summary.numPendingTests === 0 && summary.numFailedTests === 0;
  const path = "reports/integration.json";
  saveJson(path, { scope: "production_payment_controller_and_encrypted_records_fake_indexeddb_synthetic_protocol_boundaries", observedAt: new Date().toISOString(), result: passed ? "passed" : "failed", exit: result.status, tests: summary?.numPassedTests ?? 0,
    subjects: ["scripts/product/test-integration.mjs", "vitest.config.ts", "package-lock.json", "src/lib/midnight/payments.ts", "src/lib/midnight/payment-session.ts", "src/lib/private-state/transaction-journal.ts", "src/lib/private-state/indexed-db.ts", "src/lib/private-state/crypto.ts", "src/domain/transaction.ts", "tests/integration/payment-records.test.ts", "tests/integration/recovery.test.ts", "src/lib/midnight/feasibility/qualify-escrow.ts", "tests/integration/qualification.test.ts"].map(path => ({ path, sha256: hashFile(path) })),
    limitations: ["No wallet authorization or live submission", "No chain reconciliation or funded payment", "Restored local states are unverified"] });
  if (!passed) throw new Error("Recovery integration failed; run the synthetic test suite locally");
  return { status: "passed", evidencePaths: [path] };
}
