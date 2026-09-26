import { readFileSync } from "node:fs";
import { createPublicKey, verify } from "node:crypto";
import { isMain } from "./lib.mjs";
const FIELDS = ["kind", "network", "walletAddress", "participantRef", "consent", "observedAt", "activity", "evidenceSha256"];
export function attestationBytes(record) {
  return Buffer.from(JSON.stringify(FIELDS.map(k => [k, record[k]])), "utf8");
}
export function validateParticipants(records, publicKeyPem, now = Date.now()) {
  if (!Array.isArray(records) || records.length > 10_000) throw new Error("Expected a bounded record array");
  const key = createPublicKey(publicKeyPem);
  if (key.asymmetricKeyType !== "ed25519") throw new Error("Use an independently trusted Ed25519 attester public key");
  const wallets = new Set(), refs = new Set(); let duplicateWallets = 0, accepted = 0;
  const rejectedIndices = [];
  records.forEach((r, index) => {
    const valid = r && Object.keys(r).every(k => [...FIELDS, "signature"].includes(k)) &&
      r.kind === "owner-observed-preprod-v1" && r.network === "preprod" && r.consent === true &&
      typeof r.walletAddress === "string" && /^[^\s]{10,512}$/.test(r.walletAddress) &&
      typeof r.participantRef === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(r.participantRef) &&
      ["funded", "claimed"].includes(r.activity) && /^[a-f0-9]{64}$/.test(r.evidenceSha256 ?? "") &&
      Number.isFinite(Date.parse(r.observedAt)) && Date.parse(r.observedAt) <= now &&
      typeof r.signature === "string" && /^[A-Za-z0-9_-]{86}$/.test(r.signature);
    let signatureValid = false;
    try { signatureValid = valid && verify(null, attestationBytes(r), key, Buffer.from(r.signature, "base64url")); } catch { signatureValid = false; }
    if (!signatureValid) { rejectedIndices.push(index); return; }
    accepted++; if (wallets.has(r.walletAddress)) duplicateWallets++; wallets.add(r.walletAddress); refs.add(r.participantRef);
  });
  return { scope: "signed_owner_attestation_integrity_only", records: records.length, accepted, duplicateWallets, attestedDistinctWalletStrings: wallets.size, distinctParticipantReferences: refs.size, rejectedIndices,
    chainRevalidated: false, addressEncodingValidated: false, uniqueHumansEstablished: false, challengeQualification: "owner_pending" };
}
if (isMain(import.meta.url)) {
  const [recordsPath, publicKeyPath] = process.argv.slice(2).filter(a => !a.startsWith("--"));
  try {
    if (!recordsPath || !publicKeyPath) throw new Error("Usage: npm run evidence:participants -- <private-records.json> <trusted-attester-public.pem> [--require-qualification]");
    const records = JSON.parse(readFileSync(recordsPath, "utf8"));
    const result = validateParticipants(records, readFileSync(publicKeyPath, "utf8"));
    const chainIndex = process.argv.indexOf("--chain-manifest");
    if (chainIndex >= 0 && !result.rejectedIndices.length) {
      const manifestPath = process.argv[chainIndex + 1];
      if (!manifestPath) throw new Error("Missing chain manifest");
      const { verifyParticipantActivity } = await import("./product/verify-participant-activity.mjs");
      result.chainObservation = await verifyParticipantActivity(records, JSON.parse(readFileSync(manifestPath, "utf8")));
    }
    console.log(JSON.stringify(result, null, 2));
    if (result.rejectedIndices.length) process.exitCode = 1;
    else if (process.argv.includes("--require-qualification")) { console.error("BLOCKED: signed observations and public transactions do not independently establish wallet ownership, unique humans or organizer qualification."); process.exitCode = 2; }
  } catch (e) { console.error(e.message.startsWith("Usage:") ? e.message : "Invalid participant evidence or trust key; no private record contents printed."); process.exitCode = 1; }
}
