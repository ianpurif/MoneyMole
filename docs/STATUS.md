# Current execution state

## Wallet selection, balances and focused actions — 2026-09-27

Connect now discovers supported API v4 wallets and offers explicit 1AM/Lace choices.
The debit card shows total native NIGHT and current DUST before encrypted records
are unlocked. Bounded reads refresh while visible every 15 seconds, on focus,
during reconciliation and after operation attempts. Unavailable totals are never
shown as zero, and changed wallet identity clears the old totals.

Unlock/passphrase guidance is a toast. Tools owns escrow creation/recovery and
encrypted payment import. Send owns funding/sharing/controlled spending; Receive
owns claims; Activity owns transaction history, receipts and recovery exports.
Existing encrypted storage, transaction finality and original issuer are preserved.

Fresh local checks passed: lint, types, production build, 57 unit tests, 25 contract
cases, 22 integration tests and 21 production browser checks. All five Compact
targets compiled; artifacts, synthetic local proofs, zero-finding dependency audit,
read-only original issuer and browser prover/indexer/RPC connectivity passed.
Evidence: docs/evidence/ui-cleanup-verification.json. No real wallet approval,
deployment or native NIGHT transfer was performed. Live deployment/product gates
still return 2 for missing owner-approved records; local fixtures are not acceptance.
After rebinding changed subjects, all 53 utility tests, offline consistency and
requirements/report checks passed. The stale initial evidence failure is resolved.

Publication and source-bound remote CI for this UI revision are pending.

Use http://localhost:3000, click Connect, choose your wallet and personally approve
Preprod to check real-extension behavior. No passphrase/seed belongs in chat.
No new deployment is needed to inspect wallet balances or this UI. The existing
manual NIGHT acceptance flow remains in docs/OWNER-TESTING.md.

Unrelated .codex/config.toml, REVISION.md and public/images/debit-card-bg.png were
left as found. Earlier checkpoints below describe their own revisions only.

## Wallet and card verification — 2026-09-27

The current application is http://localhost:3000. Wallet checks now distinguish
transient failures from confirmed session invalidation, and authorized 1AM sessions
survive client navigation. DUST readiness no longer determines connection success.
A full reload still requires an explicit Connect action: connector v4 has no passive
restore method. The separate private-workspace visibility/five-minute lock remains.

The centered main card has the requested heading and two-line copy, a branded
wallet surface containing Send/Receive/Activity and workspace controls, fixed outer
height, and internal scrolling. Switching actions resets the inner scroll position.

All final local results are recorded in docs/evidence/wallet-card-verification.json:
clean npm ci, zero audit findings, lint/types/build, 53 unit tests, 25 contract cases,
22 integration tests, 18 browser tests, five compiler targets, artifact validation,
synthetic proving and read-only original issuer verification. Browser CORS/prover,
indexer and RPC access passed at localhost; Windows HTTP reachability also passed.
53 utility checks and requirements/report validation passed after rebinding evidence.
These are engineering checks, not observed real 1AM or live NIGHT acceptance.

The preparation wrapper initially rejected stale evidence; the evidence/report
checks were corrected and rerun. Its custom Codex agent/MCP checks remain separate
auxiliary blockers; no subagents were delegated. TCP-only readiness, absent real
NIGHT deployment and live product acceptance continue to exit 2 as expected.

Published revision `6096bddab3cb9d70c9e9cebc171e5e8b67e55e6f` passed
[GitHub Actions 36324197091](https://github.com/ianpurif/MoneyMole/actions/runs/36324197091). Public immutable
source files matched Git. Evidence: docs/evidence/wallet-card-publication.json.
Following evidence-only commits preserve every checked subject. Historical migration
records remain intact and must not be treated as current source verification.

## Exact next owner action for this wallet fix

Open http://localhost:3000 in Chrome with 1AM, click Check for 1AM then Connect 1AM,
and personally approve Preprod. Observe the session while idle and after switching
focus or navigating home. Do not deploy or transfer funds for this connection check.
Only the in-app browser is exposed to this session's UI controls, so real extension
approval/stability remains unobserved. The new UI is open in the in-app preview.

Existing encrypted records at the former 127.0.0.1 origin were not changed; use the
existing encrypted export/import workflow if recovery must move to localhost.
See docs/USAGE.md. No wallet credentials, claim secrets or private records were read.
The original issuer/deployment and legacy namespaces remain preserved. Local
.codex/config.toml changes and REVISION.md predate this work and remain untouched.

## Historical checkpoints

The following sections describe earlier revisions and their own evidence only.
They do not override the localhost/session handoff above.

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
