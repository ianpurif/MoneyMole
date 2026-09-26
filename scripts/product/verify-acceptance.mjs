import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { at, readJson, has, hashFile, saveJson } from "../lib.mjs";
import { run as verifyPreprod } from "./test-preprod.mjs";
export async function run(args = []) {
  const index = args.indexOf("--acceptance"), file = args[index + 1];
  if (index < 0 || !file || !has(file)) return { status: "blocked", reason: "Pass --acceptance <owner-reviewed public acceptance JSON>. Missing live or manual observations are never a pass. See docs/OWNER-TESTING.md." };
  const report = readJson(file); assert.equal(report.schemaVersion, 1); assert.equal(report.ownerReviewed, true); assert(Number.isFinite(Date.parse(report.observedAt)));
  const required = [...readFileSync(at("docs/TESTING.md"), "utf8").matchAll(/^\| (T\d+) \|/gm)].map(m => m[1]); assert(required.length > 0);
  for (const id of required) { const row = report.cases?.find(c => c.id === id); assert(row?.result === "passed" && ["owner_observed", "automated"].includes(row.source)); assert.equal(hashFile(row.evidencePath), row.evidenceSha256); }
  for (const path of ["src/lib/midnight/payments.ts", "src/lib/midnight/payment-codec.ts", "contracts/private-payments.compact", "package-lock.json"]) assert.equal(report.subjects?.find(s => s.path === path)?.sha256, hashFile(path));
  const observed = await verifyPreprod(["--manifest", report.manifestPath]); if (observed.status !== "passed") return observed;
  const path = "reports/acceptance.json";
  saveJson(path, { result: "passed", scope: "revalidated_chain_and_owner_reviewed_acceptance_matrix", observedAt: new Date().toISOString(), cases: required, sourceReport: file, sourceReportSha256: hashFile(file), ownerEvidenceIsIndependentAutomation: false, externalQualification: "owner_pending" });
  return { status: "passed", evidencePaths: [path] };
}
