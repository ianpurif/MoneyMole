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

Use Node 22.16.0 and npm 10.9.2 on Linux/WSL2 with Docker Compose available.
Install dependencies and the reviewed, pinned project-local Compact toolchain:

```sh
cp -n .env.example .env.local
npm ci
node scripts/install-compact.mjs --approve-reviewed-installer
export PATH="$PWD/.local/compact/bin:$PATH"
export COMPACT_DIRECTORY="$PWD/.local/compact/artifacts"
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

The existing **Preprod test-asset issuer** address is:

```text
47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635
```

Its finalized deployment transaction identifier is
`003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886`.
Run `npm run verify:issuer` to verify its canonical finality, deployed verifier,
source and runtime identity. This issuer has not issued tokens. It is a separate
contract from the payment escrow; real escrow deployment and payment acceptance
remain pending. Do not treat this address as an already functioning payment MVP.

`.env.local` intentionally needs only `PROOF_SERVER_PORT=6300`. Public Preprod
endpoints, issuer address and asset domain live in `config/preprod.json`. The
browser creates escrow addresses after an approved deployment and remembers the
selected public address in localStorage. Encrypted recovery stays in IndexedDB.

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

## Privacy model: public state and private witnesses

The payment contract's public application ledger contains `supportedAsset`, the
`notes` commitment tree and the `spent` nullifier set. The separate issuer exposes
an `issuerCommitment` and one-time `issued` flag. A chain observer can see those
values, contract activity, transaction timing/shape and public protocol effects.
These metadata can permit correlation; anonymity is not guaranteed.

Private witnesses supply the funding coin, qualified escrow coin, claim authority
and Merkle membership path. Claim links carry bearer authority and coin information
inside the URL fragment; the browser captures and removes it. The browser and
trusted local proof service process these inputs. They never enter Next.js APIs,
server-rendered props or telemetry. The encrypted store also contains recovery
records; its passphrase must remain with the owner.

The claim circuit checks knowledge of the authority for a committed note and
checks single use, while moving the escrowed shielded value to the claimant. Local
generated-contract tests and real synthetic proofs exercise those constraints
without putting raw claim authority in the application's public ledger. A public
commitment does not reveal that secret by itself. Circuit calls use the standard
library's explicit disclosure and shielded transfer helpers; private witness
parameters alone do not prove that every amount or participant relationship is
hidden in the final transaction. A real sealed transaction/disclosure review and
independent-wallet payment remain unverified. This README makes no verified
end-to-end amount-hiding or unlinkability claim yet.

Link holders (including the sender), the local browser and trusted prover know
more than a chain observer. A compromised browser, wallet extension or prover
can expose secrets. Exported encrypted backups still require strong passphrases.

## Project context

- [BUILD](BUILD.md), [AGENTS](AGENTS.md), [PLANS](PLANS.md): resumable scope and owner rules.
- [ARCHITECTURE](docs/ARCHITECTURE.md), [PRODUCT](docs/PRODUCT.md): implementation and invariants.
- [RUNBOOK](docs/RUNBOOK.md), [TESTING](docs/TESTING.md): commands and acceptance matrix.
- [Requirements](docs/REQUIREMENTS.md): generated from authoritative JSON.

Public repository: [ianpurif/MoneyMole](https://github.com/ianpurif/MoneyMole).
[Engineering verification run 36295888117](https://github.com/ianpurif/MoneyMole/actions/runs/36295888117)
passed for commit `1b3ed38`; it covers local engineering checks, not live wallet
acceptance. Later local audit/documentation changes require owner-authorized
publication and their own remote run. No push is authorized for this task.

The [Level audit](docs/LEVEL-AUDIT.md) applies the owner's exclusions and records
remaining real-wallet acceptance, organizer approval and publication requirements.
The owner will provide the product X profile separately; no profile is fabricated.
