# MoneyMole Level 1–6 audit

Observed 2026-09-27. **Highest fully passed: none. Submission-ready: no.**

All local engineering checks pass. Level 1 is technically ready, but its required
explicit README privacy section is fixed only locally and has not been published.
The no-push instruction is preserved. Levels 2–6 also lack real wallet acceptance;
Level 3 lacks organizer approval. Every partial/unverified included item fails
its Level. A local fix is not described as a published submission artifact.

Scope: [owner requirements](LEVEL-AUDIT-SCOPE.md). Excluded completely: videos,
hosted/live app links, screenshots, users and feedback. Product X was separately
deferred by the owner and does not affect these scoped verdicts. 1AM is accepted
in place of Lace. Level 6 uses 30 commits, the stricter checklist threshold.

## Verified evidence

- [Public repository](https://github.com/ianpurif/MoneyMole): public `main` at `1b3ed385c0fab85d0e96fd5f7ac9e69462d48d98`; 61 published commits.
- [CI run 36295888117](https://github.com/ianpurif/MoneyMole/actions/runs/36295888117): all steps passed on that revision. It includes clean install, audit, compilation, artifact checks, lint/types, unit/contract/integration tests, production build, browser checks and requirement consistency.
- [Commit audit](evidence/commit-audit.json): 35 reviewed meaningful commits already published. Audit/docs-only commits are not counted.
- [Fresh verification](evidence/level-verification.json): all four Compact compiles, artifact hashes, 38 unit / 13 contract / 20 integration cases, actual synthetic fund/claim/issue proof generation, browser CORS/indexer/RPC, dependency audit and issuer checks passed.
- [Earlier source-matched verification](evidence/local-verification.json): clean install, lint/types, build and 7 browser tests; all 115 bound source/config/test subjects remain identical. The fresh report distinguishes reused checks from newly executed ones.
- [Issuer record](../deployments/preprod/test-asset-issuer.json): `47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`, transaction `003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886`, finalized block `2716656`, verifier/source/runtime identity checked, `issued=false`. This is a test-asset issuer, not a verified payment escrow or working MVP.

## Level 1 — NOT PASSED

| Included requirement | Status | Exact evidence / limitation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public repository](https://github.com/ianpurif/MoneyMole) |
| Installed toolchain and compiling Compact contract | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [package.json](../package.json); [toolchain.lock.json](../toolchain.lock.json) |
| Passing test suite | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json) |
| Generated managed circuits and keys | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [managed/private-payments](../managed/private-payments); [managed/test-asset](../managed/test-asset) |
| Preview/Preprod contract with visible address | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [deployments/preprod/test-asset-issuer.json](../deployments/preprod/test-asset-issuer.json) — Issuer only; satisfies the generic Level 1 contract criterion. |
| Initial idea paragraph in README | SATISFIED | [README.md](../README.md); [Published README](https://github.com/ianpurif/MoneyMole/blob/1b3ed385c0fab85d0e96fd5f7ac9e69462d48d98/README.md) |
| Local setup instructions | SATISFIED | [README.md](../README.md); [docs/TOOLCHAIN.md](../docs/TOOLCHAIN.md); [docs/OWNER-TESTING.md](../docs/OWNER-TESTING.md) |
| README public state versus private witness explanation | PARTIAL | [README.md](../README.md); [contracts/private-payments.compact](../contracts/private-payments.compact) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publishing is prohibited in this task. |
| 5 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Added explicit privacy model, visible issuer address, verified installer commands and environment locations to README. Compiled all four targets using the actual project-local CI compiler installation and recorded test/artifact/issuer evidence.

## Level 2 — NOT PASSED

| Included requirement | Status | Exact evidence / limitation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public repository](https://github.com/ianpurif/MoneyMole) |
| 1AM connect/disconnect (accepted replacement) | PARTIAL | [src/lib/midnight/oneam.ts](../src/lib/midnight/oneam.ts); [src/components/wallet-panel.tsx](../src/components/wallet-panel.tsx); [tests/browser/shell.spec.ts](../tests/browser/shell.spec.ts) — Implementation and synthetic checks pass; both connections are owner-reported. Real disconnect/reconnect remains unobserved. |
| Successful frontend circuit invocation | UNVERIFIED | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [src/lib/midnight/issuer-issuance.ts](../src/lib/midnight/issuer-issuance.ts) — Deployed issuer constructor is not a successful exported circuit call. Issuer issue and payment fund/claim remain unexecuted. |
| Observable proven-but-not-shown behavior | PARTIAL | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [docs/disclosure-audit.md](../docs/disclosure-audit.md) — Synthetic fund/claim/issue proofs pass; actual frontend proof, sealed public effects and output destination binding remain unverified. |
| Verifiable Preprod contract address | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [deployments/preprod/test-asset-issuer.json](../deployments/preprod/test-asset-issuer.json) — The verified address is the separate issuer. |
| README privacy claim | PARTIAL | [README.md](../README.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publishing is prohibited in this task. |
| 8 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Documented precise witness/public-ledger boundary and limits without claiming unobserved privacy. Reverified live issuer canonical finality and synthetic proof generation.

## Level 3 — NOT PASSED

| Included requirement | Status | Exact evidence / limitation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public repository](https://github.com/ianpurif/MoneyMole) |
| Fully functional privacy dApp | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [docs/TESTING.md](../docs/TESTING.md) — No observed finalized payment-escrow deployment, funding, independent B credit/spend, replay rejection, real recovery/reconciliation or sealed-transaction disclosure review. |
| At least three passing tests | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json) — 38 unit, 13 contract and 20 integration cases pass; 7 browser cases passed against unchanged product source. |
| Workflow and actual passing remote CI | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [CI run](https://github.com/ianpurif/MoneyMole/actions/runs/36295888117) |
| Idea-list proposal submitted and approved | UNVERIFIED | [PROPOSAL.md](../PROPOSAL.md) — Draft exists; no submission receipt, applicable list entry or organizer approval was supplied. |
| Complete README and observer privacy model | PARTIAL | [README.md](../README.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publishing is prohibited in this task. |
| 10 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Independently verified the public repository and every successful step of its real CI run. Corrected unsupported idea-list wording; recorded the proposal as unsubmitted/unapproved.

## Level 4 — NOT PASSED

| Included requirement | Status | Exact evidence / limitation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public repository](https://github.com/ianpurif/MoneyMole) |
| Working MVP on Preprod with verifiable product address | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [src/lib/midnight/payment-deployment.ts](../src/lib/midnight/payment-deployment.ts); [docs/evidence/level-verification.json](../docs/evidence/level-verification.json) — No observed finalized payment-escrow deployment, funding, independent B credit/spend, replay rejection, real recovery/reconciliation or sealed-transaction disclosure review. The issuer address does not substitute for the payment escrow. |
| README, setup, usage and full documentation | PARTIAL | [README.md](../README.md); [docs/USAGE.md](../docs/USAGE.md); [docs/OWNER-TESTING.md](../docs/OWNER-TESTING.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publishing is prohibited in this task. |
| Passing pipeline in product repository | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [CI run](https://github.com/ianpurif/MoneyMole/actions/runs/36295888117) |
| 15 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Recorded real CI and deployment-role distinctions and fixed local documentation.

## Level 5 — NOT PASSED

| Included requirement | Status | Exact evidence / limitation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public repository](https://github.com/ianpurif/MoneyMole) |
| Same working Level 4 MVP extended | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [src/lib/private-state/indexed-db.ts](../src/lib/private-state/indexed-db.ts); [tests/integration/payment-records.test.ts](../tests/integration/payment-records.test.ts); [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) — Recovery, retry, QR, controlled spend and security improvements extend the same product. The working Level 4 baseline and real funded-history continuity remain unverified. |
| Updated documentation | PARTIAL | [README.md](../README.md); [docs/STATUS.md](../docs/STATUS.md); [docs/USAGE.md](../docs/USAGE.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publishing is prohibited in this task. |
| 20 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Audited existing reliability/security extensions and published commit diffs; did not manufacture new features or history to meet counts.

## Level 6 — NOT PASSED

| Included requirement | Status | Exact evidence / limitation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public repository](https://github.com/ianpurif/MoneyMole) |
| Same working Level 4 MVP extended | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [tests/integration/payment-records.test.ts](../tests/integration/payment-records.test.ts); [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) — Same product extends Level 4, but live acceptance and old funded-deployment continuity remain unverified. |
| Updated documentation | PARTIAL | [README.md](../README.md); [docs/STATUS.md](../docs/STATUS.md); [docs/PRIVACY.md](../docs/PRIVACY.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publishing is prohibited in this task. |
| 30 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Applied the stricter 30-commit checklist and verified 35 substantive commits already published.

## Configuration and architecture

The one-entry `.env.local` is intentional: `PROOF_SERVER_PORT=6300`. Reviewed
public endpoints, asset domain and issuer live in `config/preprod.json`; the
original issuer fingerprint lives under `deployments/preprod/`. Escrows are
generated in the browser after explicit authorization; public selection uses
`moneymole/current-escrow` in localStorage. Encrypted payment/admin recovery uses
IndexedDB `moneymole-private-v1`. No seed, private key or bearer secret is required
in an environment file. Next.js App Router/TypeScript/Tailwind, GET-only public
Route Handlers and server-only modules remain intact. Witnesses go directly from
the browser to the trusted loopback prover.

## Remaining owner actions

1. **Chrome / Wallet A:** unlock the existing issuer with the original private local passphrase; reconcile it; prepare and explicitly approve issuance of 1,000,000 test units in 1AM. Preserve the existing issuer identity.
2. **Chrome / Wallet A:** recover an existing compatible payment escrow, or explicitly approve its first deployment; export its public record. Fund 10 units and wait for canonical finality. Privately transfer the link/QR; close A.
3. **Brave / Wallet B:** independently connect with zero of this asset, privately open/scan the claim, unlock local recovery, prepare and approve claiming 10. Reconcile finality and wallet credit. Exercise disconnect/reconnect, reload and encrypted export/import without sending secrets to tools.
4. **Brave / Wallet B:** approve spending the 10 units back to A; verify B returns to zero, A receives them and replay is rejected. Complete remaining live negative cases and public disclosure/destination-binding checks in T01–T23. Tests requiring another transaction need their own explicit approval. Return only sanitized observations/public identifiers so the read-only deployment/Preprod/acceptance verifiers can finish.
5. Provide the actual idea-list reference and organizer submission/approval record. Authorize publication separately when ready; these local README/audit fixes have not been pushed. Product X remains owner-deferred.

The generic `verify:product` procedure also includes the broader T24 participation
gate. T24 is excluded from this Level audit; it is not counted as a blocker here.
Current `verify:deployment`, `test:preprod` and `verify:product` correctly return
blocked (2) because real escrow/payment/acceptance records are absent. No fake
manifest, synthetic payment or issuer constructor was substituted. Auxiliary
Codex-agent attestation and docs-MCP login are not Level/runtime requirements.
