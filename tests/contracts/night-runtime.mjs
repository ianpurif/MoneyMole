import assert from "node:assert/strict";
import { createConstructorContext, createCircuitContext } from "@midnight-ntwrk/compact-runtime";
import { nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { Contract, ledger } from "../../managed/night-payments/contract/index.js";

// Synthetic state only; real compiled circuits, no wallet credentials or transfers.
export function runNightRuntimeCases(onProofData = () => {}) {
  const bytes = n => new Uint8Array(32).fill(n), address = "01".repeat(32);
  const recipient = { bytes: bytes(2) }, ps = { amount: 1_234_567n, nonce: bytes(3), secret: bytes(4) };
  let path;
  const contract = new Contract({
    paymentAmount: ({ privateState: p }) => [p, p.amount],
    paymentNonce: ({ privateState: p }) => [p, p.nonce],
    claimAuthority: ({ privateState: p }) => [p, p.secret],
    membership: ({ ledger: l, privateState: p }, note) => {
      const found = p.path ?? l.notes.findPathForLeaf(note);
      if (!found) throw new Error("Synthetic note absent"); path = found; return [p, found];
    },
  });
  const initial = contract.initialState(createConstructorContext(ps, recipient)).currentContractState;
  const call = (name, state, p = ps, destination = recipient, addr = address, balance = ps.amount) => {
    const context = createCircuitContext(addr, recipient, state, p);
    context.currentQueryContext.block = { ...context.currentQueryContext.block, balance: new Map([[nativeToken(), balance]]) };
    return name === "claim" ? contract.circuits.claim(context, destination) : contract.circuits.fund(context);
  };
  const stateOf = r => r.context.currentQueryContext.state;
  const effects = r => r.context.currentQueryContext.effects;
  const total = map => [...map].filter(([t]) => t.tag === "unshielded" && t.raw === nativeToken().raw).reduce((sum, [,v]) => sum + v, 0n);
  const cases = [], check = (name, fn) => { fn(); cases.push({ name, result: "passed" }); };
  let funded, claimed;
  check("native NIGHT identity is fixed by the constructor", () => assert.equal(Buffer.from(ledger(initial.data).supportedAsset).toString("hex"), nativeToken().raw));
  check("fund requires exact native NIGHT input and no mint or shielded output", () => {
    funded = call("fund", initial); onProofData("fund", funded.proofData);
    assert.equal(total(effects(funded).unshieldedInputs), ps.amount);
    assert.equal(effects(funded).unshieldedMints.size, 0); assert.equal(effects(funded).shieldedMints.size, 0);
    assert.equal(funded.context.currentZswapLocalState.outputs.length, 0);
    assert.equal(ledger(stateOf(funded)).notes.firstFree(), 1n);
  });
  check("claim binds exact native amount and public receiver output without minting", () => {
    claimed = call("claim", stateOf(funded)); onProofData("claim", claimed.proofData);
    assert.equal(total(effects(claimed).unshieldedOutputs), ps.amount);
    const spends = [...effects(claimed).claimedUnshieldedSpends]; assert.equal(spends.length, 1);
    assert.deepEqual(spends[0], [[nativeToken(), { tag: "user", address: "02".repeat(32) }], ps.amount]);
    assert.equal(effects(claimed).unshieldedMints.size, 0); assert.equal(effects(claimed).shieldedMints.size, 0);
    assert.equal(ledger(stateOf(claimed)).spent.size(), 1n);
  });
  check("destination changes the public proof transcript", () => {
    const other = call("claim", stateOf(funded), ps, { bytes: bytes(9) });
    assert.notDeepEqual(other.proofData.publicTranscript, claimed.proofData.publicTranscript);
  });
  check("replay rejected atomically", () => assert.throws(() => call("claim", stateOf(claimed))));
  for (const [name, patch] of [["wrong secret", { secret: bytes(5) }], ["changed amount", { amount: ps.amount + 1n }], ["changed nonce", { nonce: bytes(6) }]]) {
    check(`${name} rejected with original path`, () => assert.throws(() => call("claim", stateOf(funded), { ...ps, ...patch, path })));
  }
  check("cross-deployment claim rejected", () => assert.throws(() => call("claim", stateOf(funded), { ...ps, path }, recipient, "07".repeat(32))));
  check("zero funding rejected", () => assert.throws(() => call("fund", initial, { ...ps, amount: 0n })));
  check("insufficient escrow NIGHT rejected", () => assert.throws(() => call("claim", stateOf(funded), ps, recipient, address, ps.amount - 1n)));
  check("stale membership rejected and refreshed membership succeeds", () => {
    const oldPath = path, newer = call("fund", stateOf(funded), { ...ps, nonce: bytes(8) });
    assert.throws(() => call("claim", stateOf(newer), { ...ps, path: oldPath }));
    assert.equal(ledger(stateOf(call("claim", stateOf(newer)))).spent.size(), 1n);
  });
  return cases;
}
