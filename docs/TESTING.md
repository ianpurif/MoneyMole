# Acceptance matrix

The implementation is complete, but final live acceptance is not observed. The
agent now runs all automatable checks; real wallet approvals remain manual. The pure amount,
requirement-validation and attestation-integrity tests are utility tests, not
payment acceptance. `tests/unit` is the installed Vitest execution layer;
`tests/boilerplate` can run on Node 22 without npm dependencies.

| ID | Scenario | Layers | Required observation |
|---|---|---|---|
| T01 | Actual value conservation | contract, proving, live | Sender/escrow/receiver native NIGHT amounts reconcile; claim has no mint; DUST accounted separately. |
| T02 | Independent receiver | live, actual 1AM | Sender context unavailable; B obtains and spends the funded NIGHT. |
| T03 | Wrong secret | unit, contract, proving | Claim rejected; funded value remains unchanged. |
| T04 | Tampered amount/asset | codec, contract, proving | No substituted color or amount can settle. |
| T05 | Wrong network/contract | contract, live | Cross-domain and cross-deployment claim cannot consume a note. |
| T06 | Wrong note/path/balance | contract, proving | Membership binds the funded NIGHT note and escrow has enough native balance. |
| T07 | Destination substitution/copied proof | proving, live | Copied proof cannot redirect the receiver output. |
| T08 | Duplicate/concurrent claims | contract, live | At most one settlement and one receiver output; rejected competitor is not a success. |
| T09 | Zero/negative/overflow/precision | unit, contract | Invalid amounts fail at the appropriate boundary; no float math. |
| T10 | Insufficient asset or DUST | integration, live | Separate truthful readiness and recoverable failure; no false funded state. |
| T11 | Rejected connection/signing | integration, actual 1AM | No synthetic authorization; preserved local intent. |
| T12 | Prover unavailable/wrong service | integration, proving, browser | Bounded error, no fallback to an arbitrary remote prover. |
| T13 | Stale indexer/RPC disconnect | integration, live | Unknown/stale distinct from finalized and wallet-synced. |
| T14 | Interrupted submission | integration, live | Reconcile original identifier; no blind re-fund or re-claim. |
| T15 | Reconnect/reload/account switch | unit, integration, browser | Encrypted namespaces remain isolated and recoverable. |
| T16 | Malformed/oversized claim payload | unit, browser | Strict bounds and schema rejection, no raw payload logging. |
| T17 | Corrupted ciphertext/wrong unlock | unit, browser | Authenticated failure without destroying original data. |
| T18 | Imported receipt | integration, browser | Remains local/unverified until actual contract/transaction matches. |
| T19 | Explicit and implicit disclosures | compiled audit, proving, live | Public NIGHT amounts/addresses are expected; no bearer authority, nonce or decrypted recovery leaks. This does not establish hidden-amount privacy. |
| T20 | Fragment and QR privacy | browser, network inspection | No secret to server/resources/referrer; scrubbed address; local QR round trip with measured bounds. |
| T21 | State migration/concurrent tab | unit, integration | Atomic writes and safe old-version isolation/recovery; no lost funded intent. |
| T22 | Old deployment continuity | integration, live | NIGHT deployments remain usable after reload; legacy token stores are preserved and rejected by v2, with historical revision retained for their recovery. |
| T23 | CI source/artifact identity | local, actual remote CI | Pinned graph, compiled outputs and tested source hashes match real run. |
| T24 | Participation evidence | local trusted review | Local attestation verification and wallet/human distinction; real participants are excluded from current scoped audit. |

## Layer boundaries
Deterministic tests may mock adapters only within test fixtures. Contract tests
exercise compiled circuits rather than a hand-written simulation of the rules.
Integration tests exercise real adapter boundaries where available and label any
isolated mocks. Real proving tests use actual generated keys and the trusted local
service. Live Preprod acceptance additionally observes chain finality and wallet
credit/spendability. A browser test with a mock wallet does not prove 1AM works.

Product suite entry points are implemented under `scripts/product/`; see
`OWNER-TESTING.md` for required real manifests and owner-reviewed evidence.
They must reject absent or empty test globs and skipped necessary cases. Record
which checks are deterministic, proving, live or owner-observed. Test data is
synthetic only inside isolated test fixtures; never count it as real participation.

## Evidence hygiene
Do not capture raw claim fragments, witness requests, wallet secrets, unlocked
private state or payment relationships. Extract assertions and hashes into sanitized
technical evidence. Keep sensitive raw verification material local and outside Git.
The verifier reports incomplete coverage explicitly instead of weakening acceptance.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.

## Current local scope

NIGHT contract tests execute compiled code; legacy cases are regression only.
Production saved-record integration uses real AES-GCM and fake IndexedDB with
synthetic wallet/network/proving boundaries. Browser tests use the production
build with an explicitly synthetic 1AM fixture. Real local proving tests both
circuit constraints and SDK fund/claim transaction construction/proof serialization.
None signs, seals or submits a real NIGHT payment. Current results are recorded in
STATUS.md and docs/evidence/night-verification.json when completed.
