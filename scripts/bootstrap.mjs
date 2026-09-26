import { has, run, printResult, blocked } from "./lib.mjs";
if (Number(process.versions.node.split(".")[0]) !== 22) { blocked("Use Node 22; see .nvmrc."); }
else {
  const version = run("npm", ["--version"]);
  if (!version.ok || version.stdout.trim() !== "10.9.2") blocked("Use npm 10.9.2 before resolving this dependency graph.");
  else {
    if (!has("package-lock.json")) {
      console.log("Resolving real registry metadata. No synthetic lockfile will be created.");
      const lock = run("npm", ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"], { timeout: 180_000 });
      printResult("dependency lock resolution", lock);
      if (!lock.ok || !has("package-lock.json")) blocked("Dependency resolution failed. Inspect the specific error; do not replace the lockfile with an empty graph.");
    }
    if (!process.exitCode && !process.argv.includes("--lock-only")) {
      const install = run("npm", ["ci", "--no-audit", "--no-fund"], { timeout: 240_000 });
      printResult("lockfile installation", install);
      if (!install.ok) blocked("Installation did not finish successfully.");
    }
    if (!process.exitCode) console.log("Dependency command completed. Run npm run verify:boilerplate; this is not payment acceptance.");
  }
}
