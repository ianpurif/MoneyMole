import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join, delimiter } from "node:path";
import { at, readJson, run, blocked, printResult } from "./lib.mjs";
const lock = readJson("toolchain.lock.json"), spec = lock.compactInstaller;
const approved = process.argv.includes("--approve-reviewed-installer");
if (!approved || spec.reviewed !== true || !spec.assetUrl || !/^[a-f0-9]{64}$/.test(spec.sha256 ?? "")) blocked("Verified installer URL/checksum/review and explicit execution approval are required. Complete M0; no script was fetched or executed.");
else if (!spec.assetUrl.startsWith(`https://github.com/midnightntwrk/compact/releases/download/${spec.releaseTag}/`)) blocked("Installer must be an exact official versioned release asset.");
else if (!Array.isArray(spec.arguments) || spec.arguments.some(a => typeof a !== "string")) blocked("Record the reviewed installer arguments in toolchain.lock.json.");
else {
  try {
    const response = await fetch(spec.assetUrl, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error("Download failed");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 1_000_000 || createHash("sha256").update(bytes).digest("hex") !== spec.sha256) throw new Error("Installer integrity mismatch");
    mkdirSync(at(".local"), { recursive: true });
    const path = at(".local/compact-installer.sh"); writeFileSync(path, bytes, { mode: 0o600 });
    const install = run("bash", [path, ...spec.arguments], { timeout: 240_000 }); printResult("reviewed Compact installer", install);
    if (!install.ok) throw new Error("Installation failed");
    const env = { ...process.env, PATH: join(homedir(), ".compact/bin") + delimiter + process.env.PATH };
    const version = run("compact", ["--version"], { env, timeout: 10_000 });
    if (!version.ok || !version.stdout.includes(lock.components.compactDevtools)) throw new Error("Devtools version mismatch");
    const update = run("compact", ["update", lock.components.compactCompiler], { env, timeout: 240_000 }); printResult("pinned compiler install", update);
    if (!update.ok) throw new Error("Compiler installation failed");
    const compiler = run("compact", ["compile", "--version"], { env, timeout: 10_000 });
    if (!compiler.ok || !(compiler.stdout + compiler.stderr).includes(lock.components.compactCompiler)) throw new Error("Compiler version mismatch");
    console.log("Pinned versions observed. Ensure ~/.compact/bin is on PATH before further commands.");
  } catch { blocked("Pinned installation failed. Inspect sanitized installer diagnostics and recorded metadata; do not change versions blindly."); }
}
