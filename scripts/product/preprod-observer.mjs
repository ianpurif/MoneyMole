import preprod from "../../config/preprod.json" with { type: "json" };
import assert from "node:assert/strict";
import { ContractState, Transaction, Event } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { readFileSync } from "node:fs";
import { at } from "../lib.mjs";
export const endpoint = preprod.indexerHttp;
export async function query(query, variables) {
  const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(20000) });
  assert.equal(r.status, 200); const b = await r.json(); assert(!b.errors && b.data); return b.data;
}
async function rpc(method, params) {
  const r = await fetch(preprod.nodeRpc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(15000) });
  const b = await r.json(); assert(r.ok && !b.error && b.result !== undefined); return b.result;
}
export async function finality(block) {
  assert(Number.isSafeInteger(block.height) && block.height >= 0);
  const head = await rpc("chain_getFinalizedHead", []), header = await rpc("chain_getHeader", [head]);
  assert(BigInt(header.number) >= BigInt(block.height)); assert.equal((await rpc("chain_getBlockHash", [block.height])).replace(/^0x/, ""), block.hash);
}
export async function transaction(id) {
  assert.match(id, /^[a-f0-9]{64}$/);
  const data = await query(`query($offset:TransactionOffset!){transactions(offset:$offset){hash raw block{height hash} contractActions{address state} zswapLedgerEvents{raw} ... on RegularTransaction{identifiers transactionResult{status}}}}`, { offset: { identifier: id } });
  const tx = data.transactions.find(t => t.identifiers?.includes(id)); assert(tx);
  assert(Transaction.deserialize("signature", "proof", "binding", Buffer.from(tx.raw, "hex")).identifiers().includes(id)); await finality(tx.block); return tx;
}
export function eventKinds(tx) { return tx.zswapLedgerEvents.map(e => Event.deserialize(Buffer.from(e.raw, "hex"))).filter(e => e.source.transactionHash === tx.hash).map(e => e.content.tag); }
export async function verifyEscrow(address) {
  assert.match(address, /^[a-f0-9]{64}$/);
  const data = await query(`query($address:HexEncoded!){contractAction(address:$address){state transaction{block{height hash}}}}`, { address });
  assert(data.contractAction); await finality(data.contractAction.transaction.block);
  const state = ContractState.deserialize(Buffer.from(data.contractAction.state, "hex")); assert.equal(state.operations().length, 2);
  for (const c of ["fund", "claim"]) assert.deepEqual(Buffer.from(state.operation(c).verifierKey), readFileSync(at(`managed/private-payments/keys/${c}.verifier`)));
  return state;
}
