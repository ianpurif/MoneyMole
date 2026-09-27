import assert from "node:assert/strict";
import { ContractCall, Transaction, nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { MidnightBech32m, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { transaction, verifyEscrow } from "./preprod-observer.mjs";

/** Public NIGHT activity supplements consent; addresses do not establish humans. */
export async function verifyParticipantActivity(records, manifest) {
  assert.equal(manifest.schemaVersion, 2); assert.equal(manifest.asset, "NIGHT"); assert(Array.isArray(manifest.entries));
  assert(records.length > 0 && records.length <= 1000 && manifest.entries.length <= 1000);
  const contracts = new Set(), observedTransactions = new Set();
  const entries = new Map();
  for (const entry of manifest.entries) {
    assert.match(entry.evidenceSha256, /^[a-f0-9]{64}$/);
    assert(!entries.has(entry.evidenceSha256)); entries.set(entry.evidenceSha256, entry);
  }
  for (const record of records) {
    const owner = UnshieldedAddress.codec.decode("preprod", MidnightBech32m.parse(record.walletAddress)).hexString;
    const entry = entries.get(record.evidenceSha256); assert(entry);
    const circuit = record.activity === "funded" ? "fund" : "claim";
    if (!contracts.has(entry.contract)) { await verifyEscrow(entry.contract); contracts.add(entry.contract); }
    const tx = await transaction(entry.transactionId); assert.equal(tx.transactionResult.status, "SUCCESS");
    assert.match(entry.amountAtomic, /^[1-9][0-9]{0,38}$/); const amount = BigInt(entry.amountAtomic); assert(amount < (1n << 128n));
    const intents = [...Transaction.deserialize("signature", "proof", "binding", Buffer.from(tx.raw, "hex")).intents.values()];
    const calls = intents.flatMap(i => i.actions).filter(a => a instanceof ContractCall && a.address === entry.contract && (typeof a.entryPoint === "string" ? a.entryPoint : new TextDecoder().decode(a.entryPoint)) === circuit);
    assert.equal(calls.length, 1);
    const effects = [calls[0].guaranteedTranscript?.effects, calls[0].fallibleTranscript?.effects].filter(Boolean), color = nativeToken().raw;
    assert(effects.every(e => !e.shieldedMints.size && !e.unshieldedMints.size));
    const moved = effects.flatMap(e => [...(circuit === "fund" ? e.unshieldedInputs : e.unshieldedOutputs)]).filter(([t]) => t.tag === "unshielded" && t.raw === color).reduce((sum, [,v]) => sum + v, 0n);
    assert.equal(moved, amount);
    const offers = intents.flatMap(i => [i.guaranteedUnshieldedOffer, i.fallibleUnshieldedOffer]).filter(Boolean);
    const inputs = offers.flatMap(o => o.inputs), outputs = offers.flatMap(o => o.outputs);
    const credit = outputs.filter(o => o.type === color && o.owner === owner).reduce((sum, o) => sum + o.value, 0n);
    if (circuit === "claim") {
      assert.equal(credit, amount);
      assert(effects.some(e => [...e.claimedUnshieldedSpends].some(([[t, r], v]) => t.tag === "unshielded" && t.raw === color && r.tag === "user" && r.address === owner && v === amount)));
    } else {
      assert(inputs.length && inputs.every(i => i.type === color && i.owner === owner));
      assert(outputs.every(o => o.type === color && o.owner === owner));
      assert.equal(inputs.reduce((sum, i) => sum + i.value, 0n) - credit, amount);
    }
    observedTransactions.add(entry.transactionId);
  }
  return { scope: "consented_attestation_references_to_finalized_native_night_actions", chainRevalidated: true, addressEncodingValidated: true, recordsChecked: records.length, distinctTransactions: observedTransactions.size, walletActorBinding: "public_native_transaction_address_not_human_identity", uniqueHumansEstablished: false, challengeQualification: "owner_pending" };
}
