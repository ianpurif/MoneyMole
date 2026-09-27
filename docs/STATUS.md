# Current execution state

## Native NIGHT engineering complete — 2026-09-27

The current product escrows native Preprod NIGHT, with DUST only for fees. It uses
six-decimal NIGHT entry, unshielded wallet balances/transfers, exact native
settlement checks, mm2 links and schema-v2 encrypted recovery. Issuer controls are
removed from the normal UI. NIGHT amounts/addresses are public; bearer secrets
remain client-side and go only to the trusted local prover for proofs (ADR 007).
Old issuer/escrow sources, original issuer identity and v1 browser stores are intact.

Fresh verification: clean npm ci, zero-finding dependency audit, 53 utility tests,
lint/types, production build, 46 unit, 25 compiled-contract (12 NIGHT + 13 legacy),
22 saved-record integration and 15 production-browser tests passed. All five
Compact targets compile and artifacts verify. Real synthetic constraints/proofs
and SDK NIGHT fund/claim proof serialization pass. Browser prover CORS and actual
Preprod indexer/RPC reads pass; the original issuer is still verified read-only.
Full source-bound details: docs/evidence/night-verification.json.

Published engineering revision b0827845fae8e98bf970dce9009252b7052d6b5b passed
GitHub Actions run 36319963556; public files matched immutable Git. Evidence:
docs/evidence/night-publication.json. Following commits update evidence/docs only.
The running production app is http://127.0.0.1:3000, prover http://127.0.0.1:6300.

The preparation wrapper exits 2 only for auxiliary Codex custom-agent attestation
and documentation MCP authentication. Those are not application/runtime blockers;
no agents were delegated. TCP-only services:check intentionally exits 2, while
actual proving passed. Deploy/verify-deployment/test-preprod/verify-product remain
blocked for missing real native NIGHT owner approvals and evidence, never passed.

## Exact next owner action

Chrome / Wallet A: refresh MoneyMole, connect 1AM on Preprod if requested, expand
Create / recover a payment escrow, enter a private local recovery passphrase,
and Prepare / unlock escrow. This is the new v2 NIGHT escrow, not the old issuer.
Personally approve escrow deployment in 1AM, then Check deployment until chain
verified and save public deployment/encrypted recovery exports. No token issuance.
After that: A funds 1 NIGHT; independent B claims and spends the same NIGHT back;
reconcile, replay/QR/reload/import verification and public receipts complete the
flow in docs/OWNER-TESTING.md. Live NIGHT acceptance remains unobserved and pending.

Local .codex/config.toml changes and untracked REVISION.md predate this migration
and remain untouched. All remaining sections are historical pre-NIGHT checkpoints,
not current wallet steps or evidence of native NIGHT acceptance.

## Frontend revision — 2026-09-27, local only

REVISION.md is implemented: product-first home, focused Send / Receive / Activity,
contextual unlock/recovery/issuer tools, logo-led visual system, responsive layouts,
short reduced-motion-aware transitions and customized Sonner feedback. The unchanged
nonce CSP passes production browser checks, including optimized logos and toasts.

Fresh validation: clean npm ci, zero-vulnerability audit, lint, types, production
build, 38 unit / 13 generated-contract / 20 integration / 15 production-browser
tests, all four Compact compiles, artifacts, real synthetic local proving,
browser prover/indexer/RPC connectivity and read-only issuer verification passed.
Desktop and mobile renders were inspected and refined across three visual passes.
Browser fixtures prove local UI/encryption only. The full report is
docs/evidence/revision-verification.json; design/QA notes are in
docs/FRONTEND-REVISION.md. The production preview runs at http://127.0.0.1:3000.

Nothing was pushed, following REVISION.md. Existing publication/CI records below
are historical and do not cover this local revision. L3-CI and L4-PIPELINE are
implemented, awaiting a permitted future remote run; L3-BUILD retains the same
CI prerequisite while its fresh local build is recorded as passed. No new Level
or live payment acceptance is claimed. verify:deployment, test:preprod and
verify:product still return 2 for absent real escrow/payment/acceptance records.

No wallet prompt was approved, deployment recreated, supply issued or live
transaction sent. Existing issuer identity and private recovery remain intact.
For future owner acceptance, follow the updated docs/USAGE.md: issuer administration
is now under Tools. The previous owner handoff below is historical.

## Previous published checkpoint

Snapshot: 2026-09-27T05:56:41.575Z. **Highest scoped Level passed: Level 1.**
All local application verification passed again. Levels 2–6 remain **NOT PASSED**
because actual independent-wallet payment/privacy/recovery acceptance is missing.
The owner excludes videos, hosted app links, screenshots, users/feedback, X and
unsupplied organizer approval. 1AM is accepted. These exclusions are not verified.

## Published work and CI

The README now presents the Level 1–6 evidence map, visible actual issuer and
transaction, complete setup/usage, public/private/proven model, architecture,
configuration, test commands, security/recovery and reviewed meaningful commits.
Public repository content was compared with immutable Git files at 056f41817d313189f96cc2505195965c51ecacbe.
CI run 36298455485 passed every step after the
clean-checkout ordering fix. The earlier f85fbd6 run failed because evidence checks
preceded generated ignored keys; reproduction and correction are recorded in
docs/evidence/ci-ordering-failure.json. Later audit-only commits are published and
checked separately; the README badge links current main. The owner authorizes
non-sensitive pushes to ianpurif/MoneyMole. No history rewrite is authorized.

## Fresh verification

See docs/evidence/submission-verification.json and publication-verification.json.
Clean npm ci, zero-finding audit, 53 utility tests, lint/types, 38 unit tests,
production build, 7 browser cases, all four Compact compiles, artifact verification,
13 generated-contract cases, 20 integration cases, real synthetic fund/claim/issue
proofs, browser CORS/indexer/RPC connectivity and read-only issuer finality passed.
Regenerated artifacts match the browser-tested build. Retry/recovery integration
uses the production saved-payment controller and real encryption, with synthetic
protocol boundaries; it does not establish real wallet acceptance.

The app is running at http://127.0.0.1:3000 and the trusted pinned prover at
http://127.0.0.1:6300. The preparation wrapper returns 2 only for auxiliary agent
attestation/docs-MCP authentication, neither a Level nor runtime requirement.
TCP-only services:check returns 2 by design. verify:deployment, test:preprod and
verify:product return 2 without real escrow/payment/acceptance records.

## Deployment and configuration

Existing Preprod issuer:
47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635

Deployment identifier:
003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886

Canonical finalized block 2716656; source, verifier and original runtime closure
match; issued=false. Do not deploy it again. No payment escrow acceptance record
has been supplied. .env.local intentionally contains only PROOF_SERVER_PORT=6300.
config/preprod.json owns public network/issuer/prover values. Public escrow choice
is moneymole/current-escrow in localStorage; encrypted recovery is in IndexedDB
moneymole-private-v1. No wallet secret belongs in an environment file or tool.

## Exact resume point

Computer Use was stopped by an automatic policy check because it could not
determine Chrome's current URL. No wallet UI was controlled or private storage
read. Chrome / Wallet A: open http://127.0.0.1:3000 and leave MoneyMole visible;
report that it is open so automation can resume at the actual page. The next owner
steps will be 1AM connection authorization if requested and private unlock of the
existing issuer recovery. Do not send any passphrase, backup, seed or private key.

Then prepare/approve the separate 1,000,000-unit issuance, recover/approve the
payment escrow, fund 10 in A, privately transfer its link/QR and close A. Independent
Wallet B in Brave begins with zero of the asset, claims 10, reconciles/reloads and
checks encrypted recovery, then approves spending 10 back to A. Check replay,
remaining live negatives and sealed disclosures. Each transaction requires the
owner's personal confirmation. Synthetic tests do not satisfy these observations.
