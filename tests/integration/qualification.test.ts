import { expect, it } from "vitest";
import { ZswapChainState, ZswapOutput, ZswapOffer } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { qualifyEscrowCoin } from "../../src/lib/midnight/feasibility/qualify-escrow";
const contract = "01".repeat(32);
const coin = { nonce: "02".repeat(32), type: "03".repeat(32), value: 7n };
function fixture() {
  const output = ZswapOutput.newContractOwned(coin, undefined, contract);
  // Synthetic state application is NOT a ledger-valid balanced transaction.
  const [state, indices] = new ZswapChainState().tryApply(ZswapOffer.fromOutput(output));
  const mtIndex = indices.get(output.commitment);
  if (mtIndex === undefined) throw new Error("Synthetic output missing");
  return { state: state.postBlockUpdate(new Date("2026-09-26T00:00:00Z")), observations: [{ contract, commitment: output.commitment, mtIndex }] as const };
}
it("qualifies a contract opening from public commitment/index and native tree", () => {
  const f = fixture();
  expect(qualifyEscrowCoin(contract, coin, f.observations, f.state)).toEqual({ ...coin, mt_index: 0n });
});
it("rejects missing, ambiguous, changed and wrong-contract observations", () => {
  const f = fixture();
  for (const observations of [[], [...f.observations, ...f.observations], [{ ...f.observations[0], contract: "04".repeat(32) }]]) {
    expect(() => qualifyEscrowCoin(contract, coin, observations, f.state)).toThrow("could not be qualified");
  }
  expect(() => qualifyEscrowCoin(contract, { ...coin, value: 8n }, f.observations, f.state)).toThrow();
});
it("rejects a made-up index and a tree without the coin", () => {
  const f = fixture();
  expect(() => qualifyEscrowCoin(contract, coin, [{ ...f.observations[0], mtIndex: 9n }], f.state)).toThrow();
  expect(() => qualifyEscrowCoin(contract, coin, f.observations, new ZswapChainState())).toThrow();
});
