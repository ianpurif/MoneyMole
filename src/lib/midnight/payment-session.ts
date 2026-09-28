import "client-only";
import preprod from "../../../config/preprod.json";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { Transaction, CostModel, nativeToken, type UnprovenTransaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { BrowserPrivateStore } from "../private-state/indexed-db";
import { storageIdentity } from "../private-state/storage-identity";
import { hex, unhex } from "./payment-codec";
import { PaymentKeys, observeTransaction } from "./payment-network";
import { withLocalProver } from "./proof-lock";
import { bech32m } from "@scure/base";
import { PaymentError, paymentStep } from "./payment-errors";
import { coordinateWalletReads, WalletSessionInvalid } from "./wallet-reads";

export const ISSUER = preprod.issuerAddress;
export function paymentAsset() { return nativeToken().raw; }
export const NIGHT_DECIMALS = preprod.paymentAsset.decimals;
if (preprod.paymentAsset.symbol !== "NIGHT" || preprod.paymentAsset.kind !== "unshielded" || NIGHT_DECIMALS !== 6 || preprod.paymentAsset.protocolVersion !== 2) throw new Error("Unsupported NIGHT configuration");
export type TxPhase = "draft" | "prepared" | "authorization_requested" | "outcome_unknown" | "submitted" | "finalized" | "failed";
export type TxRecord = { phase: TxPhase; transaction?: string; transactionId?: string; transactionHash?: string; blockHash?: string; blockHeight?: number };
export function validateTx(value: TxRecord) {
  if (!value || !["draft", "prepared", "authorization_requested", "outcome_unknown", "submitted", "finalized", "failed"].includes(value.phase)) throw new Error("Invalid recovery state");
  if (["outcome_unknown", "submitted", "finalized", "failed"].includes(value.phase)) unhex(value.transactionId ?? "", 32);
  if (value.transaction && value.transaction.length > 1_800_000) throw new Error("Transaction recovery record too large");
}
export async function walletContext(api: ConnectedAPI, check: () => Promise<unknown>, localIdentity?: string) {
  api = coordinateWalletReads(api);
  await check(); setNetworkId("preprod");
  const addresses = await api.getShieldedAddresses();
  const coinKey = ShieldedCoinPublicKey.codec.decode("preprod", MidnightBech32m.parse(addresses.shieldedCoinPublicKey)).toHexString();
  const encKey = ShieldedEncryptionPublicKey.codec.decode("preprod", MidnightBech32m.parse(addresses.shieldedEncryptionPublicKey)).toHexString();
  const address = validateRecipient((await api.getUnshieldedAddress()).unshieldedAddress);
  const unshieldedKey = UnshieldedAddress.codec.decode("preprod", MidnightBech32m.parse(address)).hexString;
  const walletId = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(coinKey))));
  async function guard() { return paymentStep("wallet", async () => { await check(); if ((await api.getConfiguration()).networkId !== "preprod" || (await api.getShieldedAddresses()).shieldedAddress !== addresses.shieldedAddress || (await api.getUnshieldedAddress()).unshieldedAddress !== address) throw new WalletSessionInvalid(); }); }
  return { api, coinKey, encKey, walletId: storageIdentity(walletId, localIdentity), guard, address, unshieldedKey };
}
export type WalletContext = Awaited<ReturnType<typeof walletContext>>;
export async function openStore(wallet: WalletContext, contract: string, password: string, schemaVersion = 1) {
  const ns = { network: "preprod" as const, contractAddress: contract, walletIdentity: wallet.walletId, schemaVersion };
  return BrowserPrivateStore.unlock(ns, password, !await BrowserPrivateStore.exists(ns));
}
export async function readRecord<T>(store: BrowserPrivateStore, key: string) {
  const found = await store.read(key); if (!found) return null;
  try { return { value: JSON.parse(new TextDecoder().decode(found.plaintext)) as T, revision: found.revision }; } finally { found.plaintext.fill(0); }
}
export async function writeRecord(store: BrowserPrivateStore, key: string, value: unknown, revision: number) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  try { return await paymentStep("storage", () => store.write(key, bytes, revision)); } finally { bytes.fill(0); }
}
export async function provePayment(tx: UnprovenTransaction) {
  const action = async () => hex((await tx.prove(httpClientProvingProvider(preprod.proofServer, new PaymentKeys(), { timeout: 180000 }), CostModel.initialCostModel())).serialize());
  return paymentStep("prover", () => withLocalProver(action));
}
/** Bounds acknowledgement waiting, never cancels or retries a submission. */
export async function submitOnce(api: ConnectedAPI, transaction: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([api.submitTransaction(transaction), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new PaymentError("pending")), 30_000); })]);
  } finally { clearTimeout(timer); }
}
export async function submitPrepared(wallet: WalletContext, tx: TxRecord, persist: () => Promise<void>, onStage?: (stage: "authorization" | "submission") => void) {
  await wallet.guard(); validateTx(tx);
  if (!["prepared", "authorization_requested"].includes(tx.phase) || tx.transactionId || !tx.transaction) throw new Error("Reconcile the existing transaction before another submission");
  const original = Transaction.deserialize("signature", "proof", "pre-binding", unhex(tx.transaction));
  const originalActions = [...(original.intents?.values() ?? [])].flatMap(i => i.actions).map(a => a.toString());
  tx.phase = "authorization_requested"; await persist();
  onStage?.("authorization");
  const balanced = await paymentStep("approval", () => wallet.api.balanceUnsealedTransaction(tx.transaction!));
  await wallet.guard();
  const sealed = Transaction.deserialize("signature", "proof", "binding", unhex(balanced.tx));
  const actions = [...(sealed.intents?.values() ?? [])].flatMap(i => i.actions).map(a => a.toString());
  if (JSON.stringify(actions) !== JSON.stringify(originalActions)) throw new Error("Wallet changed the reviewed contract action");
  const identifier = sealed.identifiers()[0]; if (!identifier) throw new Error("Missing transaction identifier");
  tx.transactionId = identifier; tx.phase = "outcome_unknown"; await persist();
  onStage?.("submission");
  // A missing acknowledgement is UNKNOWN, never a failed transfer. Stop waiting
  // without cancelling/repeating the request; the saved ID is reconciled next.
  await submitOnce(wallet.api, balanced.tx);
  tx.phase = "submitted"; delete tx.transaction; await persist();
}
export async function reconcileTx(tx: TxRecord, persist: () => Promise<void>) {
  if (!tx.transactionId) return null;
  const observation = await observeTransaction(tx.transactionId); if (!observation) return null;
  // PARTIAL_SUCCESS (or a future status) is not a wholly failed transaction.
  // Its effects must never authorize another payment attempt.
  const status = observation.transactionResult.status;
  tx.phase = status === "SUCCESS" ? "finalized" : status === "FAILURE" ? "failed" : "outcome_unknown";
  tx.transactionHash = observation.hash; tx.blockHash = observation.block.hash; tx.blockHeight = observation.block.height;
  delete tx.transaction; await persist(); return observation;
}
export function validateRecipient(address: string) {
  const decoded = bech32m.decode(address as `${string}1${string}`, 256);
  if (decoded.prefix !== `mn_${UnshieldedAddress.codec.type}_preprod` || bech32m.fromWords(decoded.words).length !== 32 || bech32m.encode(decoded.prefix, decoded.words, 256) !== address) throw new Error("Enter a canonical Preprod unshielded NIGHT address");
  return address;
}
export function recipientKey(address: string) {
  return UnshieldedAddress.codec.decode("preprod", MidnightBech32m.parse(validateRecipient(address))).hexString;
}
