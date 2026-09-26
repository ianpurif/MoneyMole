import assert from "node:assert/strict";
import { readJson, hashFile, saveJson, has } from "../lib.mjs";
export async function run() {
  const reports = ["reports/contract-compile.json", "reports/issuance-compile.json"];
  const subjects = [];
  for (const path of reports) {
    const report = readJson(path);
    assert.equal(report.result, "passed"); assert.equal(report.compiler, "0.31.1");
    assert.equal(hashFile(report.source), report.sourceHash);
    assert.ok(report.files.length > 3);
    for (const file of report.files) {
      assert.ok(has(file.path)); assert.equal(hashFile(file.path), file.sha256);
    }
    for (const circuit of path.includes("issuance") ? ["issue"] : ["fund", "claim"]) {
      assert.ok(report.files.some(f => f.path.endsWith(`/keys/${circuit}.prover`)));
      assert.ok(report.files.some(f => f.path.endsWith(`/keys/${circuit}.verifier`)));
      assert.ok(report.files.some(f => f.path.endsWith(`/zkir/${circuit}.bzkir`)));
    }
    subjects.push({ path, sha256: hashFile(path) });
  }
  assert.equal(readJson("node_modules/@midnight-ntwrk/compact-runtime/package.json").version, "0.16.0");
  const generated = await import("../../managed/private-payments/contract/index.js");
  const unavailable = () => { throw new Error("Artifact inspection cannot execute witnesses"); };
  const contract = new generated.Contract({ fundingCoin: unavailable, escrowCoin: unavailable, claimAuthority: unavailable, membership: unavailable });
  assert.deepEqual(Object.keys(contract.provableCircuits).sort(), ["claim", "fund"]);
  const path = "reports/artifacts.json";
  saveJson(path, { scope: "compiler_output_integrity_and_runtime_compatibility_not_deployment", result: "passed", observedAt: new Date().toISOString(), subjects });
  return { status: "passed", evidencePaths: [path] };
}
