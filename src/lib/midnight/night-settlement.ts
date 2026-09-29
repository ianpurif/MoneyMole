import "client-only";
import { ContractCall, Transaction, nativeToken, addressFromKey, type Effects, type TokenType } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { unhex } from "./payment-codec";
import type { ObservedTx } from "./payment-network";

type NativeTx = Pick<ObservedTx, "raw" | "identifiers">;
const isNight = (t: TokenType) => t.tag === "unshielded" && t.raw === nativeToken().raw;
const sumNight = (map: Map<TokenType, bigint>) => [...map].reduce((sum, [t, v]) => sum + (isNight(t) ? v : 0n), 0n);
export function nativeTransaction(tx: NativeTx) {
  const native = Transaction.deserialize("signature", "proof", "binding", unhex(tx.raw));
  if (!native.identifiers().some(id => tx.identifiers.includes(id))) throw new Error("Native transaction identity mismatch");
  return native;
}
/** Exact native contract effects, not balances or Zswap events, establish NIGHT movement. */
export function verifyNightCall(tx: NativeTx, contract: string, entry: "fund" | "claim", amount: bigint, recipient?: string) {
  const native = nativeTransaction(tx);
  const calls = [...(native.intents?.values() ?? [])].flatMap(i => i.actions).flatMap(a => a instanceof ContractCall && a.address === contract && (typeof a.entryPoint === "string" ? a.entryPoint : new TextDecoder().decode(a.entryPoint)) === entry ? [a] : []);
  if (calls.length !== 1 || amount <= 0n) throw new Error("Expected one NIGHT escrow call");
  const effects = [calls[0]!.guaranteedTranscript?.effects, calls[0]!.fallibleTranscript?.effects].filter((e): e is Effects => !!e);
  if (effects.some(e => e.unshieldedMints.size || e.shieldedMints.size)) throw new Error("A payment must not mint");
  const received = effects.reduce((sum, e) => sum + sumNight(e.unshieldedInputs), 0n);
  const sent = effects.reduce((sum, e) => sum + sumNight(e.unshieldedOutputs), 0n);
  if (entry === "fund" ? received !== amount || sent !== 0n : sent !== amount || received !== 0n) throw new Error("NIGHT escrow amount mismatch");
  if (entry === "claim") {
    const spends = effects.flatMap(e => [...e.claimedUnshieldedSpends]);
    if (!recipient || spends.length !== 1 || !isNight(spends[0]![0][0]) || spends[0]![0][1].tag !== "user" || spends[0]![0][1].address !== recipient || spends[0]![1] !== amount) throw new Error("NIGHT claim destination mismatch");
    if (nightOutput(tx, recipient) !== amount) throw new Error("NIGHT claim output missing");
  }
}
export function nightOutput(tx: NativeTx, recipient: string) {
  return [...(nativeTransaction(tx).intents?.values() ?? [])].flatMap(i => [i.guaranteedUnshieldedOffer, i.fallibleUnshieldedOffer]).flatMap(o => o?.outputs ?? []).filter(o => o.type === nativeToken().raw && o.owner === recipient).reduce((sum, o) => sum + o.value, 0n);
}
export function verifyNightSpend(tx: NativeTx, sender: string, recipient: string, amount: bigint) {
  const native = nativeTransaction(tx), intents = [...(native.intents?.values() ?? [])];
  if (intents.some(i => i.actions.length) || sender === recipient || nightOutput(tx, recipient) !== amount) throw new Error("NIGHT transfer destination or amount mismatch");
  const offers = intents.flatMap(i => [i.guaranteedUnshieldedOffer, i.fallibleUnshieldedOffer]);
  const inputs = offers.flatMap(o => o?.inputs ?? []);
  const outputs = offers.flatMap(o => o?.outputs ?? []);
  if (!inputs.length || inputs.some(i => i.type !== nativeToken().raw || addressFromKey(i.owner) !== sender) || outputs.some(o => o.type !== nativeToken().raw || ![sender, recipient].includes(o.owner))) throw new Error("Unexpected NIGHT transfer participants");
  const debit = inputs.reduce((sum, i) => sum + i.value, 0n) - nightOutput(tx, sender);
  if (debit !== amount) throw new Error("NIGHT transfer debit mismatch");
}
