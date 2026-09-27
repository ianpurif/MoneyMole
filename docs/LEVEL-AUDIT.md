# MoneyMole Level 1–6 audit

Observed 2026-09-27T05:39:02.709Z. **Highest fully passed: none yet. Submission-ready: no.**

This report applies the current [owner scope](LEVEL-AUDIT-SCOPE.md). Videos, hosted
websites, screenshots, users/feedback, X and unsupplied organizer approval are
excluded; 1AM replaces Lace. These items are deferred, not verified. Level 6 uses
the stricter 30-commit checklist. All included criteria need actual evidence.
The owner now authorizes completed non-sensitive publication to ianpurif/MoneyMole.

## Shared evidence

- [Public repository](https://github.com/ianpurif/MoneyMole) and [actual CI snapshots](evidence/github-verification.json). The dynamic README badge links current main status.
- [35 reviewed meaningful published commits](evidence/commit-audit.json), excluding audit/docs-only work.
- [Compiler, test, proving and live issuer checks](evidence/level-verification.json). Real synthetic proofs are distinct from wallet settlement.
- [Issuer deployment](../deployments/preprod/test-asset-issuer.json): Preprod address `47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`, identifier `003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886`, finalized block 2716656. This is an issuer, not the payment escrow.

## Level 1 — NOT PASSED

| Requirement | Status | Evidence / remaining observation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole) |
| Installed toolchain and compiling Compact contract | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [package.json](../package.json); [toolchain.lock.json](../toolchain.lock.json) |
| Passing test suite | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json) |
| Generated managed circuits and keys | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [managed/private-payments](../managed/private-payments); [managed/test-asset](../managed/test-asset) |
| Preview/Preprod contract with visible address | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [deployments/preprod/test-asset-issuer.json](../deployments/preprod/test-asset-issuer.json) — Issuer only; satisfies the generic Level 1 contract criterion. |
| Initial idea paragraph in README | SATISFIED | [README.md](../README.md); [Public evidence](https://github.com/ianpurif/MoneyMole/blob/1b3ed385c0fab85d0e96fd5f7ac9e69462d48d98/README.md) |
| Local setup instructions | SATISFIED | [README.md](../README.md); [docs/TOOLCHAIN.md](../docs/TOOLCHAIN.md); [docs/OWNER-TESTING.md](../docs/OWNER-TESTING.md) |
| README public state versus private witness explanation | PARTIAL | [README.md](../README.md); [contracts/private-payments.compact](../contracts/private-payments.compact) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publication is now authorized and will be checked after push. |
| 5 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Added explicit privacy model, visible issuer address, verified installer commands and environment locations to README. Compiled all four targets using the actual project-local CI compiler installation and recorded test/artifact/issuer evidence.

## Level 2 — NOT PASSED

| Requirement | Status | Evidence / remaining observation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole) |
| 1AM connect/disconnect (accepted replacement) | PARTIAL | [src/lib/midnight/oneam.ts](../src/lib/midnight/oneam.ts); [src/components/wallet-panel.tsx](../src/components/wallet-panel.tsx); [tests/browser/shell.spec.ts](../tests/browser/shell.spec.ts) — Implementation and synthetic checks pass; both connections are owner-reported. Real disconnect/reconnect remains unobserved. |
| Successful frontend circuit invocation | UNVERIFIED | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [src/lib/midnight/issuer-issuance.ts](../src/lib/midnight/issuer-issuance.ts) — Deployed issuer constructor is not a successful exported circuit call. Issuer issue and payment fund/claim remain unexecuted. |
| Observable proven-but-not-shown behavior | PARTIAL | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [docs/disclosure-audit.md](../docs/disclosure-audit.md) — Synthetic fund/claim/issue proofs pass; actual frontend proof, sealed public effects and output destination binding remain unverified. |
| Verifiable Preprod contract address | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [deployments/preprod/test-asset-issuer.json](../deployments/preprod/test-asset-issuer.json) — The verified address is the separate issuer. |
| README privacy claim | PARTIAL | [README.md](../README.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publication is now authorized and will be checked after push. |
| 8 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Documented precise witness/public-ledger boundary and limits without claiming unobserved privacy. Reverified live issuer canonical finality and synthetic proof generation.

## Level 3 — NOT PASSED

| Requirement | Status | Evidence / remaining observation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole) |
| Fully functional privacy dApp | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [docs/evidence/level-verification.json](../docs/evidence/level-verification.json); [docs/TESTING.md](../docs/TESTING.md) — No observed finalized payment-escrow deployment, funding, independent B credit/spend, replay rejection, real recovery/reconciliation or sealed-transaction disclosure review. |
| At least three passing tests | SATISFIED | [docs/evidence/level-verification.json](../docs/evidence/level-verification.json) — 38 unit, 13 contract and 20 integration cases pass; 7 browser cases passed against unchanged product source. |
| Workflow and actual passing remote CI | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole/actions/runs/36295888117) |
| Complete README and observer privacy model | PARTIAL | [README.md](../README.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publication is now authorized and will be checked after push. |
| 10 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Independently verified the public repository and every successful step of its real CI run. Corrected unsupported idea-list wording; recorded the proposal as unsubmitted/unapproved.

## Level 4 — NOT PASSED

| Requirement | Status | Evidence / remaining observation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole) |
| Working MVP on Preprod with verifiable product address | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [src/lib/midnight/payment-deployment.ts](../src/lib/midnight/payment-deployment.ts); [docs/evidence/level-verification.json](../docs/evidence/level-verification.json) — No observed finalized payment-escrow deployment, funding, independent B credit/spend, replay rejection, real recovery/reconciliation or sealed-transaction disclosure review. The issuer address does not substitute for the payment escrow. |
| README, setup, usage and full documentation | PARTIAL | [README.md](../README.md); [docs/USAGE.md](../docs/USAGE.md); [docs/OWNER-TESTING.md](../docs/OWNER-TESTING.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publication is now authorized and will be checked after push. |
| Passing pipeline in product repository | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole/actions/runs/36295888117) |
| 15 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Recorded real CI and deployment-role distinctions and fixed local documentation.

## Level 5 — NOT PASSED

| Requirement | Status | Evidence / remaining observation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole) |
| Same working Level 4 MVP extended | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [src/lib/private-state/indexed-db.ts](../src/lib/private-state/indexed-db.ts); [tests/integration/payment-records.test.ts](../tests/integration/payment-records.test.ts); [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) — Recovery, retry, QR, controlled spend and security improvements extend the same product. The working Level 4 baseline and real funded-history continuity remain unverified. |
| Updated documentation | PARTIAL | [README.md](../README.md); [docs/STATUS.md](../docs/STATUS.md); [docs/USAGE.md](../docs/USAGE.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publication is now authorized and will be checked after push. |
| 20 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Audited existing reliability/security extensions and published commit diffs; did not manufacture new features or history to meet counts.

## Level 6 — NOT PASSED

| Requirement | Status | Evidence / remaining observation |
|---|---|---|
| Public GitHub repository and README | SATISFIED | [docs/evidence/github-verification.json](../docs/evidence/github-verification.json); [Public evidence](https://github.com/ianpurif/MoneyMole) |
| Same working Level 4 MVP extended | PARTIAL | [src/lib/midnight/payments.ts](../src/lib/midnight/payments.ts); [tests/integration/payment-records.test.ts](../tests/integration/payment-records.test.ts); [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) — Same product extends Level 4, but live acceptance and old funded-deployment continuity remain unverified. |
| Updated documentation | PARTIAL | [README.md](../README.md); [docs/STATUS.md](../docs/STATUS.md); [docs/PRIVACY.md](../docs/PRIVACY.md) — The required explicit public-state/private-witness and observer-model section is now local but absent from the published README at 1b3ed38. Publication is now authorized and will be checked after push. |
| 30 meaningful commits | SATISFIED | [docs/evidence/commit-audit.json](../docs/evidence/commit-audit.json) |

Automatically completed: Applied the stricter 30-commit checklist and verified 35 substantive commits already published.

## Remaining blockers

- Owner wallet approval/unlock/signing and actual Preprod E2E observations
- Publish completed documentation and verify remote CI (now owner-authorized)

The next real flow is issuer recovery/issuance, payment escrow deployment, A funds
10 units, independent B claims with A closed, encrypted reload/import and
reconciliation, B spends back to A, replay/disclosure/destination-binding checks.
Each connection/signature and private recovery unlock is performed by the owner.
Never expose bearer openings, seeds, keys or passphrases through tools. The generic
product verifier includes T24 participation; T24 is outside this scoped audit.
Auxiliary Codex/MCP authentication is not a Level or runtime requirement.

Configuration is complete: .env.local intentionally contains only the local
prover port. Public network/issuer settings are in config/preprod.json; approved
escrow selection is browser localStorage and encrypted recovery is IndexedDB.
