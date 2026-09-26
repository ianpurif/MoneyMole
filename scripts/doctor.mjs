import { run, saveJson, has } from "./lib.mjs";
import { dockerCommand } from "./docker.mjs";
const docker = dockerCommand();
const checks = [{ name: "Node.js 22", status: process.versions.node.split(".")[0] === "22" ? "passed" : "blocked", observed: process.version }];
for (const [name, command, args, pattern] of [
  ["npm", "npm", ["--version"], /^10\.9\.2$/],
  ["Docker engine", docker, ["version", "--format", "{{.Server.Version}}"], /\d/],
  ["Docker Compose", docker, ["compose", "version", "--short"], /\d/],
  ["Compact devtools", "compact", ["--version"], /\b0\.5\.1\b/],
  ["Compact compiler", "compact", ["compile", "--version"], /\b0\.31\.1\b/],
  ["Codex client", "codex", ["--version"], /\d/],
]) {
  const result = run(command, args, { timeout: 8_000 });
  checks.push({ name, status: result.ok && pattern.test(result.stdout.trim() + result.stderr.trim()) ? "passed" : "blocked", observed: result.ok ? result.stdout.trim().slice(0, 200) : result.error ?? `exit ${result.status}` });
}
checks.push({ name: "Dependency lockfile present (not graph validation)", status: has("package-lock.json") ? "passed" : "blocked" });
checks.push({ name: "Next package present (not compatibility validation)", status: has("node_modules/next/package.json") ? "passed" : "blocked" });
const report = { scope: "tool_presence_and_versions_only", observedAt: new Date().toISOString(), checks, result: checks.every(c => c.status === "passed") ? "passed" : "blocked" };
saveJson("reports/doctor.json", report); console.log(JSON.stringify(report, null, 2));
if (report.result !== "passed") process.exitCode = 2;
