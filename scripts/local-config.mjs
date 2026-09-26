import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { at, has } from "./lib.mjs";

/** Read only the public service setting; never copy wallet data into a process. */
export function proofServerPort(environment = process.env, read = path => has(path) ? readFileSync(at(path), "utf8") : "") {
  const value = environment.PROOF_SERVER_PORT ?? parseEnv(read(".env.local")).PROOF_SERVER_PORT ?? parseEnv(read(".env")).PROOF_SERVER_PORT ?? "6300";
  // Browser proving and CSP deliberately pin this trusted loopback endpoint.
  if (value !== "6300") throw new Error("PROOF_SERVER_PORT must be 6300 to match browser proving and CSP.");
  return 6300;
}
