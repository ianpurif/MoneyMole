import { readFileSync, openSync, closeSync, unlinkSync } from "node:fs";
import { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { proofDataIntoSerializedPreimage } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { runRuntimeCases } from "../../tests/contracts/runtime.mjs";
import { at, saveJson, hashFile } from "../lib.mjs";
import { run as verify } from "./verify-artifacts.mjs";
import { proveIssuerTransaction } from "../../tests/contracts/issuer-transaction.mjs";

class LocalKeys extends ZKConfigProvider {
  read(circuit, folder, extension) {
    if (!["fund", "claim", "issue"].includes(circuit)) throw new Error("Unknown circuit");
    return new Uint8Array(readFileSync(at(`managed/${circuit === "issue" ? "test-asset" : "private-payments"}/${folder}/${circuit}.${extension}`)));
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
    runRuntimeCases((circuit, data) => fixtures.push({ circuit, data }));
    // Fixed loopback endpoint: this utility can never send witnesses to a remote URL.
    const provider = httpClientProvingProvider("http://127.0.0.1:6300", new LocalKeys(), { timeout: 120000 });
    for (const { circuit, data } of fixtures) {
      stage = `${circuit} constraint check`;
      const preimage = proofDataIntoSerializedPreimage(data.input, data.output, data.publicTranscript, data.privateTranscriptOutputs, circuit);
      await provider.check(preimage, circuit);
      stage = `${circuit} proof generation`;
      const proof = await provider.prove(preimage, circuit);
      if (proof.length === 0) throw new Error("Empty proof response");
      checks.push({ circuit, constraintCheck: "passed", proofGeneration: "passed", proofBytes: proof.length });
      // Never write preimages, private transcripts or proof bodies to reports.
    }
    stage = "synthetic issuer transaction proving";
    const issuerTransaction = await proveIssuerTransaction(new LocalKeys(), provider);
    saveJson(path, { scope: "local_circuit_constraint_check_and_proof_generation_synthetic_only", result: "passed", observedAt: new Date().toISOString(), checks, issuerTransaction,
      subjects: ["scripts/product/test-proving.mjs", "tests/contracts/runtime.mjs", "contracts/private-payments.compact", "contracts/issuance/test-asset.compact", "compose.yaml"].map(path => ({ path, sha256: hashFile(path) })),
      limitations: ["Not a sealed transaction or independent proof verification", "No ledger-qualified input", "No wallet balance, network submission or receiver spend"] });
    return { status: "passed", evidencePaths: [path] };
  } catch {
    saveJson(path, { scope: "synthetic_local_proving", result: "failed", observedAt: new Date().toISOString(), stage, checks });
    throw new Error("Local proving failed; sanitized stage saved");
  } finally { closeSync(fd); unlinkSync(at(".local/heavy-tool.lock")); }
}
