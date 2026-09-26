import test from "node:test";
import assert from "node:assert/strict";
import { proofServerPort } from "../../scripts/local-config.mjs";

test("local service config shares .env.local precedence with Next", () => {
  const read = path => path === ".env.local" ? 'PROOF_SERVER_PORT="6300" # local override\n' : "PROOF_SERVER_PORT=6301\n";
  assert.equal(proofServerPort({}, read), 6300);
  assert.throws(() => proofServerPort({ PROOF_SERVER_PORT: "6301" }, read), /must be 6300/);
});
test("service configuration fails closed on ports incompatible with browser proving", () => {
  for (const value of ["", "6301", "NaN", "0", "http://remote.invalid"]) {
    assert.throws(() => proofServerPort({}, () => `PROOF_SERVER_PORT=${value}\n`), /must be 6300/);
  }
  assert.equal(proofServerPort({}, () => ""), 6300);
  assert.equal(proofServerPort({}, path => path === ".env" ? "PROOF_SERVER_PORT=6300\n" : ""), 6300);
});
