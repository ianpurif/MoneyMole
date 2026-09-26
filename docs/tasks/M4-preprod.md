# M4 — Finalize durable Preprod operation

State: browser deployment/recovery and read-only chain verification are implemented. The issuer is recorded; no payment escrow has yet been observed. New network actions require explicit owner approval and existing deployments must be reused.

The work below specifies required behavior and acceptance. The implementation-first directive in BUILD.md takes precedence: the owner will execute final testing; do not pause coding at an unobserved live gate.

**Lead:** engineer; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
docs/ARCHITECTURE.md, deployments/README.md, deployments/record.schema.json, docs/RUNBOOK.md, prior M1 deployment records

## Stack constraints
Use Next.js App Router, TypeScript and Tailwind CSS for the single frontend/backend
application. HTTP APIs: `src/app/api/**/route.ts`; server-only modules:
`src/lib/server/` with `import "server-only"`. Server Actions are limited to
appropriate non-secret UI mutations. No Express, NestJS, Fastify or separate
backend without a verified requirement and ADR. 1AM authorization, claim secrets,
private witnesses and private-state handling stay client-side and never enter
Next.js APIs or Server Actions. Follow `docs/ARCHITECTURE.md` for the trust boundary.

## Prerequisites
Validated contract build and explicit owner authorization for any network change. Reuse existing compatible deployments; no session-based automatic redeployment.

## Owned files and interfaces
scripts/product/deploy-preprod.mjs, scripts/product/verify-deployment.mjs, src/lib/midnight/payment-network.ts, src/lib/midnight/payment-deployment.ts, deployments/, tests/preprod/, docs/RUNBOOK.md

Assign explicit non-overlapping subsets before delegation; no worker may edit all paths merely because this task lists them.

## Concrete work
1. Inspect durable deployment records and actual Preprod chain state. Bind source, generated build and toolchain hashes. Validate address/transaction encoding with the installed SDK, not a guessed regex. Reuse the existing contract where valid.
2. Implement bounded deployment with explicit network-change authorization, safe wallet handling and atomic metadata write after observed finality. A pending/unknown deployment must reconcile rather than deploy again. Preserve older funded contracts.
3. Verify finality, deployed code identity and supported network; store actual transaction and block details. Distinguish indexer freshness from node finality and wallet synchronization.
4. Test RPC disconnect, stale indexer, prover outage, rejected signing, fee shortage and response loss at every boundary. Preserve pre-funding intent and never blindly resubmit. Expose actionable sanitized diagnostics.
5. Verify actual end-to-end funding and receiver spendability against the recorded deployment. Document retained addresses, compatibility/migration rules and local proving setup.

## Commands — repository root
Entry points are implemented. These commands are for the owner testing handoff; do not execute app/E2E suites during the current coding-only pass. Missing real inputs remain blocked.

```sh
npm run verify:deployment -- --record deployments/preprod/<address>.json
npm run deploy:preprod
npm run verify:deployment -- --record deployments/preprod/<address>.json
npm run test:preprod -- --manifest reports/preprod-manifest.json
npm run test:integration
```

## Acceptance
Expected: matching Preprod address/build/finality record, recoverable interrupted transactions and no loss of older funded notes. The deployment command is run only when an authorized deployment is actually needed.

## Failure and resume
An unknown deployment result is not absence. Query/reconcile before retry. If the current record is wrong, preserve it as disputed, inspect source/chain evidence and repair deliberately. Do not publish private payment records to prove deployment.

## Evidence and requirement updates
deployments/preprod/<actual-address>.json, docs/evidence/M4-preprod.json

Relevant IDs: L1-DEPLOY, L2-PREPROD, L4-MVP, L4-ADDRESS, CORE-TX, CORE-FEES. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.
