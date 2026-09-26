# MoneyMole

Sender-funded, single-use shielded payment links on Midnight Preprod. The
implementation includes 1AM wallet integration, funding, local claim links/QR,
receiver claims, settlement reconciliation, controlled spending and encrypted
browser recovery.

**Local setup and application verification pass; real wallet E2E remains pending.**
Compilation, artifact checks, lint, types, unit/contract/integration/browser suites,
production build, local synthetic proving and read-only issuer verification passed.
The local app and prover are running. Wallet approvals remain manual; local fixtures
do not establish real payment acceptance. See [current status](docs/STATUS.md).

## Run locally

Use Node 22.16.0 and npm 10.9.2 on Linux/WSL2. Install the reviewed Compact toolchain
as described in [TOOLCHAIN](docs/TOOLCHAIN.md), then:

```sh
cp -n .env.example .env.local
npm ci
npm run compile:contracts
npm run compile:issuance
npm run services:up
npm run dev
```

Open http://127.0.0.1:3000 in the browser containing 1AM on Preprod. Keep the origin
identical across sessions so encrypted IndexedDB records remain available.
The local proof service uses loopback port 6300. A previously running production
build must be rebuilt and restarted before it includes these changes.

Follow [USAGE](docs/USAGE.md) and [OWNER-TESTING](docs/OWNER-TESTING.md).
The existing issuer is recorded in
[deployments/preprod/test-asset-issuer.json](deployments/preprod/test-asset-issuer.json);
reuse it. Deployment did not issue tokens. Every deployment, issuance and live
transaction requires a separate explicit wallet approval.

## Stack and privacy

One Next.js App Router application provides frontend and backend, with TypeScript
and Tailwind CSS. Public HTTP APIs are GET Route Handlers under
`src/app/api/**/route.ts`. Server-only modules live in `src/lib/server/`.
Server Actions are unnecessary for the current browser-only mutations; use them
only for appropriate non-secret operations. No Express, NestJS, Fastify or separate
application backend is used. A new backend requires a verified technical need and ADR.

1AM authorization, claim secrets, private witnesses and private state remain
client-side. Proof inputs go directly to the trusted loopback prover, never
Next.js. No seed phrase or private key is requested. Claim fragments are captured
and removed locally, and QR images are generated in the browser.

A link is bearer authority: anyone holding it can claim, including its creator.
There is no automatic refund or expiry. Losing the link and encrypted recovery
can strand funds. Test units are non-redeemable; DUST covers fees separately.
Privacy and unlinkability require [disclosure review](docs/PRIVACY.md).

## Project context

- [BUILD](BUILD.md), [AGENTS](AGENTS.md), [PLANS](PLANS.md): resumable scope and owner rules.
- [ARCHITECTURE](docs/ARCHITECTURE.md), [PRODUCT](docs/PRODUCT.md): implementation and invariants.
- [RUNBOOK](docs/RUNBOOK.md), [TESTING](docs/TESTING.md): commands and acceptance matrix.
- [Requirements](docs/REQUIREMENTS.md): generated from authoritative JSON.

Logical changes are committed locally. No push is authorized. Remote CI,
participation evidence and external qualification remain separate owner-pending
requirements; file counts, local tests and wallet addresses do not establish them.
