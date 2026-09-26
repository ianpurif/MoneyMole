# M2 — Complete contract, domain and encrypted state

State: implementation complete. Contract adapters, exact claim codec, durable transactions, encrypted storage and atomic recovery imports are connected to the product. Funded recovery and negative cases remain subject to owner testing; historical synthetic tests are not current live acceptance.

The work below specifies required behavior and acceptance. The current BUILD.md directive authorizes autonomous local setup and verification; complete all automatable work before requiring manual wallet actions.

**Lead:** engineer; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
docs/PRODUCT.md, docs/ARCHITECTURE.md, docs/PRIVACY.md, docs/TESTING.md, M1 evidence, src/domain/

## Stack constraints
Use Next.js App Router, TypeScript and Tailwind CSS for the single frontend/backend
application. HTTP APIs: `src/app/api/**/route.ts`; server-only modules:
`src/lib/server/` with `import "server-only"`. Server Actions are limited to
appropriate non-secret UI mutations. No Express, NestJS, Fastify or separate
backend without a verified requirement and ADR. 1AM authorization, claim secrets,
private witnesses and private-state handling stay client-side and never enter
Next.js APIs or Server Actions. Follow `docs/ARCHITECTURE.md` for the trust boundary.

## Prerequisites
The versioned candidate is implemented under the owner directive. M1 live results gate verified acceptance, not coding. Changes to cryptographic encoding must preserve older funded deployments.

## Owned files and interfaces
contracts/, src/domain/, src/lib/private-state/, src/lib/midnight/, tests/unit/, tests/contracts/, tests/integration/, scripts/product/test-integration.mjs

Assign explicit non-overlapping subsets before delegation; no worker may edit all paths merely because this task lists them.

## Concrete work
1. Complete tested witnesses and contract methods around the validated slice. Keep issuance separated, define asset precision/maxima and reject zero/overflow. Expand negative cases for all commitment bindings, change handling and transaction retries.
2. Implement explicit payment and transaction state machines. Require chain-derived observations at trust transitions; persist pre-funding intent and submission identity. Unknown outcomes must block resubmission until reconciled.
3. Implement authenticated encrypted local persistence with reviewed password KDF, random AEAD nonces, authenticated namespace and no co-persisted decryption key. Provide explicit unlock, auto-lock behavior, encrypted recovery export/import and atomic schema migrations. Benchmark and record KDF parameters; never use a public wallet identity as a secret.
4. Implement a compact versioned claim codec using the M1 exact cryptographic encoding. Strictly bound length, integers, field tags and required fields. Plan client fragment capture; no server parsing or generic URL logging.
5. Add corrupted-data, cross-wallet/cross-contract namespace, interrupted writes, concurrent-tab coordination, reload/reconnect, invalid amount and stale-receipt tests. Distinguish local imported data from verified observations. Keep storage secrets out of test reports.

## Commands — repository root
Entry points are implemented. Run all local commands under the current owner authorization. Missing real wallet inputs remain blocked; complete independent checks.

```sh
npm run compile:contracts
npm run test:unit
npm run test:contracts
npm run test:integration
npm run lint
npm run typecheck
```

## Acceptance
Expected: deterministic invariants pass; migration/recovery preserves funded intent; invalid ciphertext fails closed; no wallet namespace mix; no false funded/claimed transition. These tests do not independently establish live payment acceptance.

## Failure and resume
Keep failing encrypted records intact for recovery; never overwrite corruption with a fresh empty store. Revisit ADR before changing persistent encoding. Invalidate old evidence if protocol/serialization changes.

## Evidence and requirement updates
docs/evidence/M2-core.json, reports/ reviewed summaries, docs/adr/004-private-state.md

Relevant IDs: CORE-STATE, CORE-TX, CORE-AUTH, CORE-REPLAY, L1-TESTS, L2-STATE. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.

Local recovery follow-up: TransactionJournal now persists opaque intent and recovery
state together in encrypted storage. Five integration tests cover response loss,
competing tabs, pre-submit failure, acknowledgment-write failure and malformed
records. Tests use fake IndexedDB and synthetic callbacks; the newer product controller implements submission and reconciliation, with live results still unverified. Restored states are explicitly unverified.
