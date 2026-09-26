import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function at(path) {
  const result = resolve(ROOT, path);
  const rel = relative(ROOT, result);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("Path must stay inside repository");
  return result;
}
export function readJson(path) { return JSON.parse(readFileSync(at(path), "utf8")); }
export function hashFile(path) { return createHash("sha256").update(readFileSync(at(path))).digest("hex"); }
export function saveJson(path, value) { mkdirSync(dirname(at(path)), { recursive: true }); writeFileSync(at(path), JSON.stringify(value, null, 2) + "\n"); }
export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", timeout: 30_000, maxBuffer: 2_000_000, shell: false, ...options });
  return { ok: result.status === 0 && !result.error, status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error?.code ?? null };
}
export function has(path) { return existsSync(at(path)); }
export function blocked(message) { console.error(`BLOCKED: ${message}`); process.exitCode = 2; }
export function isMain(url) { return !!process.argv[1] && fileURLToPath(url) === resolve(process.argv[1]); }
export function printResult(label, result) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${label}`);
  // Local build diagnostics only. Never pass wallet or witness-bearing commands here.
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}
