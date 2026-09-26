import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ContractState } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ContractState as RuntimeState } from "@midnight-ntwrk/compact-runtime";
import { ledger } from "../managed/test-asset/contract/index.js";
import { at, readJson, hashFile, saveJson, run } from "./lib.mjs";
import { verifyAdditiveDependencies } from "./deployment-dependencies.mjs";
import { finality } from "./product/preprod-observer.mjs";

// Read-only official indexer query; no private state, wallet access or network mutation.
let stage = "deployment source and artifact identity";
try {
  const record = readJson("deployments/preprod/test-asset-issuer.json");
  assert.equal(record.network, "preprod"); assert.match(record.address, /^[a-f0-9]{64}$/);
  for (const subject of record.subjects.filter(s => s.path !== "package-lock.json")) assert.equal(hashFile(subject.path), subject.sha256);
  stage = "deployment dependency compatibility";
  const recordedLock = record.subjects.find(s => s.path === "package-lock.json"); assert(recordedLock);
  const currentLockHash = hashFile("package-lock.json");
  const dependencies = { mode: "exact_deployment_lock", recordedLockHash: recordedLock.sha256, currentLockHash };
  if (currentLockHash !== recordedLock.sha256) {
    // Immutable original graph from this deployment's history. Its SHA must match
    // the preserved record before comparison; never replace that record's digest.
    const baselineCommit = "d4e89bd1589070549e50bb3ee14746708cfa4ead";
    const baseline = run("git", ["show", `${baselineCommit}:package-lock.json`]); assert(baseline.ok);
    assert.equal(createHash("sha256").update(baseline.stdout).digest("hex"), recordedLock.sha256);
    dependencies.checkedPackages = verifyAdditiveDependencies(JSON.parse(baseline.stdout), readJson("package-lock.json"));
    dependencies.mode = "original_packages_preserved_with_additions";
    dependencies.baselineCommit = baselineCommit;
  }
  stage = "official indexer deployment and current state";
  const query = `fragment DeploymentData on ContractDeploy { state transaction { hash block { height hash } ... on RegularTransaction { identifiers transactionResult { status } } } } query Issuer($address: HexEncoded!) { contractAction(address:$address) { state transaction { block { height hash } } ... on ContractDeploy { ...DeploymentData } ... on ContractCall { deploy { ...DeploymentData } } } }`;
  const response = await fetch("https://indexer.preprod.midnight.network/api/v4/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables: { address: record.address } }), signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200); const body = await response.json(); assert(!body.errors);
  const latest = body.data.contractAction, deployment = latest.deploy ?? latest, tx = deployment.transaction;
  assert.equal(tx.transactionResult.status, "SUCCESS"); assert(tx.identifiers.includes(record.transactionId));
  assert.equal(tx.hash, record.transactionHash); assert.equal(tx.block.hash, record.block.hash);
  assert.equal(createHash("sha256").update(Buffer.from(deployment.state, "hex")).digest("hex"), record.publicStateSha256);
  stage = "canonical node finality";
  await finality(tx.block); await finality(latest.transaction.block);
  stage = "current issuer verifier and issuance state";
  const state = ContractState.deserialize(Buffer.from(latest.state, "hex"));
  assert.deepEqual(Buffer.from(state.operation("issue").verifierKey), readFileSync(at("managed/test-asset/keys/issue.verifier")));
  const issued = ledger(RuntimeState.deserialize(Buffer.from(latest.state, "hex")).data).issued;
  saveJson("reports/issuer-deployment.json", { scope: "real_preprod_issuer_identity_and_node_finality", result: "passed", observedAt: new Date().toISOString(), address: record.address, transactionId: record.transactionId, block: tx.block, verifierMatches: true, nodeFinality: true, issued, dependencies, deploymentRecordSha256: hashFile("deployments/preprod/test-asset-issuer.json"), limitations: ["Not payment escrow deployment, receiver credit or spendability", "Private browser recovery checked separately"] });
  console.log("Issuer deployment verified; evidence: reports/issuer-deployment.json");
} catch {
  saveJson("reports/issuer-deployment.json", { scope: "real_preprod_issuer_identity_and_node_finality", result: "failed", stage, observedAt: new Date().toISOString() });
  console.error(`Issuer verification failed at ${stage}; preserve deployment and recovery records.`); process.exitCode = 1;
}
