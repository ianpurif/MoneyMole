import "server-only";
import preprod from "../../../config/preprod.json";

/** No wallet, claim or private-state input is accepted by this module. */
export function contentSecurityPolicy(nonce: string, development: boolean): string {
  if (!/^[A-Za-z0-9+/=]{24,64}$/.test(nonce)) throw new Error("Invalid CSP nonce");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${[preprod.indexerHttp, preprod.indexerWs, preprod.nodeRpc, preprod.proofServer].map(url => new URL(url).origin).join(" ")}${development ? " ws://127.0.0.1:3000 ws://localhost:3000 ws://127.0.0.1:3100 ws://localhost:3100" : ""}`,
    "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'",
    "form-action 'self'", "frame-src 'none'",
  ].join("; ");
}
