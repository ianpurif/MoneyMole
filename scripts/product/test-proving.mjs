import preprod from "../../config/preprod.json" with { type: "json" };
import { readFileSync, openSync, closeSync, unlinkSync } from "node:fs";
import { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { proofDataIntoSerializedPreimage } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { runNightRuntimeCases } from "../../tests/contracts/night-runtime.mjs";
import { runRuntimeCases } from "../../tests/contracts/runtime.mjs";
import { at, saveJson, hashFile } from "../lib.mjs";
import { run as verify } from "./verify-artifacts.mjs";
import { proveIssuerTransaction } from "../../tests/contracts/issuer-transaction.mjs";
import { proveNightTransactions } from "../../tests/contracts/night-transaction.mjs";

class LocalKeys extends ZKConfigProvider {
  constructor(payment = "private-payments") { super(); this.payment = payment; }
  read(circuit, folder, extension) {
    if (!["fund", "claim", "issue"].includes(circuit)) throw new Error("Unknown circuit");
    return new Uint8Array(readFileSync(at(`managed/${circuit === "issue" ? "test-asset" : this.payment}/${folder}/${circuit}.${extension}`)));
  }
  async getZKIR(circuit) { return this.read(circuit, "zkir", "bzkir"); }
  async getProverKey(circuit) { return this.read(circuit, "keys", "prover"); }
  async getVerifierKey(circuit) { return this.read(circuit, "keys", "verifier"); }
}

export async function run() {
  await verify();
  const fd = openSync(at(".local/heavy-tool.lock"), "wx");
  const path = "reports/proving.json", checks = [];
  let stage = "synthetic fixture generation";
  try {
    const fixtures = [];
    runRuntimeCases((circuit, data) => fixtures.push({ circuit, data, payment: "private-payments" }));
    runNightRuntimeCases((circuit, data) => fixtures.push({ circuit, data, payment: "night-payments" }));
    // Fixed loopback endpoint: this utility can never send witnesses to a remote URL.
    const provider = httpClientProvingProvider(preprod.proofServer, new LocalKeys(), { timeout: 120000 });
    for (const { circuit, data, payment } of fixtures) {
      const circuitProvider = httpClientProvingProvider(preprod.proofServer, new LocalKeys(payment), { timeout: 120000 });
      stage = `${circuit} constraint check`;
      const preimage = proofDataIntoSerializedPreimage(data.input, data.output, data.publicTranscript, data.privateTranscriptOutputs, circuit);
      await circuitProvider.check(preimage, circuit);
      stage = `${circuit} proof generation`;
      const proof = await circuitProvider.prove(preimage, circuit);
      if (proof.length === 0) throw new Error("Empty proof response");
      checks.push({ contract: payment, circuit, constraintCheck: "passed", proofGeneration: "passed", proofBytes: proof.length });
      // Never write preimages, private transcripts or proof bodies to reports.
    }
    stage = "synthetic issuer transaction proving";
    const issuerTransaction = await proveIssuerTransaction(new LocalKeys(), provider);
    stage = "synthetic native NIGHT transaction construction and proving";
    const nightTransaction = await proveNightTransactions(new LocalKeys("night-payments"), httpClientProvingProvider(preprod.proofServer, new LocalKeys("night-payments"), { timeout: 180000 }));
    saveJson(path, { scope: "local_circuit_constraint_check_and_proof_generation_synthetic_only", result: "passed", observedAt: new Date().toISOString(), checks, issuerTransaction, nightTransaction,
      subjects: ["tests/contracts/night-runtime.mjs", "contracts/night-payments.compact", "scripts/product/test-proving.mjs", "tests/contracts/runtime.mjs", "contracts/private-payments.compact", "contracts/issuance/test-asset.compact", "compose.yaml"].map(path => ({ path, sha256: hashFile(path) })),
      limitations: ["Not a sealed transaction or independent proof verification", "No ledger-qualified input", "No wallet balance, network submission or receiver spend"] });
    return { status: "passed", evidencePaths: [path] };
  } catch {
    saveJson(path, { scope: "synthetic_local_proving", result: "failed", observedAt: new Date().toISOString(), stage, checks });
    throw new Error("Local proving failed; sanitized stage saved");
  } finally { closeSync(fd); unlinkSync(at(".local/heavy-tool.lock")); }
}
