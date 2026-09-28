import assert from "node:assert/strict";
import { ContractDeploy, Transaction, nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ContractState as RuntimeState } from "@midnight-ntwrk/compact-runtime";
import { ledger } from "../../managed/night-payments/contract/index.js";
import preprod from "../../config/preprod.json" with { type: "json" };
import { readJson, hashFile, saveJson, has } from "../lib.mjs";
import { transaction, verifyEscrow } from "./preprod-observer.mjs";
export async function run(args = []) {
  const recordPath = args.includes("--record") ? args[args.indexOf("--record") + 1] : "deployments/preprod/night-payment-escrow.json";
  if (!recordPath || !has(recordPath)) return { status: "blocked", reason: "Save the browser public escrow deployment record, then pass --record <repository-relative JSON path>." };
  const r = readJson(recordPath); assert.equal(r.schemaVersion, 2); assert.equal(r.asset, "NIGHT"); assert.equal(r.network, "preprod");
  assert.equal(r.address, preprod.paymentEscrowAddress);
  assert.equal(r.finality?.observed, true); assert(Number.isFinite(Date.parse(r.observedAt))); assert.match(r.address, /^[a-f0-9]{64}$/);
  for (const [field, path] of [["sourceHash", "contracts/night-payments.compact"], ["buildHash", "managed/night-payments/contract/index.js"], ["toolchainHash", "toolchain.lock.json"]]) assert.equal(r[field], hashFile(path));
  const tx = await transaction(r.transactionId); assert.equal(tx.transactionResult.status, "SUCCESS"); assert.equal(tx.block.hash, r.finality.block);
  const native = Transaction.deserialize("signature", "proof", "binding", Buffer.from(tx.raw, "hex"));
  assert([...native.intents.values()].flatMap(i => i.actions).some(a => a instanceof ContractDeploy && a.address === r.address));
  const state = await verifyEscrow(r.address);
  const expected = nativeToken().raw;
  assert.equal(Buffer.from(ledger(RuntimeState.deserialize(state.serialize()).data).supportedAsset).toString("hex"), expected);
  const path = "reports/deployment.json";
  saveJson(path, { scope: "real_preprod_payment_escrow_identity_and_node_finality", result: "passed", observedAt: new Date().toISOString(), address: r.address, transactionId: r.transactionId, block: tx.block, recordPath, recordSha256: hashFile(recordPath), sourceHash: r.sourceHash, buildHash: r.buildHash, toolchainHash: r.toolchainHash });
  return { status: "passed", evidencePaths: [path] };
}
