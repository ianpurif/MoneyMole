import { beforeEach, expect, it, vi } from "vitest";
import { nativeToken, addressFromKey, sampleSigningKey, signatureVerifyingKey, type Effects } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { verifyNightCall, verifyNightSpend } from "../../src/lib/midnight/night-settlement";
// Decoded native transaction boundary is synthetic; assertions exercise production validation.
const h = vi.hoisted(() => ({ intents: new Map(), ids: ["01".repeat(32)], Call: class {} }));
vi.mock("@midnight-ntwrk/midnight-js-protocol/ledger", async original => ({
  ...await original<object>(), ContractCall: h.Call,
  Transaction: { deserialize: () => ({ identifiers: () => h.ids, intents: h.intents }) },
}));
const tx = { raw: "aabb", identifiers: ["01".repeat(32)] }, sender = "02".repeat(32), recipient = "03".repeat(32), contract = "04".repeat(32), amount = 10n;
const empty = () => ({ unshieldedMints: new Map(), shieldedMints: new Map(), unshieldedInputs: new Map(), unshieldedOutputs: new Map(), claimedUnshieldedSpends: new Map() }) as Effects;
function call(entry: "fund" | "claim") {
  const effects = empty(); effects[entry === "fund" ? "unshieldedInputs" : "unshieldedOutputs"].set(nativeToken(), amount);
  if (entry === "claim") effects.claimedUnshieldedSpends.set([nativeToken(), { tag: "user", address: recipient }], amount);
  const action = Object.assign(new h.Call(), { address: contract, entryPoint: entry, guaranteedTranscript: { effects }, fallibleTranscript: undefined });
  const intent = { actions: [action], guaranteedUnshieldedOffer: { inputs: [], outputs: entry === "claim" ? [{ owner: recipient, type: nativeToken().raw, value: amount }] : [] } };
  h.intents.set(0, intent); return { effects, intent, action };
}
beforeEach(() => { h.intents = new Map(); h.ids = [...tx.identifiers]; });
it("checks native fund effects rather than accepting a balance or unrelated token", () => {
  const { effects } = call("fund"); expect(() => verifyNightCall(tx, contract, "fund", amount)).not.toThrow();
  effects.unshieldedInputs = new Map([[{ tag: "shielded", raw: nativeToken().raw }, amount]]);
  expect(() => verifyNightCall(tx, contract, "fund", amount)).toThrow();
});
it("requires claim effects and a matching exact unshielded receiver output", () => {
  const { intent } = call("claim"); expect(() => verifyNightCall(tx, contract, "claim", amount, recipient)).not.toThrow();
  intent.guaranteedUnshieldedOffer.outputs[0]!.owner = sender;
  expect(() => verifyNightCall(tx, contract, "claim", amount, recipient)).toThrow();
});
it("rejects substituted destination, amount, mint or unrelated call", () => {
  const { effects, action } = call("claim");
  expect(() => verifyNightCall(tx, contract, "claim", amount, sender)).toThrow();
  expect(() => verifyNightCall(tx, contract, "claim", amount + 1n, recipient)).toThrow();
  effects.unshieldedMints.set("synthetic", 10n); expect(() => verifyNightCall(tx, contract, "claim", amount, recipient)).toThrow();
  effects.unshieldedMints.clear(); action.address = sender; expect(() => verifyNightCall(tx, contract, "claim", amount, recipient)).toThrow();
});
it("rejects raw transaction identity mismatches", () => {
  call("fund"); h.ids = [sender]; expect(() => verifyNightCall(tx, contract, "fund", amount)).toThrow();
});
it("verifies NIGHT spend debit, destination credit and sender change", () => {
  const key = signatureVerifyingKey(sampleSigningKey()), owner = addressFromKey(key);
  const intent = { actions: [], guaranteedUnshieldedOffer: { inputs: [{ owner: key, type: nativeToken().raw, value: 110n }], outputs: [{ owner, type: nativeToken().raw, value: 100n }, { owner: recipient, type: nativeToken().raw, value: 10n }] } };
  h.intents.set(0, intent); expect(() => verifyNightSpend(tx, owner, recipient, amount)).not.toThrow();
  intent.guaranteedUnshieldedOffer.inputs[0]!.owner = signatureVerifyingKey(sampleSigningKey());
  expect(() => verifyNightSpend(tx, owner, recipient, amount)).toThrow();
});
it("rejects a transfer with unexpected outputs or non-NIGHT inputs", () => {
  const intent = { actions: [], guaranteedUnshieldedOffer: { inputs: [{ owner: signatureVerifyingKey(sampleSigningKey()), type: nativeToken().raw, value: 10n }], outputs: [{ owner: recipient, type: nativeToken().raw, value: 10n }] } };
  h.intents.set(0, intent); intent.guaranteedUnshieldedOffer.inputs[0]!.type = "ff".repeat(32);
  expect(() => verifyNightSpend(tx, sender, recipient, amount)).toThrow();
});
