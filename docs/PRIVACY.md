# Privacy and threat model

**Goal, not an established property:** authorized, funded, single-use settlement
without unintended public amount disclosure or a direct sender-receiver mapping.
The preparation shell proves none of this. Shielded assets do not automatically
make an application's arguments, transcripts, storage or traffic private.

## Adversaries and remaining visibility

| Observer | Potentially visible | Required control and residual risk |
|---|---|---|
| Chain observer | Contract, transaction timing/shape, fees, public state, nullifiers and disclosed effects | Audit arguments, outputs and library effects; small activity sets and timing may still link transactions. |
| Application host | Page requests and delivered JavaScript; can maliciously replace code | No fragment delivery to server; reproducible build and strong client policy reduce risk but cannot make a compromised host harmless. |
| RPC/indexer operator | IP, queried transaction/contract and timing | Never query with openings; request correlation may still reveal interest in a payment. |
| Proof provider | Witnesses and circuit inputs according to the proving protocol | Local trusted service by default. A remote prover is a confidentiality boundary, not an interchangeable public API. |
| Link holder | Authority and private payload amount/asset | Bearer semantics; anyone holding the link can compete. Sender can retain a copy. |
| Compromised browser/extension | Unlocked secrets, clipboard, local state and wallet interactions | No browser-side protection defeats a fully compromised endpoint. Minimize copies, lock promptly, isolate resources. |

## Disclosure review
For every circuit, maintain `docs/disclosure-audit.md` with each explicit
`disclose()`, exported return, public ledger write, transaction input/output and
standard-library side effect. Record the exact expression, data origin, recipient
of visibility, necessity, expected public representation, negative leakage test
and actual inspected evidence. Start the file when real circuits exist; do not
fill it with a pretend completed audit.

Funding must not disclose a raw opening through a helper merely to satisfy the
compiler. The official asset tutorial deliberately reveals fields for illustration;
that is not permission to copy its disclosure pattern into this payment protocol.
Runtime-generated transcripts and actual public chain data must be inspected. [S10]

## Link and local-state invariants
Claim authority uses at least 32 bytes of CSPRNG entropy. URL fragments are read in
the client only and scrubbed after secure capture. No query/path secrets, remote QR
service, external scripts/fonts, analytics, server rendering of secrets or raw error
logging. The initial shell contains no secret-bearing routes. Its baseline headers
are not a complete secret-handling policy; M3 must implement a nonce-based CSP and
verify production plus development behavior without disabling browser protections.

Local persistence needs authenticated encryption, isolated wallet/network/contract
namespaces, explicit unlock, corruption handling and secure recovery. Wallet address
is a public identifier, never a password. Keys must not be stored with ciphertext.
A private record imported from disk is unverified until bound to actual chain data.

## Security properties to falsify
Wrong secret, tampered amount/asset/network/contract/coin nonce, destination
substitution, copied proof and replay must fail without losing value. Concurrent
claims must not create two outputs. Sender balance before and after funding,
escrowed value and receiver spendable coin must support conservation. Fee changes
must be separated from payment-asset changes. A fresh token minted on claim is a
failed payment implementation, not a workaround.

Public funding/claim correlation is not solved by a private amount alone. Review
commitment/nullifier construction, accumulator membership and coin helper effects.
The proposed protocol is gated; root-history choices and wallet authorization
assumptions require installed-type/compiler and live evidence. `ownPublicKey()` is
not sufficient authorization on its own. [S10, S11]

## Prover/browser boundary
Bind the container only to loopback. Verify the actual browser's access to the
configured prover, CORS, secure-context and local-network rules. A TCP listener
proves neither service identity nor working zero-knowledge proofs. Do not invent a
health route, use a permissive browser flag, or send witnesses to an arbitrary
endpoint to bypass a connection error. M1/M3 must test the supported 1AM prover
configuration and distinguish wallet proving from application proving. [S8, S13]

## Evidence and claim language
No raw witnesses, links, private state or payment relationships in public evidence.
Use sanitized test results and hashes of locally retained records. Participant
evidence stays outside Git and must not expose private payment relationships.
Explain residual metadata risks. Never promise universal anonymity, intended-
recipient exclusivity or recovery that the implementation does not provide.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.
