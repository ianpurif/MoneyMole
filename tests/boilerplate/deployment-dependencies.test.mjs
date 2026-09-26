import test from "node:test";
import assert from "node:assert/strict";
import { verifyAdditiveDependencies } from "../../scripts/deployment-dependencies.mjs";
const baseline = () => ({ lockfileVersion: 3, packages: { "": { dependencies: { runtime: "1.0.0" } }, "node_modules/runtime": { version: "1.0.0", integrity: "sha512-fixture", dependencies: { helper: "1.0.0" } }, "node_modules/helper": { version: "1.0.0", dev: true } } });
test("additive UI packages and dev promotion preserve deployment dependencies", () => {
  const current = baseline(); current.packages[""].dependencies.qrcode = "1.5.4";
  current.packages["node_modules/qrcode"] = { version: "1.5.4" };
  delete current.packages["node_modules/helper"].dev;
  assert.equal(verifyAdditiveDependencies(baseline(), current), 2);
});
test("changed integrity, dependency edges and removed packages fail closed", () => {
  for (const change of [c => { c.packages["node_modules/runtime"].integrity = "changed"; }, c => { c.packages["node_modules/runtime"].dependencies.helper = "2.0.0"; }, c => { delete c.packages["node_modules/helper"]; }, c => { c.packages[""].dependencies.runtime = "2.0.0"; }]) {
    const current = baseline(); change(current);
    assert.throws(() => verifyAdditiveDependencies(baseline(), current));
  }
});
