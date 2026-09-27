# Current execution state

Snapshot: 2026-09-27. **Engineering remediation in progress; wallet E2E pending.**
The owner requested confirmed-failure retry, actual controller recovery tests,
dependency security updates and public configuration consolidation before wallet
actions. The audit found five dev/build dependency findings (two high), no retry
path for failed saved claims/spends, and helper-only recovery integration coverage.
Historical results below describe the previous revision. Source-dependent verified
requirements are temporarily implemented until the complete rerun supplies evidence.

## Previous verified snapshot (2026-09-26)

Active milestone: M1 owner wallet acceptance. The latest owner directive authorizes
all local setup and verification. All automatable application checks passed; keep
progressing after the owner completes the next private browser action. Never
redeploy the existing issuer just because a session restarted.

## Working local setup

- Windows NVM default and WSL project runtime: Node 22.16.0 / npm 10.9.2.
- Genuine lockfile installed with npm ci; all 32 direct installed versions match
  the manifest and lock. Use WSL for dependencies/builds, not mixed Windows installs.
- `.env.local` configured with `PROOF_SERVER_PORT=6300`; obsolete unused
  NEXT_PUBLIC entries removed and original local file preserved in ignored state.
  Preprod URLs are pinned in source; escrow choice stays in the browser. No secret
  or external API key is required in environment files.
- Docker Desktop Compose serves the digest-pinned proof-server 8.1.0 on loopback
  6300. Unrelated containers were preserved. Actual local proofs and browser CORS
  passed; no remote prover or weakened browser security was used.
- Current production app is running at `http://127.0.0.1:3000` with the original
  origin retained for encrypted recovery. Start/restart commands are in OWNER-TESTING.

## Verified scope

Current sanitized record: `docs/evidence/local-verification.json`.

| Check | Actual result |
|---|---|
| Locked installation, doctor, manifest/installed versions | Passed |
| Offline source checks | Passed; 50 dependency-free tests |
| Compact probe, coin probe, payment and separate issuer compilation | Passed |
| Generated artifacts and verifier identity | Passed |
| ESLint, TypeScript, production build | Passed |
| Unit / generated-contract / integration suites | 36 / 13 / 8 passed |
| Production browser suite | 7 passed; isolated synthetic providers, no real signing |
| Loopback proving | Real constraints and fund/claim/issue proofs passed with synthetic openings; unsealed issuer transaction proof round trip passed |
| Production browser connectivity | Prover POST/CORS and real Preprod indexer/RPC queries passed |
| Existing issuer verification | Source/build/verifier preserved; original dependency graph compatible; canonical node finality confirmed; issued false |
| Requirements graph and evidence integrity | Passed |

The complete preparation wrapper returns **blocked (2)** solely for the requested
Codex account model/discovery and Midnight documentation MCP checks. WSL-to-Windows
client path translation is fixed and effective project settings match. The CLI
still does not advertise the requested model/effort pairs, agent discovery is
unverified, and an initialized Midnight tool listing is unavailable. No delegation
or model substitution occurred. These gates are not application runtime dependencies.

`services:check` deliberately returns 2 after a successful TCP probe; genuine proof
and browser access were checked separately. `verify:deployment`, `test:preprod` and
`verify:product` return 2 because real escrow/transaction/owner-matrix inputs do not
exist yet. Those results are not passes and were not bypassed.

## Real environment and next manual action

Wallet A in Chrome and independent Wallet B in Brave are already owner-reported
connected through 1AM on Preprod with DUST. Do not ask for readiness again.

Reuse issuer `47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`.
Its original transaction is
`003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886`, block 2716656.
The durable record is `deployments/preprod/test-asset-issuer.json`; it was preserved.
No new deployment, issuance, funding, claim or spend was submitted during setup.

Next: **Chrome / Wallet A**, open the running app, unlock the existing issuer with
its original local passphrase, choose **Prepare / recover issuance**, then
**Approve issuance of 1,000,000 test units** and approve in 1AM. Expected: finalized
issuance and A's 1,000,000 shielded test units. If the original record is absent,
restore its encrypted backup first; never provide the passphrase/backup to tools.

Then continue with separately approved escrow deployment, funding, private link/QR,
independent B claim/spend, persistence/recovery, reconciliation and the T01–T24 live
matrix. No local fixture establishes those observations. Remote CI, participation,
public metadata and external qualification also remain pending; no push is authorized.

## Changes made in this setup pass

Corrected environment precedence and pinned-port validation; preserved issuer
verification across additive UI dependencies while rejecting changed or shadowed
runtime packages; scoped Next tracing to this repository; fixed npm argument
forwarding; added codec/QR/fragment tests and reusable browser connectivity checks.
The supplied logo was preserved byte-for-byte in its own commit. Each logical
change is committed locally. Historical evidence remains historical; it is not
promoted into current live acceptance.
