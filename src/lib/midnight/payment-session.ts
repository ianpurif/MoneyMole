import "client-only";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey, ShieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { Transaction, CostModel, rawTokenType, type UnprovenTransaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { BrowserPrivateStore } from "../private-state/indexed-db";
import { hex, unhex } from "./payment-codec";
import { PaymentKeys, observeTransaction } from "./payment-network";

export const ISSUER = "47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635";
export function paymentAsset() { const d = new Uint8Array(32); d.set(new TextEncoder().encode("moneymole/test/v1")); return rawTokenType(d, ISSUER); }
export type TxPhase = "draft" | "prepared" | "authorization_requested" | "outcome_unknown" | "submitted" | "finalized" | "failed";
export type TxRecord = { phase: TxPhase; transaction?: string; transactionId?: string; transactionHash?: string; blockHash?: string; blockHeight?: number };
export function validateTx(value: TxRecord) {
  if (!value || !["draft", "prepared", "authorization_requested", "outcome_unknown", "submitted", "finalized", "failed"].includes(value.phase)) throw new Error("Invalid recovery state");
  if (["outcome_unknown", "submitted", "finalized", "failed"].includes(value.phase)) unhex(value.transactionId ?? "", 32);
  if (value.transaction && value.transaction.length > 1_800_000) throw new Error("Transaction recovery record too large");
}
export async function walletContext(api: ConnectedAPI, check: () => Promise<unknown>) {
  await check(); setNetworkId("preprod");
  const addresses = await api.getShieldedAddresses();
  const coinKey = ShieldedCoinPublicKey.codec.decode("preprod", MidnightBech32m.parse(addresses.shieldedCoinPublicKey)).toHexString();
  const encKey = ShieldedEncryptionPublicKey.codec.decode("preprod", MidnightBech32m.parse(addresses.shieldedEncryptionPublicKey)).toHexString();
  const walletId = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(coinKey))));
  async function guard() { await check(); if ((await api.getConfiguration()).networkId !== "preprod" || (await api.getShieldedAddresses()).shieldedAddress !== addresses.shieldedAddress) throw new Error("Reconnect the original Preprod wallet"); }
  return { api, coinKey, encKey, walletId, guard, address: addresses.shieldedAddress };
}
export type WalletContext = Awaited<ReturnType<typeof walletContext>>;
export async function openStore(wallet: WalletContext, contract: string, password: string) {
  const ns = { network: "preprod" as const, contractAddress: contract, walletIdentity: wallet.walletId, schemaVersion: 1 };
  return BrowserPrivateStore.unlock(ns, password, !await BrowserPrivateStore.exists(ns));
}
export async function readRecord<T>(store: BrowserPrivateStore, key: string) {
  const found = await store.read(key); if (!found) return null;
  try { return { value: JSON.parse(new TextDecoder().decode(found.plaintext)) as T, revision: found.revision }; } finally { found.plaintext.fill(0); }
}
export async function writeRecord(store: BrowserPrivateStore, key: string, value: unknown, revision: number) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  try { return await store.write(key, bytes, revision); } finally { bytes.fill(0); }
}
export async function provePayment(tx: UnprovenTransaction) {
  const action = async () => hex((await tx.prove(httpClientProvingProvider("http://127.0.0.1:6300", new PaymentKeys(), { timeout: 180000 }), CostModel.initialCostModel())).serialize());
  if (!navigator.locks) throw new Error("This browser must support Web Locks for local proving");
  return navigator.locks.request("moneymole-local-prover", { mode: "exclusive" }, action);
}
export async function submitPrepared(wallet: WalletContext, tx: TxRecord, persist: () => Promise<void>) {
  await wallet.guard(); validateTx(tx);
  if (!["prepared", "authorization_requested"].includes(tx.phase) || tx.transactionId || !tx.transaction) throw new Error("Reconcile the existing transaction before another submission");
  const original = Transaction.deserialize("signature", "proof", "pre-binding", unhex(tx.transaction));
  const originalActions = [...(original.intents?.values() ?? [])].flatMap(i => i.actions).map(a => a.toString());
  tx.phase = "authorization_requested"; await persist();
  const balanced = await wallet.api.balanceUnsealedTransaction(tx.transaction);
  await wallet.guard();
  const sealed = Transaction.deserialize("signature", "proof", "binding", unhex(balanced.tx));
  const actions = [...(sealed.intents?.values() ?? [])].flatMap(i => i.actions).map(a => a.toString());
  if (JSON.stringify(actions) !== JSON.stringify(originalActions)) throw new Error("Wallet changed the reviewed contract action");
  const identifier = sealed.identifiers()[0]; if (!identifier) throw new Error("Missing transaction identifier");
  tx.transactionId = identifier; tx.phase = "outcome_unknown"; await persist();
  await wallet.api.submitTransaction(balanced.tx);
  tx.phase = "submitted"; delete tx.transaction; await persist();
}
export async function reconcileTx(tx: TxRecord, persist: () => Promise<void>) {
  if (!tx.transactionId) return null;
  const observation = await observeTransaction(tx.transactionId); if (!observation) return null;
  tx.phase = observation.transactionResult.status === "SUCCESS" ? "finalized" : "failed";
  tx.transactionHash = observation.hash; tx.blockHash = observation.block.hash; tx.blockHeight = observation.block.height;
  delete tx.transaction; await persist(); return observation;
}
export function validateRecipient(address: string) {
  ShieldedAddress.codec.decode("preprod", MidnightBech32m.parse(address)); return address;
}
