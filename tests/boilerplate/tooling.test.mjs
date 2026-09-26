import test from "node:test";
import assert from "node:assert/strict";
import { at, ROOT, run } from "../../scripts/lib.mjs";
test("repository file paths cannot escape", () => assert.throws(() => at("../outside")));
test("root path is stable independently of caller cwd", () => assert.equal(at("."), ROOT));
test("unsupported product command fails rather than passes", () => { const result = run(process.execPath, ["scripts/product.mjs", "not-a-supported-action"]); assert.equal(result.status, 1); });
test("bounded command captures execution failure", () => assert.equal(run("not-a-real-private-payments-command", [], { timeout: 1000 }).ok, false));
