import assert from "node:assert/strict";
import { posix } from "node:path";

function resolvedPackage(packages, from, name) {
  let directory = from;
  while (true) {
    const candidate = `${directory ? `${directory}/` : ""}node_modules/${name}`;
    if (packages[candidate]) return candidate;
    if (!directory) return undefined;
    directory = posix.dirname(directory);
    if (directory === ".") directory = "";
  }
}

/** Preserve the deployed runtime closure, while permitting build/test security patches.
 * Do not trust npm's dev flag: a package shared with runtime is protected too.
 */
export function verifyDeploymentRuntimeDependencies(previous, current) {
  assert.equal(current.lockfileVersion, previous.lockfileVersion);
  assert(previous.packages && current.packages);
  const pending = [];
  for (const kind of ["dependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(previous.packages[""]?.[kind] ?? {})) {
      assert.equal(current.packages[""]?.[kind]?.[name], version, "A deployment dependency changed");
      const oldPath = resolvedPackage(previous.packages, "", name);
      assert(oldPath, "A deployment root is unresolved");
      assert.equal(resolvedPackage(current.packages, "", name), oldPath, "A deployment root moved");
      pending.push(oldPath);
    }
  }
  const checked = new Set();
  while (pending.length) {
    const path = pending.pop(); if (checked.has(path)) continue;
    checked.add(path);
    const oldEntry = previous.packages[path];
    const newEntry = current.packages[path];
    assert(newEntry, "A deployment dependency was removed");
    // npm may promote an identical package from dev-only to production use.
    const { dev: oldDev, ...oldIdentity } = oldEntry;
    const { dev: newDev, ...newIdentity } = newEntry;
    assert(oldDev === newDev || (oldDev === true && newDev === undefined), "A runtime dependency became dev-only");
    assert.deepEqual(newIdentity, oldIdentity, "A deployment dependency identity or graph changed");
    for (const name of Object.keys({ ...oldEntry.dependencies, ...oldEntry.optionalDependencies, ...oldEntry.peerDependencies })) {
      const dependency = resolvedPackage(previous.packages, path, name);
      assert.equal(resolvedPackage(current.packages, path, name), dependency, "An added package changed deployment dependency resolution");
      if (dependency) pending.push(dependency);
    }
  }
  assert(checked.size > 0, "An empty runtime closure is not a deployment baseline");
  return checked.size;
}
