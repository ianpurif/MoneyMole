import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ContractState } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ContractState as RuntimeState } from "@midnight-ntwrk/compact-runtime";
import { ledger } from "../managed/test-asset/contract/index.js";
import { at, readJson, hashFile, saveJson } from "./lib.mjs";

// Read-only official indexer query; no private state, wallet access or network mutation.
try {
  const record = readJson("deployments/preprod/test-asset-issuer.json");
  assert.equal(record.network, "preprod"); assert.match(record.address, /^[a-f0-9]{64}$/);
  for (const subject of record.subjects) assert.equal(hashFile(subject.path), subject.sha256);
  const query = `fragment DeploymentData on ContractDeploy { state transaction { hash block { height hash } ... on RegularTransaction { identifiers transactionResult { status } } } } query Issuer($address: HexEncoded!) { contractAction(address:$address) { state ... on ContractDeploy { ...DeploymentData } ... on ContractCall { deploy { ...DeploymentData } } } }`;
  const response = await fetch("https://indexer.preprod.midnight.network/api/v4/graphql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables: { address: record.address } }), signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200); const body = await response.json(); assert(!body.errors);
  const latest = body.data.contractAction, deployment = latest.deploy ?? latest, tx = deployment.transaction;
  assert.equal(tx.transactionResult.status, "SUCCESS"); assert(tx.identifiers.includes(record.transactionId));
  assert.equal(tx.hash, record.transactionHash); assert.equal(tx.block.hash, record.block.hash);
  assert.equal(createHash("sha256").update(Buffer.from(deployment.state, "hex")).digest("hex"), record.publicStateSha256);
  const state = ContractState.deserialize(Buffer.from(latest.state, "hex"));
  assert.deepEqual(Buffer.from(state.operation("issue").verifierKey), readFileSync(at("managed/test-asset/keys/issue.verifier")));
  const issued = ledger(RuntimeState.deserialize(Buffer.from(latest.state, "hex")).data).issued;
  saveJson("reports/issuer-deployment.json", { scope: "real_preprod_issuer_deployment_only", result: "passed", observedAt: new Date().toISOString(), address: record.address, transactionId: record.transactionId, block: tx.block, verifierMatches: true, issued, deploymentRecordSha256: hashFile("deployments/preprod/test-asset-issuer.json"), limitations: ["Not payment escrow deployment, receiver credit or spendability", "Official indexer observation; private browser recovery checked separately"] });
  console.log("Issuer deployment verified; evidence: reports/issuer-deployment.json");
} catch {
  console.error("Issuer verification failed; preserve the existing deployment and recovery records."); process.exitCode = 1;
}
