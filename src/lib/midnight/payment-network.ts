import "client-only";
import preprod from "../../../config/preprod.json";
import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { Event, LedgerParameters, Transaction, ZswapChainState } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ZKConfigProvider, createZKIR, createProverKey, createVerifierKey } from "@midnight-ntwrk/midnight-js-types";
import { hex, unhex } from "./payment-codec";
import { ledger } from "../../../managed/night-payments/contract/index.js";
import { paymentStep } from "./payment-errors";

export const INDEXER = preprod.indexerHttp;
export type Block = { height: number; hash: string };
export type ObservedTx = { hash: string; raw: string; identifiers: string[]; block: Block; transactionResult: { status: string }; contractActions: { address: string; state: string }[]; zswapLedgerEvents: { raw: string }[] };
export async function query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  return paymentStep("network", async () => {
  const response = await fetch(INDEXER, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(20000), cache: "no-store" });
  if (!response.ok) throw new Error("Preprod indexer unavailable; retry reconciliation");
  const body = await response.json() as { data?: T; errors?: unknown };
  if (body.errors || !body.data) throw new Error("Preprod observation unavailable; retry reconciliation");
  return body.data;
  });
}
async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  return paymentStep("network", async () => {
  const response = await fetch(preprod.nodeRpc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(15000) });
  const body = await response.json() as { result?: T; error?: unknown };
  if (!response.ok || body.error || body.result === undefined) throw new Error("Preprod finality unavailable; retry reconciliation");
  return body.result;
  });
}
export async function finalized(block: Block) {
  if (!Number.isSafeInteger(block.height) || block.height < 0 || !/^[a-f0-9]{64}$/.test(block.hash)) throw new Error("Invalid public block observation");
  const head = await rpc<string>("chain_getFinalizedHead", []);
  const header = await rpc<{ number: string }>("chain_getHeader", [head]);
  const canonical = await rpc<string>("chain_getBlockHash", [block.height]);
  if (BigInt(header.number) < BigInt(block.height) || canonical.replace(/^0x/, "") !== block.hash) throw new Error("Indexer observation is not confirmed by the finalized node chain");
}
export async function observeTransaction(identifier: string): Promise<ObservedTx | null> {
  unhex(identifier, 32);
  const data = await query<{ transactions: ObservedTx[] }>(`query PaymentTransaction($offset: TransactionOffset!) { transactions(offset: $offset) { hash raw block { height hash } contractActions { address state } zswapLedgerEvents { raw } ... on RegularTransaction { identifiers transactionResult { status } } } }`, { offset: { identifier } });
  const tx = data.transactions.find(t => t.identifiers?.includes(identifier));
  if (!tx) return null;
  if (!Transaction.deserialize("signature", "proof", "binding", unhex(tx.raw)).identifiers().includes(identifier)) throw new Error("Transaction identity mismatch");
  await finalized(tx.block); return tx;
}
export function outputObservations(tx: ObservedTx) {
  return tx.zswapLedgerEvents.flatMap(row => {
    const event = Event.deserialize(unhex(row.raw));
    const e = event.content;
    if (event.source.transactionHash !== tx.hash || e.tag !== "zswapOutput" || !("contract" in e) || !("commitment" in e) || !("mtIndex" in e) || typeof e.contract !== "string") return [];
    return [{ contract: e.contract, commitment: String(e.commitment), mtIndex: BigInt(e.mtIndex as bigint) }];
  });
}
export class PaymentKeys extends ZKConfigProvider<"fund" | "claim"> {
  async read(kind: string, circuit: string) {
    return paymentStep("artifacts", async () => {
    if (!["fund", "claim"].includes(circuit)) throw new Error("Invalid circuit");
    const response = await fetch(`/api/artifacts/night-payments/${kind}/${circuit}`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error("Compiled payment artifacts unavailable");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))) !== response.headers.get("X-Artifact-SHA256")) throw new Error("Artifact integrity check failed");
    return bytes;
    });
  }
  async getZKIR(c: "fund" | "claim") { return createZKIR(await this.read("bzkir", c)); }
  async getProverKey(c: "fund" | "claim") { return createProverKey(await this.read("prover", c)); }
  async getVerifierKey(c: "fund" | "claim") { return createVerifierKey(await this.read("verifier", c)); }
}
export async function publicState(address: string) {
  unhex(address, 32);
  const data = await query<{ contractAction: { state: string; zswapState: string; transaction: { block: Block & { ledgerParameters: string } } } | null }>(`query PaymentState($address: HexEncoded!) { contractAction(address: $address) { state zswapState transaction { block { height hash ledgerParameters } } } }`, { address });
  const a = data.contractAction; if (!a) throw new Error("Contract is not indexed yet");
  await finalized(a.transaction.block);
  return { state: ContractState.deserialize(unhex(a.state)), zswap: ZswapChainState.deserialize(unhex(a.zswapState)), parameters: LedgerParameters.deserialize(unhex(a.transaction.block.ledgerParameters)), block: a.transaction.block };
}
export async function verifiedPaymentState(address: string, asset: string) {
  const data = await publicState(address), keys = new PaymentKeys();
  if (hex(ledger(data.state.data).supportedAsset) !== asset || data.state.operations().length !== 2) throw new Error("Unsupported payment deployment");
  for (const circuit of ["fund", "claim"] as const) {
    const op = data.state.operation(circuit);
    if (!op || hex(op.verifierKey) !== hex(await keys.getVerifierKey(circuit))) throw new Error("Payment deployment does not match this build");
  }
  return data;
}
