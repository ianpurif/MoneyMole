# MoneyMole

[![Engineering verification](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml)

**Sender-funded, single-use shielded payment links on Midnight Preprod, using 1AM.**
A sender escrows an exact amount of a shielded test asset, then privately shares a
bearer link or locally generated QR. An independent receiver proves authority to
claim the existing value once. Encrypted browser recovery preserves interrupted
work; chain reconciliation distinguishes submission, finality and wallet credit.
Claiming does not mint tokens. Test units are non-redeemable.

> Local frontend revision: focused Send / Receive / Activity, contextual tools and
> recovery, and a redesigned homepage. See [revision notes](docs/FRONTEND-REVISION.md)
> and [current local verification](docs/evidence/revision-verification.json).
> This revision is intentionally unpushed; the CI badge and publication evidence
> below cover the previously published revision.

## Verification at a glance

Evidence checked on **27 September 2026**. **Highest scoped Level passed: Level 1.** Local engineering verification passes;
**real independent-wallet payment acceptance is still pending**. A deployed issuer
is not proof that funding, claiming or receiver spending has succeeded.

| Item | Evidence / current boundary |
|---|---|
| Public project | [ianpurif/MoneyMole](https://github.com/ianpurif/MoneyMole) · [published history](https://github.com/ianpurif/MoneyMole/commits/main) |
| Network and primary wallet | Midnight **Preprod**, **1AM.xyz**, Connector API v4; 1AM accepted by the owner’s judge-confirmed instruction |
| Real deployed contract | Test-asset issuer below; canonical finality and deployed verifier checked against actual Preprod |
| Payment escrow | Implemented; no finalized public deployment record or real funding/claim/spend receipts supplied yet |
| CI | [Current main workflow](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml) · [verified publication and actual CI](docs/evidence/publication-verification.json); the badge is live, evidence snapshots identify the revision tested |
| Local evidence | [Current frontend verification](docs/evidence/revision-verification.json) · [Previous submission verification](docs/evidence/submission-verification.json) · [source-bound engineering evidence](docs/evidence/local-verification.json) |
| Meaningful history | [35 reviewed substantive published commits](docs/evidence/commit-audit.json), excluding audit/docs-only commits; every Level threshold is exceeded |
| Full requirement map | [Level audit](docs/LEVEL-AUDIT.md) · [authoritative requirement states](docs/requirements.json) |

## Deployed contracts and read-only verification

| Field | Verified test-asset issuer |
|---|---|
| Network | Preprod |
| Address | `47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635` |
| Deployment transaction identifier | `003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886` |
| Transaction hash | `46099aaecdb51aff8a37019825e8d7be27663a561f7f06a81c2c1a749b5a6107` |
| Finalized block | `2716656` |
| Recorded state | `issued=false`; deploying did not issue tokens |
| Identity | [Deployment fingerprint](deployments/preprod/test-asset-issuer.json), issuer Compact source, generated verifier and original runtime closure match |

After installation and compilation below, run:

```sh
npm run verify:issuer
```

This queries the official Preprod indexer and node, verifies the deployment
transaction and canonical finality, compares the deployed `issue` verifier and
preserves the recorded source/runtime identity. It writes sanitized observations
to `reports/issuer-deployment.json`. Reuse this issuer; never replace it on restart.

The **payment escrow** is a separate contract with `fund` and `claim` circuits.
Its deployment requires the owner’s 1AM confirmation. The app exports a public
record only after verification; no escrow address is invented in this README.
For a real exported record and actual transaction manifest, run:

```sh
npm run verify:deployment -- --record deployments/preprod/<actual-address>.json
npm run test:preprod -- --manifest reports/preprod-manifest.json
```

Replace the placeholder only with the app’s real public record. The manifest
contains `schemaVersion: 1`, `network: "preprod"`, `deploymentRecord`, and actual
`fundingId`, `claimId`, `spendId`. These commands do not sign or submit. Chain
activity alone does not prove private amount conservation or wallet independence.

## Level 1–6 evidence map

This pass follows the [owner-supplied Preprod checklist](docs/LEVEL-AUDIT-SCOPE.md).
Videos, hosted websites, screenshots, users/feedback, X and unsupplied organizer
approval are excluded for now. 1AM replaces Lace. Exclusion is not verification or
an assertion of full organizer acceptance. Level 6 uses the stricter **30** commits.

| Level | Included requirements and evidence | Current result |
|---|---|---|
| 1 | Exact installed toolchain; all four Compact targets compile; passing tests; generated circuits/keys; real issuer address and transaction above; initial idea, setup and public/private explanation here; public repository; ≥5 meaningful commits | **PASS** — required README sections and deployment evidence are public; [verified publication](docs/evidence/publication-verification.json) |
| 2 | [1AM connect/disconnect](src/lib/midnight/oneam.ts); [frontend circuit flows](src/lib/midnight/payments.ts); bounded privacy model below; real Preprod issuer; ≥8 meaningful commits | **NOT PASSED:** actual frontend circuit finality, installed-wallet disconnect/reconnect and live privacy behavior remain unverified |
| 3 | [Payment dApp](src/components/payment-workspace.tsx); 38 unit, 13 contract, 20 integration and 15 local browser checks; [workflow](.github/workflows/ci.yml) and actual passing runs; complete privacy model; ≥10 meaningful commits | **NOT PASSED:** independent-wallet payment acceptance remains pending; proposal/approval evidence is owner-excluded |
| 4 | Same Preprod product; setup/usage here; actual product CI; ≥15 meaningful commits | **NOT PASSED:** a working payment escrow and finalized funding/claim/spend evidence are still needed |
| 5 | Same product extended with encrypted recovery/import, reconciliation and safe failed-attempt retries; maintained docs; ≥20 meaningful commits | **NOT PASSED:** working Level 4 baseline and real funded-state continuity remain unverified |
| 6 | Same product with regression/security hardening, strict configuration and deployment preservation; maintained docs; 35 reviewed commits ≥30 | **NOT PASSED:** real payment/privacy/recovery acceptance remains unverified |

Local tests and synthetic proofs support implementation claims. They do not stand
in for a successful frontend transaction or an independently spendable receiver coin.

## Privacy model — public, private, proven

| Data / operation | Who can observe it? | What the implementation checks |
|---|---|---|
| `supportedAsset`, `notes` commitment tree, `spent` nullifier set | Public application ledger | Asset binding, commitment membership and single use |
| Issuer `issuerCommitment`, `issued` flag, fixed supply policy | Public issuer state/source | Correct issuer authority and one issuance of 1,000,000 test units |
| Funding coin, qualified escrow opening, claim authority and membership path | Browser and trusted local prover; bearer holder knows the claim opening | Witness knowledge, note/asset/deployment binding and exact existing-coin transfer |
| Bearer link / QR | Anyone given or able to capture it, including its creator | Bounded versioned encoding and integrity checks; sharing only after verified funding |
| Recovery records | Encrypted in the owner’s browser/backups; readable after local unlock | AES-GCM authentication, namespace isolation and conflict-safe persistence |
| Contract addresses, transaction timing/shape, nullifiers and protocol effects | Chain observers | Finality and native effects can be checked; timing/correlation remains possible |

The claim circuit proves knowledge of the authority opening a committed note and
checks that the note has not been spent. Raw bearer authority is not an application
ledger field. The sender funds an actual contract-owned shielded output; claiming
consumes existing value and has no mint path. The receiver output uses the connected
wallet’s shielded coin key.

**Evidence boundary:** generated-contract tests and real synthetic proof generation
exercise these constraints. Standard-library shielded helpers have explicit
disclosure annotations. Private witness parameters and empty exported arguments
alone do not prove every amount or relationship is hidden in a sealed transaction.
Real public-disclosure review, copied-proof destination binding and independent
wallet settlement remain pending. No verified end-to-end unlinkability or
amount-hiding claim is made. See the [disclosure analysis](docs/disclosure-audit.md).

Claim fragments are captured and removed locally; QR generation uses no remote QR
service. Wallet authorization, claim secrets, private witnesses and recovery never
enter Next.js APIs, Server Actions, server-rendered props, logs or telemetry. Proof
inputs go directly from the browser to the trusted loopback prover. A compromised
browser, extension or prover can expose them. A link is bearer authority; there is
no automatic refund or expiry. Losing both the opening and recovery can strand funds.

## Architecture and exact stack

| Layer | Implementation |
|---|---|
| Frontend and backend | Next.js **16.3.6 App Router**, React **19.3.0**, TypeScript **5.9.3**, Tailwind CSS **4.3.3** |
| HTTP backend | Public GET Route Handlers under `src/app/api/**/route.ts`; server-only modules under `src/lib/server/` with `import "server-only"` |
| Client authority | 1AM Connector API **4.0.1**; client-only wallet/payment/private-state modules |
| Contracts | Compact devtools **0.5.1**, compiler **0.31.1**, runtime **0.16.0**, Midnight.js **4.1.1**, ledger/proof server **8.1.0** |
| Persistence | Browser IndexedDB with AES-GCM, PBKDF2-SHA256 and authenticated network/contract/wallet/schema namespaces |
| Verification | Vitest, generated Compact runtime tests, Playwright, actual local proof generation and read-only chain verifiers |

One Next.js application serves frontend and backend. Server Actions are reserved
for appropriate validated, authorized non-secret mutations; current private flows
remain browser-only. No Express, NestJS, Fastify or separate application backend.
The trusted local proof server is a protocol tool. Exact dependency pins and
compatibility are in [package.json](package.json) and [toolchain.lock.json](toolchain.lock.json).

## Install and start locally

Prerequisites: **Node 22.16.0**, **npm 10.9.2**, Git, Docker Engine/Desktop with
Compose, and Linux/WSL2. On Windows use WSL for npm and Compact; Windows
`compact.exe` is unrelated. Do not mix Windows/Linux `node_modules`.

```sh
git clone https://github.com/ianpurif/MoneyMole.git
cd MoneyMole
node --version # v22.16.0
npm --version  # 10.9.2
cp -n .env.example .env.local
npm ci
node scripts/install-compact.mjs --approve-reviewed-installer
export PATH="$PWD/.local/compact/bin:$PATH"
export COMPACT_DIRECTORY="$PWD/.local/compact/artifacts"
npm run compile:contracts
npm run compile:issuance
npm run verify:artifacts
npm run services:up
npm run doctor
npm run dev
```

Open **http://127.0.0.1:3000**. Keep that exact origin across sessions so browser
recovery remains accessible. The prover runs at **http://127.0.0.1:6300**. The
reviewed installer is checksum-pinned and project-local. Re-export its PATH and
COMPACT_DIRECTORY in a new shell. Generated `managed/` code/circuits/prover/verifier
keys are Git-ignored and reproducibly compiled; they are public circuit material,
not wallet keys. Expected product circuits: `fund`, `claim`; separate issuer: `issue`.

For the production build instead of development mode:

```sh
npm run build
npm run start -- --port 3000
```

### Configuration and wallets

| Location | Contents / origin |
|---|---|
| `.env.local` | Only `PROOF_SERVER_PORT=6300`, copied from `.env.example`; intentionally no API keys, wallet secrets or private contract state |
| `config/preprod.json` | Reviewed public Preprod indexer/RPC/prover endpoints, existing issuer address and asset domain; shared by browser, CSP and scripts |
| `deployments/preprod/test-asset-issuer.json` | Original actual issuer deployment, transaction and build fingerprint |
| Browser escrow selection | Public `moneymole/current-escrow` localStorage key, populated from an approved deployment or entered verified address |
| Browser encrypted recovery | IndexedDB `moneymole-private-v1`, isolated per network/contract/wallet/schema |

Use **Wallet A in Chrome** and an **independent Wallet B in Brave**, each with 1AM
on Preprod and DUST for its own transaction fees. NIGHT is not the payment asset;
wallet DUST generation/funding is separate. There is no fixed DUST amount promised
for this sequence; inspect the wallet’s actual fee requests. B must begin with zero
of the test asset for controlled-spend attribution. Never enter a seed/private key
into MoneyMole. Each browser uses an owner-chosen recovery passphrase of at least
16 characters; keep it private and preserve the original passphrase for old records.

## Complete payment and recovery flow

Each **Approve** action requires a separate personal confirmation in 1AM.

1. **Chrome / A:** choose **Check for 1AM → Connect 1AM**. Expect Preprod connection
   and truthful DUST readiness. Open **Tools**, expand **Test asset issuer administration**, enter
   the original local recovery passphrase and **Prepare / unlock issuer deployment**.
   Confirm the recorded issuer address above; **Check deployment** reconciles it.
   Restore its encrypted backup if needed; do not deploy another issuer.
2. Choose **Prepare / recover issuance → Approve issuance of 1,000,000 test units**.
   After wallet approval, **Check issuance** must confirm finality and A’s actual
   shielded balance. Issuance is separate from deployment and every claim.
3. **Create / recover a payment escrow → Prepare / unlock escrow**. Reuse a
   compatible existing escrow; approve its first deployment only if none exists.
   **Check deployment**, then save its **public deployment record** and encrypted
   recovery. Expect a verified Preprod escrow before funding.
4. Enter that escrow and **Unlock payment workspace**. Under **Send**,
   enter **10** whole test units and **Save payment draft**. In **Activity**, use
   **Recovery & receipts** to save encrypted recovery, then
   **Prepare funding**, then **Approve funding of 10**. **Reconcile** until finalized.
   Sharing must remain unavailable until actual funding and coin qualification.
5. Generate/copy the private link or scan the local QR privately. Close A.
   **Brave / B:** connect 1AM, open the claim, confirm the fragment disappears,
   unlock the selected escrow and **Verify and save claim**. Expect an encrypted
   saved record for the existing funded note.
6. **Prepare claim → Approve claim of 10**. Reconcile chain finality and actual B
   credit. Reload, disconnect/reconnect, unlock and reconcile the same saved record.
   Export encrypted recovery and import into an empty matching namespace without
   deleting the original. Imported state must remain unverified until reconciliation.
7. In **Controlled spendability check**, enter A’s real Preprod shielded address
   and **Approve controlled spend of 10**. Expect finalized spend, B’s test balance
   back to zero and A credited. Reopen A: the original note is spent; replay must
   not pay twice. DUST is accounted separately.

Complete the real negative, interrupted-operation and disclosure cases in the
[acceptance matrix](docs/TESTING.md). Save only sanitized observations and public
receipts for verification; private links, openings and raw proof requests never
belong in Git or tool output. The [owner procedure](docs/OWNER-TESTING.md) defines
the public manifest and source-bound acceptance record.

## Recovery and security features

- Durable encrypted intent is saved before submission effects. Unknown outcomes
  reconcile the original identifier; they never authorize blind resubmission.
- Confirmed failed claims/spends have explicit retry controls after fresh canonical
  checks; prior attempts remain in encrypted history. Partial/stale outcomes fail closed.
- Recovery import is authenticated and atomic. Namespace and revision checks prevent
  cross-wallet mixing and concurrent overwrite. Hiding a tab or five minutes after
  unlock locks it; unlock and reconcile after an interrupted wallet prompt.
- Nonce CSP, strict client/server boundaries, bounded claim parsing, local QR and
  fragment scrubbing reduce accidental disclosure. Deployed verifier/runtime identity
  is preserved across tooling security patches. Dependency audit reports zero findings.
- [Tests](tests/integration/payment-records.test.ts) exercise the real saved-payment
  controller over real encryption with synthetic wallet/network boundaries. These
  regression checks remain distinct from real wallet recovery acceptance.

## Reproduce engineering verification

With the pinned environment and local prover running, execute serially:

```sh
npm run check:offline
npm run doctor
npm run compile:probe
npm run compile:coin-probe
npm run compile:contracts
npm run compile:issuance
npm run verify:artifacts
npm run lint
npm run typecheck
npm run test:unit
npm run test:contracts
npm run test:integration
npm run test:proving
npm run build
npm exec -- playwright install --with-deps chromium
npm run test:browser
npm run audit:deps
npm run requirements:check
npm run verify:issuer
```

Start the production app on port 3000 in another terminal, then run
`npm run verify:connectivity` for actual browser CSP/CORS and read-only Preprod access.
Playwright uses its own isolated production server on 3100 and synthetic wallets.
`test:proving` generates real proofs from synthetic inputs; do not run it alongside
an owner browser proof. `services:check` checks TCP only and deliberately returns
blocked (2); actual proving and browser connectivity are the readiness evidence.

[CI](.github/workflows/ci.yml) runs locked installation, dependency audit, pinned
Compact compilation, artifact verification, lint/types, unit/contract/integration
tests, production build, browser tests and requirement consistency. It has no
wallet credentials or permission to deploy. Actual Preprod acceptance is separate.
The clean-checkout ordering failure in run 36298220841 was reproduced and fixed by
compiling generated evidence subjects before validation. [Failure and fix](docs/evidence/ci-ordering-failure.json); the replacement run is in the publication evidence.
Missing real inputs cause `verify:deployment`, `test:preprod` and `verify:product`
to return blocked (2), never a fabricated pass. The generic product matrix retains
T24 participation; T24 is excluded from the current Level submission scope.

## Meaningful commit history

The [reviewed commit audit](docs/evidence/commit-audit.json) identifies **35**
substantive commits already published before this documentation pass, with full
hashes, changed files and reasons. Examples: [Compact payment contracts](https://github.com/ianpurif/MoneyMole/commit/5d5ccfd),
[1AM integration](https://github.com/ianpurif/MoneyMole/commit/378bbae),
[fund/claim/spend](https://github.com/ianpurif/MoneyMole/commit/2dd1cb0),
[encrypted recovery](https://github.com/ianpurif/MoneyMole/commit/88765f6),
[saved-record retries](https://github.com/ianpurif/MoneyMole/commit/972b879),
[security patches](https://github.com/ianpurif/MoneyMole/commit/df2d7a4), and
[public configuration](https://github.com/ianpurif/MoneyMole/commit/ac5566f).
Counts exceed 5 / 8 / 10 / 15 / 20 / 30 without counting this audit or inventing history.

[Architecture](docs/ARCHITECTURE.md) · [Product](docs/PRODUCT.md) ·
[Privacy](docs/PRIVACY.md) · [Usage](docs/USAGE.md) · [Current status](docs/STATUS.md) ·
[Build specification](BUILD.md) · [Technical proposal](PROPOSAL.md)
