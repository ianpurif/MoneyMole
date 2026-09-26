import "server-only";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
export async function paymentBuildMetadata() {
  const digest = async (path: string) => createHash("sha256").update(await readFile(join(process.cwd(), path))).digest("hex");
  const [sourceHash, buildHash, toolchainHash] = await Promise.all([digest("contracts/private-payments.compact"), digest("managed/private-payments/contract/index.js"), digest("toolchain.lock.json")]);
  return { schemaVersion: 1, sourceHash, buildHash, toolchainHash };
}
