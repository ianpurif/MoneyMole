import preprod from "../config/preprod.json" with { type: "json" };
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { at, has } from "./lib.mjs";

/** Read only the public service setting; never copy wallet data into a process. */
export function proofServerPort(environment = process.env, read = path => has(path) ? readFileSync(at(path), "utf8") : "") {
  const value = environment.PROOF_SERVER_PORT ?? parseEnv(read(".env.local")).PROOF_SERVER_PORT ?? parseEnv(read(".env")).PROOF_SERVER_PORT ?? new URL(preprod.proofServer).port;
  // Browser proving and CSP deliberately pin this trusted loopback endpoint.
  if (value !== new URL(preprod.proofServer).port) throw new Error("PROOF_SERVER_PORT must be 6300 to match browser proving and CSP.");
  return Number(value);
}
