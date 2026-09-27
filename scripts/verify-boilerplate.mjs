import { readJson, has, run, saveJson } from "./lib.mjs";
const checks = [];
const offline = run(process.execPath, ["scripts/offline.mjs"], { timeout: 60_000 });
checks.push({ name: "source and dependency-free utility checks", result: offline.ok ? "passed" : "failed", exit: offline.status });
let resolved = false;
if (has("package-lock.json")) {
  try {
    const lock = readJson("package-lock.json"), pkg = readJson("package.json");
    resolved = lock.lockfileVersion >= 3 && [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)].every(name => lock.packages?.[`node_modules/${name}`]?.version);
  } catch { resolved = false; }
}
checks.push({ name: "real lockfile with dependency entries", result: resolved ? "present_requires_npm_ci" : "blocked" });
if (resolved) {
  const install = run("npm", ["ci", "--no-audit", "--no-fund"], { timeout: 240_000 });
  checks.push({ name: "npm ci", result: install.ok ? "passed" : "failed", exit: install.status });
  if (install.ok) {
    for (const command of ["audit:deps", "lint", "typecheck", "test:unit", "build", "test:browser", "compile:probe"]) {
      const result = run("npm", ["run", command], { timeout: command === "compile:probe" ? 620_000 : 240_000 });
      checks.push({ name: command, result: result.ok ? "passed" : result.status === 2 ? "blocked" : "failed", exit: result.status });
      if (!result.ok) { process.stdout.write(result.stdout); process.stderr.write(result.stderr); }
    }
  }
} else checks.push({ name: "lint/typecheck/unit/build/browser/Compact probe", result: "blocked", reason: "Resolve the genuine dependency graph and required tools first" });
for (const command of ["doctor", "doctor:codex", "doctor:mcp"]) {
  const result = run("npm", ["run", command], { timeout: 65_000 });
  checks.push({ name: command, result: result.ok ? "passed" : result.status === 2 ? "blocked" : "failed", exit: result.status });
}
const result = checks.some(c => c.result === "failed") ? "failed" : checks.some(c => c.result !== "passed" && c.result !== "present_requires_npm_ci") ? "blocked" : "passed";
const report = { scope: "complete_preparation_not_product_acceptance", observedAt: new Date().toISOString(), result, checks };
saveJson("reports/boilerplate.json", report); console.log(JSON.stringify(report, null, 2));
process.exitCode = result === "passed" ? 0 : result === "blocked" ? 2 : 1;
