import "server-only";

/** No wallet, claim or private-state input is accepted by this module. */
export function contentSecurityPolicy(nonce: string, development: boolean): string {
  if (!/^[A-Za-z0-9+/=]{24,64}$/.test(nonce)) throw new Error("Invalid CSP nonce");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' https://indexer.preprod.midnight.network wss://indexer.preprod.midnight.network https://rpc.preprod.midnight.network http://127.0.0.1:6300${development ? " ws://127.0.0.1:3100 ws://localhost:3100" : ""}`,
    "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'",
    "form-action 'self'", "frame-src 'none'",
  ].join("; ");
}
