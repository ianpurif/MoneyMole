import { runRuntimeCases } from "../../tests/contracts/runtime.mjs";
import { saveJson, hashFile } from "../lib.mjs";
import { run as verify } from "./verify-artifacts.mjs";
export async function run() {
  await verify();
  const cases = runRuntimeCases();
  if (cases.length < 13) throw new Error("Incomplete suite");
  const path = "reports/contracts.json";
  saveJson(path, { scope: "generated_runtime_synthetic_no_proof_no_ledger_settlement", observedAt: new Date().toISOString(), result: "passed", cases,
    subjects: ["tests/contracts/runtime.mjs", "contracts/private-payments.compact", "contracts/issuance/test-asset.compact"].map(path => ({ path, sha256: hashFile(path) })),
    limitations: ["No ledger-validity or coin qualification check", "No cryptographic proof", "No live wallet or concurrent transaction acceptance", "No network replay or copied-proof destination validation"] });
  return { status: "passed", evidencePaths: [path] };
}
