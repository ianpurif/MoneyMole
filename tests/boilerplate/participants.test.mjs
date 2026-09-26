import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { validateParticipants, attestationBytes } from "../../scripts/participants.mjs";
// Synthetic in-memory fixtures only. These are not records of actual participants.
const keys = generateKeyPairSync("ed25519");
const pem = keys.publicKey.export({ type: "spki", format: "pem" });
const record = (overrides = {}) => {
  const r = { kind: "owner-observed-preprod-v1", network: "preprod", walletAddress: "synthetic-wallet-only", participantRef: "synthetic_ref", consent: true, observedAt: "2026-01-01T00:00:00.000Z", activity: "claimed", evidenceSha256: "a".repeat(64), ...overrides };
  r.signature = sign(null, attestationBytes(r), keys.privateKey).toString("base64url"); return r;
};
const now = Date.parse("2026-09-26T00:00:00Z");
test("valid signature proves only attestation integrity", () => { const result = validateParticipants([record()], pem, now); assert.equal(result.accepted, 1); assert.equal(result.uniqueHumansEstablished, false); assert.equal(result.chainRevalidated, false); });
test("exact duplicate wallet strings counted once", () => { const result = validateParticipants([record(), record()], pem, now); assert.equal(result.attestedDistinctWalletStrings, 1); assert.equal(result.duplicateWallets, 1); });
test("wrong network is rejected even with valid signature", () => assert.equal(validateParticipants([record({ network: "preview" })], pem, now).accepted, 0));
test("missing consent is rejected even with valid signature", () => assert.equal(validateParticipants([record({ consent: false })], pem, now).accepted, 0));
test("tampering invalidates signature", () => { const r = record(); r.activity = "funded"; assert.equal(validateParticipants([r], pem, now).accepted, 0); });
test("wrong attester key is rejected", () => { const other = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }); assert.equal(validateParticipants([record()], other, now).accepted, 0); });
test("future observation rejected", () => assert.equal(validateParticipants([record({ observedAt: "2030-01-01T00:00:00Z" })], pem, now).accepted, 0));
test("extra private fields rejected", () => assert.equal(validateParticipants([record({ message: "must-not-be-accepted" })], pem, now).accepted, 0));
test("aggregate report contains no raw wallet strings", () => assert.equal(JSON.stringify(validateParticipants([record()], pem, now)).includes("synthetic-wallet-only"), false));
