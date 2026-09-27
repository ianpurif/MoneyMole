import "client-only";
import { openStore, type WalletContext } from "./payment-session";
export async function restoreAdmin(wallet: WalletContext, kind: "issuer" | "escrow", password: string, text: string, originalPassword: string) {
  if (text.length > 3_000_000) throw new Error("Recovery file too large");
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const records = parsed.version === 1 && typeof parsed.records === "object" && parsed.records ? parsed.records as Record<string, unknown> : { deployment: parsed };
  const names = Object.keys(records);
  if (!names.includes("deployment") || names.some(n => !["deployment", "issuance"].includes(n)) || (kind === "escrow" && names.includes("issuance"))) throw new Error("Unsupported recovery bundle");
  const store = await openStore(wallet, kind === "issuer" ? "issuer-deployment-staging-v1" : "night-payment-deployment-staging-v2", password, kind === "issuer" ? 1 : 2);
  try {
    await store.importManyEncrypted(Object.fromEntries(names.map(name => [name, JSON.stringify(records[name])])), originalPassword);
  } finally { store.lock(); }
}
