import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

/** Public compiler outputs only. No wallet input, private files or arbitrary paths. */
export async function publicArtifact(contract: string, kind: string, circuit: string) {
  const circuits: Record<string, readonly string[]> = { "test-asset": ["issue"], "private-payments": ["fund", "claim"] };
  const kinds: Record<string, string> = { verifier: "keys", prover: "keys", bzkir: "zkir" };
  if (!Object.hasOwn(circuits, contract) || !circuits[contract]?.includes(circuit) || !Object.hasOwn(kinds, kind)) return null;
  const bytes = await readFile(join(process.cwd(), "managed", contract, kinds[kind]!, `${circuit}.${kind}`));
  return { bytes, digest: createHash("sha256").update(bytes).digest("hex") };
}
