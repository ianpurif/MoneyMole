# Current execution state

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
