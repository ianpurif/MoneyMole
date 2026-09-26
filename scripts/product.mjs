import { pathToFileURL } from "node:url";
import { at, has, blocked } from "./lib.mjs";
const routes = {
  artifacts: "scripts/product/verify-artifacts.mjs", contracts: "scripts/product/test-contracts.mjs",
  integration: "scripts/product/test-integration.mjs", proving: "scripts/product/test-proving.mjs",
  preprod: "scripts/product/test-preprod.mjs", acceptance: "scripts/product/verify-acceptance.mjs",
  deploy: "scripts/product/deploy-preprod.mjs", deployment: "scripts/product/verify-deployment.mjs",
};
const name = process.argv[2]; const path = routes[name];
if (!path) { console.error("Unknown product command."); process.exitCode = 1; }
else if (!has(path)) blocked(`${name} is not implemented. Required entry point: ${path}; follow BUILD.md.`);
else {
  try {
    const action = await import(pathToFileURL(at(path)).href);
    if (typeof action.run !== "function") throw new Error("Product action must export run(args)");
    const result = await action.run(process.argv.slice(3));
    if (result?.status === "blocked") { blocked(result.reason ?? "Required owner evidence is missing."); }
    else {
      if (!result || result.status !== "passed" || !Array.isArray(result.evidencePaths) || !result.evidencePaths.length || result.evidencePaths.some(p => !has(p))) throw new Error("Product action did not provide observed evidence");
      console.log(`${name}: passed; evidence: ${result.evidencePaths.join(", ")}`);
    }
  } catch { console.error(`${name}: failed. Inspect the action's sanitized local diagnostic; no sensitive exception payload is printed.`); process.exitCode = 1; }
}
