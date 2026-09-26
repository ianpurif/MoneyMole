import assert from "node:assert/strict";

/** An existing deployment survives additive UI dependencies, never runtime changes. */
export function verifyAdditiveDependencies(previous, current) {
  assert.equal(current.lockfileVersion, previous.lockfileVersion);
  assert(previous.packages && current.packages);
  for (const kind of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(previous.packages[""]?.[kind] ?? {})) {
      assert.equal(current.packages[""]?.[kind]?.[name], version, "A deployment dependency changed");
    }
  }
  let checked = 0;
  for (const [path, oldEntry] of Object.entries(previous.packages)) {
    if (!path) continue;
    const newEntry = current.packages[path];
    assert(newEntry, "A deployment dependency was removed");
    // npm may promote an identical package from dev-only to production use.
    const { dev: oldDev, ...oldIdentity } = oldEntry;
    const { dev: newDev, ...newIdentity } = newEntry;
    assert(oldDev === newDev || (oldDev === true && newDev === undefined), "A runtime dependency became dev-only");
    assert.deepEqual(newIdentity, oldIdentity, "A deployment dependency identity or graph changed");
    checked++;
  }
  assert(checked > 0, "An empty lockfile is not a deployment baseline");
  return checked;
}
