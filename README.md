# Private Payments

A product-specific development foundation for a **sender-funded, single-use shielded
payment link on Midnight Preprod**. Working label only; payment features are not yet
implemented. The repository contains a truthful Next.js shell and the self-contained
Codex execution workflow that builds the product from this starting state.

> Read and execute BUILD.md.

## Current status — read first
The genuine npm lockfile and installed Next/SDK graph are present. The application
builds and provides explicit client-only 1AM connection controls. Encrypted local
storage and transaction recovery guards have deterministic tests. Nonce-based CSP
is checked against the production app. Compact diagnostics compile; they are never
payment destinations. No product contract, funded link, claim, deployment or real
wallet payment has been verified. M1 live feasibility remains the product gate.

See `docs/PREPARATION-REPORT.md` for checks actually run and `docs/STATUS.md` for
current blockers. A source or utility check passing is not product acceptance.

## Start in your repository
Extract this directory into an empty working directory, including hidden `.codex`,
`.agents` and `.github` folders. Use Node 22.16.0/npm 10.9.2 on Linux or WSL2. Review
project configuration and open the repository in Codex. Approve normal project trust
only after review; reopen the session if required. Do not change global settings.

```sh
npm run check:offline
npm run bootstrap
npm run verify:boilerplate
npm run dev
```

Bootstrap preserves the registry-resolved lockfile and installs with npm ci.
Full preparation remains blocked on the required Codex model/MCP checks. WSL service commands now reuse the installed
Windows Docker Desktop Compose CLI when the native plugin is unavailable. The exact
Codex instruction above executes BUILD.md and continues through unblocked milestones.

## Intended product and privacy boundary
Connect -> fund a real shielded asset -> verify funding -> share local link/QR ->
independent receiver claims -> verify finality, credit and spendability. Claiming
must consume existing funded value, never mint a replacement. The first implementation
milestone proves this with two wallets after the sender disconnects.

The link is a bearer capability, including for its creator. There is no automatic
refund, expiry or recovery. A lost secret may leave funds inaccessible. Test assets
are explicitly non-redeemable; NIGHT and DUST are not substitutes for the shielded
payment asset. Amount privacy and participant unlinkability are requirements to
validate, not properties this shell establishes. See `docs/PRIVACY.md`.

## What is present
A single Next App Router/TypeScript/Tailwind shell with a source-owned shadcn-style
button; client-only 1AM discovery/connection; integer amount and recovery helpers;
encrypted IndexedDB with authenticated namespaces and revision conflicts; bounded fail-closed scripts;
three exact-model Codex agent definitions; four focused skills; six executable task
cards; structured requirements/evidence states; threat model and gated architecture;
local utility, storage, wallet-fixture and production-browser tests; candidate
payment and separate test-issuer contracts with 13 generated-runtime cases and
three local circuit proof generations. Remaining integration/deployment/live
acceptance commands intentionally block until implemented. No payment is live.

## Context map
- `BUILD.md`, `PLANS.md`, `AGENTS.md`: execution, ownership and resume protocol.
- `docs/PRODUCT.md`, `ARCHITECTURE.md`, `PRIVACY.md`: scope, protocol hypotheses and invariants.
- `docs/requirements.json`: authoritative IDs/status/evidence; readable report is generated.
- `docs/TOOLCHAIN.md`, `SOURCES.md`, `RUNBOOK.md`: version evidence, commands and recovery.
- `docs/TESTING.md`, `EVIDENCE.md`: exact verification scope and sensitive-record boundaries.
- `docs/tasks/`: prerequisites, interfaces, role ownership, commands, recovery and evidence per milestone.

## Qualification and repository history
Level 6 uses Preprod and 70 total real participants. Plan conservatively for 30
meaningful owner commits pending source-conflict confirmation. Product eligibility,
public repository metadata, supplied product references, remote pipeline runs and
real participant evidence remain pending unless observed. Meaningful changes are committed separately under standing owner authorization.
History rewrites and pushes require separate authorization; a numeric count alone proves little.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.
