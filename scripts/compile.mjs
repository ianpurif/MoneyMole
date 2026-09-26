import { openSync, closeSync, unlinkSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, at, has, run, hashFile, saveJson, blocked } from "./lib.mjs";
const probe = process.argv.includes("--probe");
const source = probe ? "contracts/probes/claim-commitment.compact" : "contracts/private-payments.compact";
const output = probe ? "managed/probe" : "managed/private-payments";
if (!has(source)) blocked(`Missing ${source}. Execute the M1 task; a commitment probe is not a payment contract.`);
else {
  const version = run("compact", ["compile", "--version"], { timeout: 8_000 });
  if (!version.ok || !/\b0\.31\.1\b/.test(version.stdout + version.stderr)) blocked("Compact compiler 0.31.1 is required and has not been validated.");
  else {
    mkdirSync(at(".local"), { recursive: true });
    let fd;
    try {
      fd = openSync(at(".local/heavy-tool.lock"), "wx");
      mkdirSync(at(output), { recursive: true });
      const result = run("compact", ["compile", source, output], { timeout: 600_000 });
      if (!result.ok) { console.error(result.stdout, result.stderr); process.exitCode = 1; }
      else {
        const files = [];
        const visit = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) visit(p); else files.push(relative(ROOT, p).replaceAll("\\", "/")); } };
        visit(at(output));
        if (!files.some(p => p.includes("/keys/")) || !files.some(p => p.includes("/contract/"))) blocked("Compiler returned without the expected contract and key material. Inspect the installed compiler's output layout.");
        else {
          saveJson(`reports/${probe ? "probe" : "contract"}-compile.json`, { scope: probe ? "compile_only_nonpayment_probe" : "contract_compilation", result: "passed", observedAt: new Date().toISOString(), compiler: "0.31.1", source, sourceHash: hashFile(source), files: files.map(path => ({ path, sha256: hashFile(path) })) });
          console.log(`Compiled ${source}; this is not settlement verification.`);
        }
      }
    } catch (error) { blocked(error.code === "EEXIST" ? "Another heavy task holds .local/heavy-tool.lock. Inspect its owner; do not delete another worker's lock." : "Compilation preparation failed."); }
    finally { if (fd !== undefined) { closeSync(fd); unlinkSync(at(".local/heavy-tool.lock")); } }
  }
}
