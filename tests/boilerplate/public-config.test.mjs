import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import preprod from "../../config/preprod.json" with { type: "json" };
import { readJson } from "../../scripts/lib.mjs";

test("public Preprod configuration matches the preserved issuer and Compact asset", () => {
  const issuer = readJson("deployments/preprod/test-asset-issuer.json");
  assert.equal(preprod.network, "preprod");
  assert.equal(preprod.issuerAddress, issuer.address);
  assert.match(preprod.issuerAddress, /^[a-f0-9]{64}$/);
  const source = readFileSync("contracts/issuance/test-asset.compact", "utf8");
  assert(source.includes(`mintShieldedToken(pad(32, "${preprod.assetDomain}")`));
  assert.equal(preprod.proofServer, "http://127.0.0.1:6300");
  assert.equal(new URL(preprod.indexerHttp).origin, "https://indexer.preprod.midnight.network");
  assert.equal(new URL(preprod.indexerWs).origin, "wss://indexer.preprod.midnight.network");
  assert.equal(new URL(preprod.nodeRpc).origin, "https://rpc.preprod.midnight.network");
  assert.deepEqual(Object.keys(preprod).sort(), ["network", "issuerAddress", "assetDomain", "indexerHttp", "indexerWs", "nodeRpc", "proofServer"].sort());
});
