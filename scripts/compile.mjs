import { openSync, closeSync, unlinkSync, mkdirSync, readdirSync, statSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, at, has, run, hashFile, saveJson, blocked } from "./lib.mjs";
const probe = process.argv.includes("--probe");
const coinProbe = process.argv.includes("--coin-probe");
const issuance = process.argv.includes("--issuance");
const legacy = process.argv.includes("--legacy");
const source = issuance ? "contracts/issuance/test-asset.compact" : coinProbe ? "contracts/probes/shielded-io.compact" : probe ? "contracts/probes/claim-commitment.compact" : legacy ? "contracts/private-payments.compact" : "contracts/night-payments.compact";
const output = issuance ? "managed/test-asset" : coinProbe ? "managed/coin-probe" : probe ? "managed/probe" : legacy ? "managed/private-payments" : "managed/night-payments";
const report = `reports/${issuance ? "issuance" : coinProbe ? "coin-probe" : probe ? "probe" : legacy ? "legacy" : "contract"}-compile.json`;
// Compact chmods its output directories, which fails on WSL-mounted Windows drives.
const stageOnLinux = process.platform === "linux" && /^\/mnt\/[a-z]\//i.test(ROOT);
function copyGenerated(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const src = join(from, entry.name), dst = join(to, entry.name);
    if (entry.isDirectory()) copyGenerated(src, dst);
    else if (entry.isFile()) {
      let compiled = readFileSync(src);
      if (entry.name === "index.js.map" && to.endsWith("/contract")) {
        const sourceRoot = `${relative(to, ROOT).replaceAll("\\", "/")}/`;
        compiled = Buffer.from(compiled.toString("utf8").replace('"sourceRoot": ""', `"sourceRoot": "${sourceRoot}"`));
      }
      // Earlier WSL runs left some generated files root-owned; unchanged bytes need no write.
      if (!existsSync(dst) || !compiled.equals(readFileSync(dst))) {
        try { writeFileSync(dst, compiled); }
        catch (error) { throw new Error(`Cannot update generated ${dst}: ${error.code ?? error.message}`); }
      }
    }
    else throw new Error("Unexpected compiler output type");
  }
}
if (!has(source)) blocked(`Missing ${source}. Execute the M1 task; a commitment probe is not a payment contract.`);
else {
  const version = run("compact", ["compile", "--version"], { timeout: 8_000 });
  if (!version.ok || !/\b0\.31\.1\b/.test(version.stdout + version.stderr)) blocked("Compact compiler 0.31.1 is required and has not been validated.");
  else {
    mkdirSync(at(".local"), { recursive: true });
    let fd;
    let stage;
    try {
      fd = openSync(at(".local/heavy-tool.lock"), "wx");
      if (has(report)) unlinkSync(at(report));
      mkdirSync(at(output), { recursive: true });
      if (stageOnLinux) stage = mkdtempSync(join("/tmp", "moneymole-compact-"));
      const result = run("compact", ["compile", source, stage ? join(stage, "output") : output], { timeout: 600_000 });
      if (!result.ok) { console.error(result.stdout, result.stderr); process.exitCode = 1; }
      else {
        if (stage) copyGenerated(join(stage, "output"), at(output));
        const files = [];
        const visit = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) visit(p); else files.push(relative(ROOT, p).replaceAll("\\", "/")); } };
        visit(at(output));
        if (!files.some(p => p.includes("/keys/")) || !files.some(p => p.includes("/contract/"))) blocked("Compiler returned without the expected contract and key material. Inspect the installed compiler's output layout.");
        else {
          saveJson(report, { scope: issuance ? "legacy_test_asset_compilation" : coinProbe ? "compile_only_unauthorized_coin_io_probe_never_deploy" : probe ? "compile_only_nonpayment_probe" : legacy ? "legacy_shielded_contract" : "native_night_contract_compilation", result: "passed", observedAt: new Date().toISOString(), compiler: "0.31.1", source, sourceHash: hashFile(source), files: files.map(path => ({ path, sha256: hashFile(path) })) });
          const circuits = files.filter(p => p.includes("/keys/") && p.endsWith(".verifier")).map(p => p.split("/").at(-1).replace(/\.verifier$/, ""));
          console.log(`Compiled ${source}; circuits: ${circuits.join(", ")}. This is not settlement verification.`);
        }
      }
    } catch (error) { blocked(error.code === "EEXIST" ? "Another heavy task holds .local/heavy-tool.lock. Inspect its owner; do not delete another worker's lock." : `Compilation preparation failed: ${error.code ?? error.message}`); }
    finally {
      if (stage) rmSync(stage, { recursive: true, force: true });
      if (fd !== undefined) { closeSync(fd); unlinkSync(at(".local/heavy-tool.lock")); }
    }
  }
}
