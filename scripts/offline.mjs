import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, at, has, readJson, run, saveJson } from "./lib.mjs";
import { validateRequirements, renderRequirements } from "./requirements.mjs";
const checks = [];
const required = ["AGENTS.md", "BUILD.md", "PLANS.md", "README.md", "PROPOSAL.md", ".codex/config.toml", ".codex/agents/architect.toml", ".codex/agents/engineer.toml", ".codex/agents/verifier.toml", "docs/PRODUCT.md", "docs/ARCHITECTURE.md", "docs/PRIVACY.md", "docs/REQUIREMENTS.md", "docs/requirements.json", "docs/TOOLCHAIN.md", "docs/SOURCES.md", "docs/RUNBOOK.md", "docs/USAGE.md", "docs/STATUS.md", ".github/workflows/ci.yml", "compose.yaml", ".env.example", "package.json", "toolchain.lock.json"];
checks.push({ name: "source foundation paths", passed: required.every(p => has(p) && readFileSync(at(p), "utf8").trim().length > 0) });
try {
  const data = validateRequirements(readJson("docs/requirements.json"), true);
  checks.push({ name: "requirements graph and derived report", passed: renderRequirements(data) === readFileSync(at("docs/REQUIREMENTS.md"), "utf8") });
} catch { checks.push({ name: "requirements graph and derived report", passed: false }); }
const pkg = readJson("package.json");
checks.push({ name: "all manifest dependencies are exact candidates", passed: Object.values({ ...pkg.dependencies, ...pkg.devDependencies }).every(v => /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(v)) });
const files = [];
function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) { if (["node_modules", ".git", ".next", ".local", "reports", "private-evidence", "managed"].includes(entry.name)) continue; const p = join(dir, entry.name); if (entry.isDirectory()) walk(p); else files.push(p); } }
walk(ROOT);
const scripts = files.filter(p => p.endsWith(".mjs"));
for (const p of scripts) checks.push({ name: `JS syntax: ${p.slice(ROOT.length + 1)}`, passed: run(process.execPath, ["--check", p], { timeout: 5_000 }).ok });
const testFiles = files.filter(p => p.includes("tests/boilerplate/") && p.endsWith(".test.mjs"));
const tests = run(process.execPath, ["--experimental-strip-types", "--test", ...testFiles], { timeout: 30_000 });
if (tests.stdout) process.stdout.write(tests.stdout); if (tests.stderr) process.stderr.write(tests.stderr);
checks.push({ name: "dependency-free utility tests", passed: testFiles.length > 0 && tests.ok });
const report = { scope: "source_and_dependency_free_utilities_only", observedAt: new Date().toISOString(), result: checks.every(c => c.passed) ? "passed" : "failed", checks, excludes: ["npm dependency resolution", "full Next typecheck/build/runtime", "installed Codex schema and routing", "Compact compilation", "proving", "wallet integration", "payment acceptance", "challenge qualification"] };
saveJson("reports/offline.json", report); console.log(JSON.stringify(report, null, 2));
if (report.result !== "passed") process.exitCode = 1;
