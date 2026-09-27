import test from "node:test";
import assert from "node:assert/strict";
import { verifyDeploymentRuntimeDependencies as verifyAdditiveDependencies } from "../../scripts/deployment-dependencies.mjs";
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
test("additions cannot shadow an existing transitive deployment dependency", () => {
  const current = baseline();
  current.packages["node_modules/runtime/node_modules/helper"] = { version: "2.0.0" };
  assert.throws(() => verifyAdditiveDependencies(baseline(), current), /resolution/);
});

test("isolated development security updates do not change deployed runtime identity", () => {
  const previous = baseline(); previous.packages[""].devDependencies = { build: "1.0.0" };
  previous.packages["node_modules/build"] = { version: "1.0.0", dev: true, dependencies: { helper: "1.0.0" } };
  const current = structuredClone(previous); current.packages[""].devDependencies.build = "1.0.1";
  current.packages["node_modules/build"].version = "1.0.1";
  assert.equal(verifyAdditiveDependencies(previous, current), 2);
  // Shared transitive code stays protected, even if npm marked it dev-only.
  current.packages["node_modules/helper"].version = "1.0.1";
  assert.throws(() => verifyAdditiveDependencies(previous, current), /identity/);
});

test("changed peers, optional runtime packages and runtime demotion fail closed", () => {
  const previous = baseline(); previous.packages["node_modules/runtime"].peerDependencies = { peer: "1.0.0" };
  previous.packages["node_modules/peer"] = { version: "1.0.0", optionalDependencies: { optional: "1.0.0" } };
  previous.packages["node_modules/optional"] = { version: "1.0.0" };
  for (const change of [c => { c.packages["node_modules/peer"].version = "2.0.0"; }, c => { delete c.packages["node_modules/optional"]; }, c => { c.packages["node_modules/runtime"].dev = true; }]) {
    const current = structuredClone(previous); change(current);
    assert.throws(() => verifyAdditiveDependencies(previous, current));
  }
});
