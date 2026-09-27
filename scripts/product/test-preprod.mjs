import assert from "node:assert/strict";
import { ContractCall, Transaction, nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { readJson, has, hashFile, saveJson } from "../lib.mjs";
import { transaction } from "./preprod-observer.mjs";
import { run as verifyDeployment } from "./verify-deployment.mjs";

export async function run(args = []) {
  const path = args[args.indexOf("--manifest") + 1];
  if (!args.includes("--manifest") || !path || !has(path)) return { status: "blocked", reason: "Pass --manifest <repository-relative NIGHT E2E manifest>. No wallet actions are automated." };
  const m = readJson(path); assert.equal(m.schemaVersion, 2); assert.equal(m.network, "preprod"); assert.equal(m.asset, "NIGHT");
  assert.match(m.amountAtomic, /^[1-9][0-9]{0,38}$/); const amount = BigInt(m.amountAtomic); assert(amount < (1n << 128n));
  for (const address of [m.senderAddressHex, m.receiverAddressHex, m.spendRecipientAddressHex]) assert.match(address, /^[a-f0-9]{64}$/);
  assert.notEqual(m.senderAddressHex, m.receiverAddressHex); assert.notEqual(m.receiverAddressHex, m.spendRecipientAddressHex);
  const deploy = await verifyDeployment(["--record", m.deploymentRecord]); if (deploy.status !== "passed") return deploy;
  const record = readJson(m.deploymentRecord), results = [], color = nativeToken().raw;
  const isNight = t => t.tag === "unshielded" && t.raw === color;
  const sum = values => values.reduce((total, value) => total + value, 0n);
  assert(new Set([m.fundingId, m.claimId, m.spendId]).size === 3);
  for (const [name, id, entry] of [["funding", m.fundingId, "fund"], ["claim", m.claimId, "claim"], ["controlled_spend", m.spendId, null]]) {
    const tx = await transaction(id); assert.equal(tx.transactionResult.status, "SUCCESS");
    const intents = [...Transaction.deserialize("signature", "proof", "binding", Buffer.from(tx.raw, "hex")).intents.values()];
    const actions = intents.flatMap(i => i.actions), offers = intents.flatMap(i => [i.guaranteedUnshieldedOffer, i.fallibleUnshieldedOffer]).filter(Boolean);
    const inputs = offers.flatMap(o => o.inputs), outputs = offers.flatMap(o => o.outputs);
    const credit = owner => sum(outputs.filter(o => o.type === color && o.owner === owner).map(o => o.value));
    if (entry) {
      const calls = actions.filter(a => a instanceof ContractCall && a.address === record.address && (typeof a.entryPoint === "string" ? a.entryPoint : new TextDecoder().decode(a.entryPoint)) === entry);
      assert.equal(calls.length, 1);
      const effects = [calls[0].guaranteedTranscript?.effects, calls[0].fallibleTranscript?.effects].filter(Boolean);
      assert(effects.every(e => e.unshieldedMints.size === 0 && e.shieldedMints.size === 0));
      const received = sum(effects.flatMap(e => [...e.unshieldedInputs]).filter(([t]) => isNight(t)).map(([,v]) => v));
      const sent = sum(effects.flatMap(e => [...e.unshieldedOutputs]).filter(([t]) => isNight(t)).map(([,v]) => v));
      assert.equal(received, entry === "fund" ? amount : 0n); assert.equal(sent, entry === "claim" ? amount : 0n);
      if (entry === "claim") {
        const spends = effects.flatMap(e => [...e.claimedUnshieldedSpends]); assert.equal(spends.length, 1);
        assert(isNight(spends[0][0][0])); assert.deepEqual(spends[0][0][1], { tag: "user", address: m.receiverAddressHex }); assert.equal(spends[0][1], amount);
        assert.equal(credit(m.receiverAddressHex), amount);
      } else {
        assert(inputs.length > 0 && inputs.every(i => i.type === color && i.owner === m.senderAddressHex));
        assert(outputs.every(o => o.type === color && o.owner === m.senderAddressHex));
        assert.equal(sum(inputs.map(i => i.value)) - credit(m.senderAddressHex), amount);
      }
    } else {
      assert.equal(actions.length, 0);
      assert(inputs.length > 0 && inputs.every(i => i.type === color && i.owner === m.receiverAddressHex));
      assert(outputs.every(o => o.type === color && [m.receiverAddressHex, m.spendRecipientAddressHex].includes(o.owner)));
      assert.equal(credit(m.spendRecipientAddressHex), amount);
      assert.equal(sum(inputs.map(i => i.value)) - credit(m.receiverAddressHex), amount);
    }
    results.push({ case: name, transactionId: id, transactionHash: tx.hash, block: tx.block, result: "passed" });
  }
  assert(results[0].block.height <= results[1].block.height && results[1].block.height <= results[2].block.height);
  const evidence = "reports/preprod.json";
  saveJson(evidence, { result: "passed", scope: "native_night_exact_amount_destination_and_canonical_finality", observedAt: new Date().toISOString(), results, manifestPath: path, manifestSha256: hashFile(path), limitations: ["Does not establish independent human wallet control, browser recovery or wallet synchronization", "NIGHT amounts and addresses are public; no shielded-payment privacy claim"], subjects: ["src/lib/midnight/payments.ts", "src/lib/midnight/night-settlement.ts", "contracts/night-payments.compact"].map(path => ({ path, sha256: hashFile(path) })) });
  return { status: "passed", evidencePaths: [evidence] };
}
