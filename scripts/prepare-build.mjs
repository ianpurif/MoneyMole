import { delimiter } from "node:path";
import { at, has, hashFile, readJson, run, printResult } from "./lib.mjs";

const compilerVersion = readJson("toolchain.lock.json").components.compactCompiler;
const contracts = [
  { source: "contracts/night-payments.compact", report: "reports/contract-compile.json", flag: "--product" },
  { source: "contracts/private-payments.compact", report: "reports/legacy-compile.json", flag: "--legacy" },
  { source: "contracts/issuance/test-asset.compact", report: "reports/issuance-compile.json", flag: "--issuance" },
];

function prepared({ source, report }) {
  try {
    const result = readJson(report);
    return result.compiler === compilerVersion && result.sourceHash === hashFile(source)
      && result.files?.length > 0
      && result.files.every(({ path, sha256 }) => has(path) && hashFile(path) === sha256);
  } catch { return false; }
}

let missing = contracts.filter(contract => !prepared(contract));
if (missing.length === 0) {
  console.log("Pinned Compact artifacts are current.");
} else {
  const env = {
    ...process.env,
    PATH: at(".local/compact/bin") + delimiter + (process.env.PATH ?? ""),
    COMPACT_DIRECTORY: at(".local/compact/artifacts"),
  };
  const compiler = run("compact", ["compile", "--version"], { env, timeout: 10_000 });
  if (!compiler.ok || !(compiler.stdout + compiler.stderr).includes(compilerVersion)) {
    const install = run(process.execPath, ["scripts/install-compact.mjs", "--approve-reviewed-installer"], { env, timeout: 600_000 });
    printResult("pinned Compact toolchain", install);
    if (!install.ok) process.exit(install.status || 1);
  }
  for (const contract of missing) {
    const result = run(process.execPath, ["scripts/compile.mjs", contract.flag], { env, timeout: 660_000 });
    printResult(`${contract.source} compilation`, result);
    if (!result.ok || !prepared(contract)) process.exit(result.status || 1);
  }
  missing = contracts.filter(contract => !prepared(contract));
  if (missing.length > 0) throw new Error("Compiled artifacts are incomplete after preparation");
}
