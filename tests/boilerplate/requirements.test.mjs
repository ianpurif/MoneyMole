import test from "node:test";
import assert from "node:assert/strict";
import { validateRequirements, renderRequirements } from "../../scripts/requirements.mjs";
const base = () => ({ schemaVersion: 1, conflicts: [], requirements: [{ id: "TEST-A", level: "Synthetic test only", title: "Rule", status: "not_started", dependsOn: [], acceptance: "Observed assertion", evidence: [] }] });
test("pending requirement is not falsely verified", () => assert.equal(validateRequirements(base()).requirements[0].status, "not_started"));
test("verified requires actual evidence", () => { const data = base(); data.requirements[0].status = "verified"; assert.throws(() => validateRequirements(data), /evidence/); });
test("duplicate IDs rejected", () => { const data = base(); data.requirements.push({ ...data.requirements[0] }); assert.throws(() => validateRequirements(data), /duplicate/); });
test("unknown dependencies rejected", () => { const data = base(); data.requirements[0].dependsOn = ["MISSING-A"]; assert.throws(() => validateRequirements(data), /Unknown/); });
test("cyclic dependencies rejected", () => { const data = base(); data.requirements[0].dependsOn = ["TEST-A"]; assert.throws(() => validateRequirements(data), /Cyclic/); });
test("unsupported status rejected", () => { const data = base(); data.requirements[0].status = "done_maybe"; assert.throws(() => validateRequirements(data)); });
test("report generation is deterministic", () => assert.equal(renderRequirements(base()), renderRequirements(base())));

test("table delimiters are escaped in derived reports", () => { const data = base(); data.requirements[0].title = "A | B"; assert.ok(renderRequirements(data).includes("A \\| B")); });
test("verification cannot skip a prerequisite", () => {
  const data = base();
  data.requirements.push({ ...data.requirements[0], id: "TEST-B", status: "verified", dependsOn: ["TEST-A"], evidence: [{ result: "passed", scope: "synthetic_fixture", command: "test", path: "fixture-only.json", sha256: "a".repeat(64), observedAt: "2026-01-01T00:00:00Z", subjects: [{ path: "fixture-only.ts", sha256: "b".repeat(64) }] }] });
  assert.throws(() => validateRequirements(data), /Unverified prerequisite/);
});
