# Requirements report

Generated from `docs/requirements.json`. Edit the JSON, then run `npm run requirements:report`.

Engineering readiness and challenge qualification are separate. No score is inferred from file counts.

## Preparation

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| PREP-SOURCES | Source ledger and compatible-component research | implemented | None | Primary references, dates, conclusions and unresolved mappings are recorded. |
| PREP-CONTEXT | Self-contained Codex execution context | implemented | None | BUILD, task cards, ownership protocol, technical requirements and decisions are present and internally consistent. |
| PREP-LOCK | Real pinned dependency graph | verified | None | Generate registry-resolved package-lock.json, run npm ci and record exact installed versions. |
| PREP-SHELL | Next.js application foundation | implemented | PREP-LOCK | Application source, lint/typecheck, browser security checks and production build without fabricated payment behavior; current E2E remains owner-run. |
| PREP-CODEX | Client-validated model routing | blocked | None | Installed schema, trusted config, all requested model/effort pairs and custom-agent discovery are observed. |
| PREP-MCP | Midnight documentation MCP | blocked | None | Trusted client observes connection and tool listing; no private data is transmitted. |
| PREP-TOOLS | Bounded fail-closed tooling | verified | None | Dependency-free utility tests and missing-implementation guard checks pass in their stated scope; no product readiness inferred. |
| ARCH-STACK | Single Next.js frontend/backend and client-only secrets | implemented | None | Next.js App Router, TypeScript, Tailwind; Route Handlers in src/app/api/**/route.ts; appropriate non-secret Server Actions; server-only modules in src/lib/server/. No separate backend without a verified requirement. 1AM authorization, claim secrets, private witnesses and private-state handling never enter Next.js APIs. |

## Core gates

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| CORE-CONSERVATION | Real shielded conservation | implemented | None | Existing sender value is locked and exactly that value becomes receiver-spendable; claim never mints. |
| CORE-CLAIM | Independent receiver claim | implemented | CORE-CONSERVATION | Receiver initiates claim after sender disconnects; receives and spends the coin without sender browser state. |
| CORE-PRIVACY | Disclosure and linkability audit | blocked | CORE-CONSERVATION | Inspect circuit transcripts, outputs and implicit effects; no unintended public amount or participant mapping. |
| CORE-AUTH | Authorization and domain binding | implemented | None | Wrong secret, amount, asset, network, contract, nonce and destination substitution fail atomically. |
| CORE-REPLAY | Replay and concurrent claims | implemented | CORE-AUTH | At most one conflicting claim settles; unknown outcomes reconcile without duplicate submission. |
| CORE-LINK | Secret-bearing link and local QR | implemented | CORE-AUTH | At least 256 bits entropy; fragment-only client capture/scrub; strict bounded codec; local readable QR; no secret transmission. |
| CORE-STATE | Encrypted recoverable local state | implemented | None | Password/key handling, authenticated namespaces, reload/reconnect, corruption and migrations are tested. |
| CORE-TX | Transaction and receipt truth | implemented | None | Submission, inclusion, finality and wallet sync remain separate; imported receipts remain unverified until chain-bound. |
| CORE-FEES | Separate asset and fee readiness | implemented | None | Insufficient shielded asset, DUST, authorization, prover and indexer failures produce truthful recoverable states. |

## Level 1

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| L1-NODE | Node 22 | verified | None | Node 22 toolchain observed; host Node is distinct from Midnight node version. |
| L1-DOCKER | Docker toolchain | verified | None | Docker engine, Compose and pinned local proof image run; browser reachability is checked. |
| L1-CONTRACT | Payment-relevant Compact contract | verified | None | Actual payment and issuer contracts compile with the pinned Compact compiler. Live conservation and disclosure acceptance remain separate CORE requirements. |
| L1-TESTS | Passing contract tests | verified | L1-CONTRACT | Meaningful compiled-contract positive and negative tests pass. |
| L1-MANAGED | Generated circuits and keys | verified | L1-CONTRACT | Compiler-generated contract, circuits and proving/verification material exist with source/output hashes. |
| L1-DEPLOY | Verified deployment address | verified | L1-MANAGED | Durable Preview or Preprod deployment record binds address, finality and build to observed chain data. |
| L1-DOCS | Initial technical README | implemented | L1-CONTRACT | Setup, initial payment idea and accurate privacy explanation match implemented behavior. |
| L1-COMMITS | Five meaningful owner commits | verified | None | Inspect at least 5 substantive authorized development commits; do not fabricate history. |

## Level 2

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| L2-WALLET | 1AM connect and disconnect | implemented | None | Actual installed 1AM authorizes and disconnects in the frontend; no headless substitute counts. |
| L2-CIRCUIT | Real frontend circuit invocation | implemented | L2-WALLET, L1-DEPLOY | Frontend circuit call is authorized, submitted and finalized on the correct contract. |
| L2-PRIVACY | Observable documented privacy | implemented | CORE-PRIVACY, L2-CIRCUIT | Inspect public data for the actual circuit and document precisely what remains visible. |
| L2-STATE | Persistent private state | implemented | CORE-STATE | Encrypted state survives reload and wallet reconnect without crossing namespaces. |
| L2-PREPROD | Verified Preprod address | verified | L1-DEPLOY | Observed deployment is Preprod, not merely Preview. |
| L2-COMMITS | Eight meaningful owner commits | verified | None | Inspect at least 8 substantive authorized development commits. |

## Level 3

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| L3-APP | Functional private payment application | implemented | CORE-CLAIM, CORE-PRIVACY, CORE-LINK, CORE-STATE, CORE-TX, CORE-FEES, CORE-REPLAY, L2-PREPROD | Complete real funded link and independent claim pass with truthful privacy boundaries. |
| L3-TESTS | At least three meaningful tests | verified | L1-TESTS | At least three nontrivial product tests pass; utility-only tests do not satisfy this. |
| L3-CI | Push and pull-request compile/test workflow | implemented | L1-MANAGED, PREP-LOCK | Real remote pipeline installs from lockfile, compiles Compact, verifies artifacts, tests, lints, typechecks and builds. |
| L3-BUILD | Production build | implemented | L3-CI | Production application build succeeds with implemented payment routes. |
| L3-PROPOSAL | Product proposal | implemented | None | Truthful technical proposal describes this payment product and current readiness. |
| L3-APPROVAL | Payment-category eligibility approval | owner_pending | None | Actual organizer submission and approval for this product, with the applicable idea-list reference; a local proposal is not approval. |
| L3-COMMITS | Ten meaningful owner commits | verified | None | Inspect at least 10 substantive authorized development commits. |

## Level 4

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| L4-MVP | Working Preprod MVP | owner_pending | L3-APP, L2-PREPROD | Independent funded, claimed and spendable payment is verified on Preprod. |
| L4-DOCS | Setup and implemented usage documentation | implemented | L4-MVP | Documentation matches actual wallet, link, claim and recovery behavior. |
| L4-PIPELINE | Product repository pipeline | implemented | L3-CI | Successful actual run in the supplied product repository is recorded. |
| L4-ADDRESS | Verified product address | owner_pending | L2-PREPROD | Current address matches finalized deployed source/build and outstanding-payment history. |
| L4-X | Owner-supplied product X reference | owner_pending | None | Record only a supplied and externally checked product profile reference. |
| L4-COMMITS | Fifteen meaningful owner commits | verified | None | Inspect at least 15 substantive authorized development commits. |

## Level 5

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| L5-CONTINUITY | Extend the same product | implemented | L4-MVP | Document migration/reliability work without replacing the product or losing funded notes. |
| L5-DOCS | Maintained technical documentation | implemented | L5-CONTINUITY | Reliability, operating procedures and limitations remain current. |
| L5-PARTICIPANTS | Fifty real Preprod participants | owner_pending | None | Validate consented owner evidence for 50 real participants; deduplicated wallets alone are insufficient. |
| L5-COMMITS | Twenty meaningful owner commits | verified | None | Inspect at least 20 substantive authorized development commits. |

## Level 6

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| L6-CONTINUITY | Continue Preprod product | implemented | L5-CONTINUITY | Same product and preserved funded-deployment history on Preprod. |
| L6-HARDEN | Technical hardening and regression | implemented | L6-CONTINUITY, CORE-REPLAY, CORE-STATE | Full negative matrix, recovery, privacy and security checks pass. |
| L6-DOCS | Final technical documentation | implemented | L6-HARDEN | Architecture, usage, sources, risks and verified claims match actual behavior. |
| L6-PARTICIPANTS | Seventy total real Preprod participants | owner_pending | None | Validate consented owner evidence for 70 total real participants, not an invented additional-user target. |
| L6-COMMITS | Thirty meaningful owner commits conservatively | verified | None | At least 30 meaningful existing published development commits, applying the stricter supplied checklist threshold. |

## External metadata

| ID | Requirement | State | Dependencies | Acceptance |
|---|---|---|---|---|
| META-PUBLIC-REPO | Public repository | verified | None | Owner-supplied repository URL is independently checked for public access. |
| META-APP-URL | Verified application URL when supplied | owner_pending | None | Only record an actual supplied and checked application URL. |

## Source conflicts and external decisions

- **NETWORK-L6:** Use Preprod, not a sample Mainnet heading. Status: resolved_from_supplied_requirements.
- **PEOPLE-L6:** 70 total real participants; ignore conflicting sample table of 20. Status: resolved_from_supplied_requirements.
- **COMMITS-L6:** Use 30 from the stricter supplied checklist; 35 meaningful published commits were reviewed. Status: resolved_conservatively.
- **ELIGIBILITY:** Payment links remain the product; related Private Payroll / Splits wording does not establish approval. Status: owner_pending.

## Evidence policy

A verified item needs a dated command result, sanitized evidence-file digest, scope and source-file digests. Changed subjects invalidate verification. Participant counts, public metadata, meaningful commits and eligibility require separate owner-supplied evidence.
