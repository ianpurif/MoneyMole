# Current execution state

Snapshot: 2026-09-27. **Requested application engineering remediation is complete;
real 1AM wallet E2E acceptance remains pending.** Current sanitized evidence is
`docs/evidence/local-verification.json`. No live transaction or push was performed.

## Current Level audit

The strict [Level 1–6 audit](LEVEL-AUDIT.md) is complete for all automatable work.
All six Levels are **NOT PASSED** under the published-submission criteria. Level 1
has compiling contracts, tests, generated keys, a real issuer deployment and enough
published history; its required explicit README privacy section is fixed locally
but unpublished. Higher Levels still need real 1AM payment acceptance; Level 3
also needs actual idea-list submission/organizer approval.

The owner supplied https://github.com/ianpurif/MoneyMole. Public access and CI run
36295888117 at 1b3ed38 are independently verified: every step passed. Thirty-five
substantive commits were reviewed in the existing published history, excluding
audit/docs-only commits. Fresh evidence is in docs/evidence/level-verification.json,
github-verification.json and commit-audit.json. Video, hosted app link, screenshots,
users/feedback and the owner-deferred X profile do not affect this audit verdict.
The X profile remains required for the later complete submission, not a verified item.

## Completed engineering

- Confirmed failed claims and controlled spends have explicit retry actions. Each
  reset freshly verifies canonical complete failure and the original payment state,
  atomically archives the failed attempt, and requires a new owner approval.
  Unknown, partial, stale and already-spent outcomes cannot authorize retry.
- Recovery integration exercises the production payment controller, transaction
  helpers, real encryption and saved records across reload/import, interruption,
  rejection and concurrent access. Protocol/wallet boundaries remain synthetic.
- Complete Preprod shielded addresses are accepted with strict bounded checksum,
  network, type and canonical encoding checks; SDK 3.1.2's default 90-character
  parser limit no longer rejects the genuine 132-character address.
- PostCSS 8.5.28, Vite 7.3.6, Vitest 4.1.11 and esbuild 0.28.2 resolve the dependency
  audit findings. The original deployed runtime closure, source and verifier remain
  protected while independent development tools can receive security patches.
- Public settings are consolidated in config/preprod.json and shared by browser,
  CSP and verification scripts. Acceptance evidence now includes configuration.
- The clean-install timeout is finite but accommodates Windows-backed WSL I/O;
  fresh npm ci passed after the original four-minute limit interrupted installation.

## Current local setup and verification

Windows and project WSL use Node 22.16.0 / npm 10.9.2. All 33 direct installed
versions match the manifest and lockfile. Use WSL for dependencies and builds.
The updated production app is running at http://127.0.0.1:3000 and the pinned
proof-server 8.1.0 image is running on loopback port 6300. The original application
origin was retained so owner encrypted recovery remains accessible.

| Check | Observed result |
|---|---|
| Clean npm ci, installed identity, tool doctor | Passed |
| Full dependency audit | Passed; zero reported vulnerabilities |
| Offline source and utility checks | Passed |
| Compact probe, coin probe, payment and issuer compilation | Passed |
| Artifact hashes and runtime compatibility | Passed; regenerated artifacts match the browser-tested build byte for byte |
| ESLint, TypeScript, full unit suite, production build | Passed |
| Generated-contract / integration suites | 13 / 20 passed |
| Production browser suite | 7 passed; synthetic providers, no real signing |
| Local proving | Real fund/claim/issue constraints and proofs, plus unsealed issuer transaction round trip passed using synthetic inputs |
| Browser connectivity | Prover CORS and real read-only Preprod indexer/RPC queries passed |
| Existing issuer | Source, verifier, runtime closure and canonical finality verified; issued false |
| Requirements | Graph, evidence hashes and derived report checked |

The preparation wrapper returns **blocked (2)** for auxiliary custom-agent/schema
session attestation and documentation MCP authentication. The newer installed
Codex CLI 0.158.0-alpha.2 now advertises all requested model/effort pairs and loads
matching project settings. No delegation occurred. The official Midnight MCP
endpoint returns HTTP 401. Neither auxiliary service is an application runtime
requirement; their verification was not fabricated or bypassed.

`services:check` is deliberately a TCP-only blocked diagnostic; actual proof and
browser CORS checks passed separately. `verify:deployment`, `test:preprod` and
`verify:product` correctly return 2 without real escrow/payment/acceptance inputs.
GitHub CLI is unauthenticated; public read-only API access nevertheless verified
the actual product CI run. Authentication is not needed to inspect that public run.

## Configuration and recovery locations

- .env.local contains only PROOF_SERVER_PORT=6300; this is intentional. No wallet
  secret or API credential belongs in it.
- config/preprod.json owns the reviewed network endpoints, issuer and asset domain.
- deployments/preprod/test-asset-issuer.json preserves the real issuer deployment.
  toolchain.lock.json is also part of that immutable deployment fingerprint;
  current client/tool observations are recorded in the new evidence, not rewritten
  into the original deployment profile.
- Public escrow selection uses localStorage key moneymole/current-escrow. Escrow
  addresses are generated in the browser and exported after approved deployment.
- Encrypted payment/admin recovery uses IndexedDB moneymole-private-v1, scoped by
  network, contract, wallet and schema. Secrets remain client-side.

## Exact next owner action and remaining acceptance

Chrome / Wallet A: open the running app, use the original local recovery passphrase
with **Prepare / unlock issuer deployment**, then **Check deployment** if needed.
The existing issuer must be
47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635.
Choose **Prepare / recover issuance**, then **Approve issuance of 1,000,000 test
units** and approve in 1AM. Expect finalized issuance and A's shielded test balance
of 1,000,000. Restore the original encrypted backup first if necessary; never share
that backup or passphrase with tools and never redeploy this issuer on session restart.

Then approve/recover the escrow, fund 10 units in A, privately transfer its link/QR
and close A. Brave / independent Wallet B must begin with zero of this asset,
claim 10, reconcile, reload and exercise encrypted export/import, then approve the
controlled spend of 10 back to A. Expect B zero, A credited and the original claim
spent; replay must not pay twice. Complete the live negative/recovery/privacy
matrix and retain only sanitized evidence. Unknown outcomes reconcile; only fresh
confirmed failures expose retry actions. Every live transaction needs approval.

Source, build and automated checks do not establish real extension signing,
receiver spendability, optical QR scanning, funded recovery or privacy acceptance.
Organizer approval and publication of the current documentation remain pending.
Remote CI at the published 1b3ed38 revision is verified; later local audit updates
are not covered by that run. Participation is excluded from the current audit.
No push is authorized. All meaningful changes are committed locally.
