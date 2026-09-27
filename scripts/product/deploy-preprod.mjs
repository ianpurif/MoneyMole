import { hashFile, saveJson } from "../lib.mjs";
export async function run() {
  const path = "reports/deployment-plan.json";
  saveJson(path, { scope: "browser_authorized_deployment_plan_only", network: "preprod", application: "http://127.0.0.1:3000", action: "Connect 1AM on Preprod with native NIGHT and DUST. No issuer is needed. Expand Create / recover a payment escrow, prepare and approve only if no compatible escrow already exists.", sourceHash: hashFile("contracts/night-payments.compact"), toolchainHash: hashFile("toolchain.lock.json"), executed: false });
  return { status: "blocked", reason: `Deployment plan saved to ${path}. The browser holds the wallet authority. Approve there and export the public deployment record; this command never signs or redeploys.` };
}
