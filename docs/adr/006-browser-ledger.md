# 006 — Browser ledger and public compiler artifacts

The pinned ledger-v8 and onchain-runtime-v3 browser entry points import WebAssembly.
Use Next.js webpack with async WebAssembly enabled and modern-browser async-function
output. Production CSP permits `wasm-unsafe-eval` for these modules, while continuing
to prohibit JavaScript `unsafe-eval` and inline scripts without a nonce. This is a
project policy for required cryptography, not a browser/global permission change.

`GET /api/artifacts/[contract]/[kind]/[circuit]` serves only allowlisted compiler
verifier/prover keys and ZKIR. These are public compilation outputs, not wallet keys.
The server module is under `src/lib/server/`; arbitrary filesystem paths and writes
are unsupported. Generated outputs must pass `verify:artifacts` before use.

Issuer authority and maintenance keys are generated in the browser and encrypted
locally before wallet authorization. Only public artifact names reach Next.js.
Deployment proving must contain no circuit proof request; an unexpected request
fails closed. The connector balances the reviewed deployment after the owner's
button click, and the client checks its address and initial state before submission.

Reference: [MDN script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).
