import assert from "node:assert/strict";
import { ContractCall, Transaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { MidnightBech32m, ShieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { transaction, verifyEscrow, eventKinds } from "./preprod-observer.mjs";

/** Public chain checks supplement signed consent. Shielded actor identity remains privately attested. */
export async function verifyParticipantActivity(records, manifest) {
  assert.equal(manifest.schemaVersion, 1); assert(Array.isArray(manifest.entries));
  assert(records.length > 0 && records.length <= 1000 && manifest.entries.length <= 1000);
  const contracts = new Set(), observedTransactions = new Set();
  const entries = new Map();
  for (const entry of manifest.entries) {
    assert.match(entry.evidenceSha256, /^[a-f0-9]{64}$/);
    assert(!entries.has(entry.evidenceSha256)); entries.set(entry.evidenceSha256, entry);
  }
  for (const record of records) {
    ShieldedAddress.codec.decode("preprod", MidnightBech32m.parse(record.walletAddress));
    const entry = entries.get(record.evidenceSha256); assert(entry);
    const circuit = record.activity === "funded" ? "fund" : "claim";
    if (!contracts.has(entry.contract)) { await verifyEscrow(entry.contract); contracts.add(entry.contract); }
    const tx = await transaction(entry.transactionId); assert.equal(tx.transactionResult.status, "SUCCESS");
    const actions = [...Transaction.deserialize("signature", "proof", "binding", Buffer.from(tx.raw, "hex")).intents.values()].flatMap(i => i.actions);
    assert(actions.some(a => a instanceof ContractCall && a.address === entry.contract && (typeof a.entryPoint === "string" ? a.entryPoint : new TextDecoder().decode(a.entryPoint)) === circuit));
    const kinds = eventKinds(tx); assert(kinds.includes("zswapOutput")); if (circuit === "claim") assert(kinds.includes("zswapInput"));
    observedTransactions.add(entry.transactionId);
  }
  return { scope: "consented_attestation_references_to_finalized_payment_actions", chainRevalidated: true, addressEncodingValidated: true, recordsChecked: records.length, distinctTransactions: observedTransactions.size, walletActorBinding: "trusted_private_attestation_only", uniqueHumansEstablished: false, challengeQualification: "owner_pending" };
}
