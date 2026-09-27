# M5 — Harden, verify and report technical readiness

State: all local application checks passed and sanitized evidence is current. Real wallet acceptance, remote CI, consented participation and external qualification remain pending. The preparation wrapper returns blocked for custom-agent/schema session attestation and documentation MCP authentication; requested model/effort availability is verified.

The work below specifies required behavior and acceptance. The current BUILD.md directive authorizes autonomous local setup and verification; complete all automatable work before requiring manual wallet actions.

**Lead:** architect; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
docs/TESTING.md, docs/requirements.json, docs/PRIVACY.md, docs/RUNBOOK.md, docs/EVIDENCE.md, prior milestone evidence

## Stack constraints
Use Next.js App Router, TypeScript and Tailwind CSS for the single frontend/backend
application. HTTP APIs: `src/app/api/**/route.ts`; server-only modules:
`src/lib/server/` with `import "server-only"`. Server Actions are limited to
appropriate non-secret UI mutations. No Express, NestJS, Fastify or separate
backend without a verified requirement and ADR. 1AM authorization, claim secrets,
private witnesses and private-state handling stay client-side and never enter
Next.js APIs or Server Actions. Follow `docs/ARCHITECTURE.md` for the trust boundary.

## Prerequisites
For verified acceptance, M1–M4 product gates must be observed. External metadata, participant evidence, repository permissions and approval are independently owner-pending.

## Owned files and interfaces
tests/, scripts/product/verify-acceptance.mjs, .github/workflows/ci.yml, docs/, README.md, PROPOSAL.md

Assign explicit non-overlapping subsets before delegation; no worker may edit all paths merely because this task lists them.

## Concrete work
1. Complete every applicable negative and recovery row in TESTING.md. Keep deterministic, integration, real proving and live Preprod reports separate. No empty or skipped suite passes. Repeat real independent-wallet acceptance after relevant changes.
2. Complete disclosure/secret-leak review, production browser security checks and receiver spendability evidence. Assess residual timing, shape, fee, prover and compromised-client risks; narrow privacy claims to observations.
3. Finish pinned CI Compact installation after M0 records verified installer metadata. CI must npm ci, compile real contracts, validate artifacts, lint, typecheck, run unit/contract/integration/browser tests and build on push/PR. Live network mutation must use a separate explicit owner-authorized procedure, not untrusted PR code.
4. Inspect real remote pipeline results only when supplied/authorized. Record actual run identifier and source commit; a local workflow file is not a completed remote run. Create concise local commits after each meaningful logical change; inspect history without rewriting it. Remote pushes require separate authorization.
5. Validate only consented real owner-supplied participant records. The included signed-attestation integrity utility does not establish unique humans or re-query chain activity. Complete any required chain-backed adapter against exact SDK types; keep sensitive associations outside Git. Do not invent participation.
6. Reconcile every requirement, conflict and external metadata field. Maintain proposal approval pending until supplied, Preprod for L6, 70 total real participants and conservative 30-commit target. Separate readiness from complete challenge qualification.
7. Update README, USAGE, architecture, sources and remaining risks. Produce a technical acceptance report with exact commands/outcomes, hashes, evidence, blockers and next action.

## Commands — repository root
Entry points are implemented. Run all local commands under the current owner authorization. Missing real wallet inputs remain blocked; complete independent checks.

```sh
npm run compile:contracts
npm run verify:artifacts
npm run lint
npm run typecheck
npm run test:unit
npm run test:contracts
npm run test:integration
npm run test:proving
npm run test:browser
npm run test:preprod -- --manifest reports/preprod-manifest.json
npm run build
npm run verify:product -- --acceptance reports/owner-acceptance.json
npm run requirements:report
npm run requirements:check
npm run history:inspect
```

## Acceptance
Expected: all applicable engineering checks have current, scoped evidence; external dependencies stay pending unless actually verified. Do not declare complete challenge qualification from a product test pass.

## Failure and resume
Reopen any invalidated milestone after code/network/toolchain changes. Keep unsupported evidence explicitly pending. Do not lower thresholds, generate participants or weaken tests to create a green report.

## Evidence and requirement updates
docs/evidence/M5-acceptance.json, docs/requirements.json, reviewed public deployment record; sensitive participation records remain private

Relevant IDs: L3-TESTS, L3-CI, L3-BUILD, L4-DOCS, L4-PIPELINE, L5-CONTINUITY, L5-DOCS, L6-CONTINUITY, L6-HARDEN, L6-DOCS. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.
