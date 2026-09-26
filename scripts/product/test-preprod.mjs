import assert from "node:assert/strict";
import { ContractCall, Transaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { readJson, has, hashFile, saveJson } from "../lib.mjs";
import { transaction, eventKinds } from "./preprod-observer.mjs";
import { run as verifyDeployment } from "./verify-deployment.mjs";
export async function run(args = []) {
  const path = args[args.indexOf("--manifest") + 1];
  if (!args.includes("--manifest") || !path || !has(path)) return { status: "blocked", reason: "Pass --manifest <repository-relative public E2E manifest>. See docs/OWNER-TESTING.md. No wallet actions are automated by this command." };
  const m = readJson(path); assert.equal(m.schemaVersion, 1); assert.equal(m.network, "preprod");
  const deploy = await verifyDeployment(["--record", m.deploymentRecord]); if (deploy.status !== "passed") return deploy;
  const record = readJson(m.deploymentRecord), results = [];
  assert(new Set([m.fundingId, m.claimId, m.spendId]).size === 3);
  for (const [name, id, entry] of [["funding", m.fundingId, "fund"], ["claim", m.claimId, "claim"], ["controlled_spend", m.spendId, null]]) {
    const tx = await transaction(id); assert.equal(tx.transactionResult.status, "SUCCESS");
    const actions = [...Transaction.deserialize("signature", "proof", "binding", Buffer.from(tx.raw, "hex")).intents.values()].flatMap(i => i.actions);
    if (entry) assert(actions.some(a => a instanceof ContractCall && a.address === record.address && (typeof a.entryPoint === "string" ? a.entryPoint : new TextDecoder().decode(a.entryPoint)) === entry));
    else assert.equal(actions.length, 0);
    const kinds = eventKinds(tx); assert(kinds.includes("zswapOutput")); if (name !== "funding") assert(kinds.includes("zswapInput"));
    results.push({ case: name, transactionId: id, transactionHash: tx.hash, block: tx.block, result: "passed" });
  }
  assert(results[0].block.height <= results[1].block.height && results[1].block.height <= results[2].block.height);
  const evidence = "reports/preprod.json";
  saveJson(evidence, { result: "passed", scope: "real_chain_actions_and_finality_only", observedAt: new Date().toISOString(), results, manifestPath: path, manifestSha256: hashFile(path), limitations: ["Chain activity alone does not establish independent wallets, private amount conservation, human identity or browser recovery", "Owner must separately exercise and document the complete acceptance matrix"], subjects: ["src/lib/midnight/payments.ts", "contracts/private-payments.compact"].map(path => ({ path, sha256: hashFile(path) })) });
  return { status: "passed", evidencePaths: [evidence] };
}
