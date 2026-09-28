import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import preprod from "../../config/preprod.json" with { type: "json" };
import { readJson } from "../../scripts/lib.mjs";

test("public Preprod configuration matches the preserved issuer and Compact asset", () => {
  assert.deepEqual(preprod.paymentAsset, { symbol: "NIGHT", kind: "unshielded", decimals: 6, protocolVersion: 2 });
  const issuer = readJson("deployments/preprod/test-asset-issuer.json");
  const escrow = readJson("deployments/preprod/night-payment-escrow.json");
  assert.equal(preprod.network, "preprod");
  assert.equal(preprod.issuerAddress, issuer.address);
  assert.equal(preprod.paymentEscrowAddress, escrow.address);
  assert.equal(escrow.network, "preprod");
  assert.equal(escrow.asset, "NIGHT");
  assert.match(preprod.issuerAddress, /^[a-f0-9]{64}$/);
  const source = readFileSync("contracts/issuance/test-asset.compact", "utf8");
  assert(source.includes(`mintShieldedToken(pad(32, "${preprod.assetDomain}")`));
  assert.equal(preprod.proofServer, "http://127.0.0.1:6300");
  assert.equal(new URL(preprod.indexerHttp).origin, "https://indexer.preprod.midnight.network");
  assert.equal(new URL(preprod.indexerWs).origin, "wss://indexer.preprod.midnight.network");
  assert.equal(new URL(preprod.nodeRpc).origin, "https://rpc.preprod.midnight.network");
  assert.deepEqual(Object.keys(preprod).sort(), ["network", "issuerAddress", "paymentEscrowAddress", "assetDomain", "indexerHttp", "indexerWs", "nodeRpc", "proofServer", "paymentAsset"].sort());
});
