# Current execution state

Snapshot: 2026-09-26. Active milestone: **M1 — independent-wallet feasibility**.
M0 tooling is installed; its Codex routing/MCP gates remain blocked. WSL now reuses Docker Desktop Compose.
M2 recovery utilities and M3 wallet/security work proceeded independently as BUILD permits.

## Current wallet migration

1AM is the primary wallet. The client adapter and UI migration are complete.
Twenty-eight unit tests, four production-browser tests, lint, typecheck, build and
offline checks passed. Provider fixtures are synthetic; the owner now confirms real 1AM authorization for Wallet A in Chrome and Wallet B
in Brave, both on Preprod with DUST. No deployment, issuance or transaction has occurred.
Every meaningful logical change is committed locally; nothing was pushed.

## Implemented
- Next.js App Router is the frontend and backend; TypeScript and Tailwind. HTTP APIs
  use `src/app/api/**/route.ts`, server-only code uses `src/lib/server/`, and Server
  Actions are only for appropriate non-secret mutations. No separate backend service.
- Genuine npm lockfile; installed SDK graph and exact connector types. ADR 005
  records peer-resolution fixes and the project-local official Node/Compact runtimes.
- Client-only 1AM discovery, explicit Preprod connection, DUST presence check,
  account/network invalidation and local disconnect. Separate issuer deployment
  preparation, explicit approval/submission and public-indexer reconciliation are
  implemented; real wallet signing remains owner-pending.
- Client-only AES-GCM/PBKDF2 IndexedDB, namespace authentication, revision conflicts,
  explicit unlock/lock, encrypted export/import and corruption preservation. ADR 004
  records limitations. Utilities are not yet connected to a funded product workflow.
- Local transaction state guards persist uncertainty before submission and reject
  blind retries. SDK-derived settlement observations are still required.
- Server-only CSP policy, fresh per-request nonces and dynamic App Router rendering.
- Commitment and shielded-I/O compiler diagnostics, generated outputs and initial
  disclosure review. Diagnostics must never be deployed/funded. The candidate payment
  contract and separate fixed-supply test issuer now compile, with 13 runtime cases
  and three local constraint checks/proof generations on synthetic fixtures.

## Observed checks
Registry resolution and npm ci passed. Offline utility tests passed. Unit tests,
TypeScript, lint, production build and production-browser tests have passed within
local scope; the preparation gate is blocked only on tooling/client availability,
with its per-command results recorded in M0 evidence.
Compiler 0.31.1 produced diagnostics, candidate payment/issuer contracts and keys. Exact devtools 0.5.1
was archive/checksum verified locally. KDF benchmark: 225/216/226 ms in Node Web
Crypto on this desktop; mobile/browser performance is unmeasured.
Windows Docker Compose started the pinned proof image on loopback and TCP was
reachable. The service checked and generated fund/claim/issue circuit proofs using
synthetic fixtures, then was stopped. No sealed transaction or ledger-validity test ran.
No live payment, deployment or receiver spend was observed. Real extension connections
and DUST readiness are owner-reported in docs/evidence/wallet-readiness.json.

## Blockers and next actions
| Blocker | Exact next action |
|---|---|
| Issuer approval pending | Wallet A (Chrome) and Wallet B (Brave) are connected to 1AM Preprod with DUST. Next: Wallet A prepares/unlocks the issuer, reviews deployment only, then approves in 1AM. Follow USAGE.md. |
| Product feasibility still unverified | Continue M1 from the locally tested candidate with independent qualified-coin discovery and sealed-transaction validation; review concrete deployment/funding transactions with the owner before executing. Verify B credit and spend with A unavailable, replay and public effects. |
| Installed Codex account listing lacks requested GPT-6 combinations | Owner/client resolves account capability discrepancy; do not silently substitute. No workers were spawned. |
| Midnight MCP listing unavailable | Owner/client checks the configured documentation MCP connection. Direct primary-source research remains available. |
| WSL Compose bridge resolved | services:status/up/down now select the installed Docker Desktop CLI and translate only the repository Compose path. No global installation or permission changes. |
| M2/M3 remaining integration | Finalize codec, payment flows and funded-state recovery only after M1 validates the protocol. Keep payment actions disabled. |
| M4/M5 live and external evidence | Reuse any future verified deployment. No deployment currently exists in project records. Owner supplies approvals, public metadata, remote runs and consented participation evidence. |

## Resume
Read BUILD.md and `docs/tasks/M1-feasibility.md`. Use `docs/USAGE.md` for the
implemented 1AM preparation controls. Run targeted checks after changes; preserve
current lockfile and evidence. Never infer product acceptance from diagnostics or mocks.

Local recovery follow-up: TransactionJournal now persists opaque intent and recovery
state together in encrypted storage. Five integration tests cover response loss,
competing tabs, pre-submit failure, acknowledgment-write failure and malformed
records. Tests use fake IndexedDB and synthetic callbacks; no live submission or
chain reconciliation is implemented. Restored states are explicitly unverified.

## Latest local verification

Lint, typecheck, all 28 unit tests, all eight integration tests and offline checks
passed after the recovery/qualification and WSL Compose changes. Evidence is in
`docs/evidence/local-recovery-qualification.json`. The existing production wallet
page remains available on port 3000; no UI behavior changed in this follow-up.
The project proof service was stopped after its lifecycle check. No network-changing
action was executed. Wallet readiness has since been reported; do not request it
again. Protocol/UI finalization remains gated by live M1 evidence; local helper
checks cannot replace that gate.

## Live verification execution
The owner has confirmed both independent wallets are ready. Continue implementation
of the client transaction path; the issuer approval UI is now available. Do not request the completed readiness step again.
On-chain actions still require explicit owner approval in the wallet. Connection
readiness does not establish payment or settlement.
