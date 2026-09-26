import assert from "node:assert/strict";
import { createConstructorContext, createCircuitContext } from "@midnight-ntwrk/compact-runtime";
import { Contract, ledger } from "../../managed/private-payments/contract/index.js";
import { Contract as Issuer, ledger as issuerLedger } from "../../managed/test-asset/contract/index.js";

// Synthetic fixtures only. Never accept wallet/private-state files as test inputs.
export function runRuntimeCases(onProofData = () => {}) {
  const bytes = n => new Uint8Array(32).fill(n);
  const address = "01".repeat(32), receiver = { bytes: bytes(2) };
  const coin = { nonce: bytes(3), color: bytes(4), value: 50n };
  const secret = bytes(5);
  const ps = { coin, secret };
  let originalPath;
  const contract = new Contract({
    fundingCoin: ({ privateState: p }) => [p, p.coin],
    escrowCoin: ({ privateState: p }) => [p, { ...p.coin, mt_index: 0n }],
    claimAuthority: ({ privateState: p }) => [p, p.secret],
    membership: ({ ledger: l, privateState: p }, note) => {
      const path = p.path ?? l.notes.findPathForLeaf(note);
      if (!path) throw new Error("No matching synthetic note");
      originalPath = path;
      return [p, path];
    },
  });
  const initial = contract.initialState(createConstructorContext(ps, receiver), coin.color).currentContractState;
  const call = (name, state, p = ps, addr = address) => contract.circuits[name](createCircuitContext(addr, receiver, state, p));
  const stateOf = result => result.context.currentQueryContext.state;
  const cases = [];
  const check = (name, fn) => { fn(); cases.push({ name, result: "passed" }); };
  let funded, claimed;
  check("fund inserts one note and a contract-directed Zswap output", () => {
    funded = call("fund", initial);
    onProofData("fund", funded.proofData);
    assert.equal(ledger(stateOf(funded)).notes.firstFree(), 1n);
    const z = funded.context.currentZswapLocalState;
    assert.equal(z.outputs.length, 1);
    assert.equal(z.outputs[0].recipient.is_left, false);
    assert.deepEqual(z.outputs[0].recipient.right.bytes, bytes(1));
    assert.deepEqual(z.outputs[0].coinInfo, coin);
  });
  check("claim consumes exact coin and outputs exact value to caller", () => {
    claimed = call("claim", stateOf(funded));
    onProofData("claim", claimed.proofData);
    const z = claimed.context.currentZswapLocalState;
    assert.equal(z.inputs.length, 1); assert.equal(z.outputs.length, 1);
    assert.equal(z.inputs[0].value, coin.value);
    assert.equal(z.outputs[0].coinInfo.value, coin.value);
    assert.deepEqual(z.outputs[0].coinInfo.color, coin.color);
    assert.equal(z.outputs[0].recipient.is_left, true);
    assert.deepEqual(z.outputs[0].recipient.left, receiver);
    assert.equal(ledger(stateOf(claimed)).spent.size(), 1n);
  });
  check("replay rejected against updated state", () => assert.throws(() => call("claim", stateOf(claimed))));
  for (const [name, p] of [
    ["wrong bearer", { ...ps, secret: bytes(6) }],
    ["changed amount", { ...ps, coin: { ...coin, value: 51n } }],
    ["changed nonce", { ...ps, coin: { ...coin, nonce: bytes(7) } }],
    ["changed asset", { ...ps, coin: { ...coin, color: bytes(8) } }],
  ]) check(`${name} rejected even with original membership path`, () => assert.throws(() => call("claim", stateOf(funded), { ...p, path: originalPath })));
  check("another deployment rejected with original membership path", () => assert.throws(() => call("claim", stateOf(funded), { ...ps, path: originalPath }, "09".repeat(32))));
  check("zero funding rejected", () => assert.throws(() => call("fund", initial, { ...ps, coin: { ...coin, value: 0n } })));
  check("unsupported funding asset rejected", () => assert.throws(() => call("fund", initial, { ...ps, coin: { ...coin, color: bytes(8) } })));
  check("stale path rejected after another deposit; refreshed path succeeds", () => {
    const saved = originalPath;
    const newer = call("fund", stateOf(funded), { ...ps, coin: { ...coin, nonce: bytes(10) } });
    assert.throws(() => call("claim", stateOf(newer), { ...ps, path: saved }));
    assert.equal(ledger(stateOf(call("claim", stateOf(newer)))).spent.size(), 1n);
  });
  const issuer = new Issuer({ issuerAuthority: ({ privateState: p }) => [p, p.secret], mintNonce: ({ privateState: p }) => [p, bytes(11)] });
  const mintInitial = issuer.initialState(createConstructorContext(ps, receiver)).currentContractState;
  const issue = (state, p = ps) => issuer.circuits.issue(createCircuitContext(address, receiver, state, p));
  check("separate issuer rejects wrong authority", () => assert.throws(() => issue(mintInitial, { ...ps, secret: bytes(12) })));
  check("separate issuer creates fixed supply once", () => {
    const minted = issue(mintInitial);
    onProofData("issue", minted.proofData);
    assert.equal(issuerLedger(stateOf(minted)).issued, true);
    assert.equal(minted.context.currentZswapLocalState.outputs[0].coinInfo.value, 1000000n);
    assert.throws(() => issue(stateOf(minted)));
  });
  return cases;
}
