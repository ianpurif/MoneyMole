# Build MoneyMole — Private Payments

## Current owner directive — complete implementation first
Finish the complete application, contract adapters, recovery, UI and operator
tooling before returning for live verification. M1 is now an acceptance gate,
not a coding stop. Implement the candidate protocol with explicit unverified
acceptance status. The owner handles final app/E2E testing; do not run those suites
or live actions during this pass. TypeScript checking and artifact compilation
may establish buildability only. Do not equate coding completion with live proof.

## Application stack and privacy boundary

Use **Next.js App Router for both frontend and backend**, **TypeScript**, and
**Tailwind CSS**. Backend HTTP APIs belong in `src/app/api/**/route.ts` using Next.js
Route Handlers. Use Server Actions only for appropriate non-secret UI mutations,
with validated inputs and authorization. Put server-only modules in
`src/lib/server/` and mark them with `import "server-only"`.

No Express, NestJS, Fastify or separate backend service unless a verified technical
requirement is recorded in an ADR. The trusted local proof service is a protocol
tool, not a separate application backend. Add endpoints only for an actual need.
1AM wallet authorization, claim secrets, private witnesses and private-state
handling remain client-side. Never pass these secrets to Next.js API routes,
Server Actions, server components, server-rendered props, logs or telemetry.
Browser-to-trusted-local-prover traffic stays outside the Next.js backend.


## Execute, do not re-plan

Implement the product described here using the repository's existing preparation
files. Start the first unblocked action now and continue through the milestones.
Do not return a new folder proposal or ask permission after each phase. Request only
necessary owner actions for wallet authorization, secrets, funding, permissions,
eligibility decisions or irreversible changes. Record blockers and continue independent work.

This specification is self-contained with `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`,
`docs/PRIVACY.md`, `docs/requirements.json` and the task cards. No prior conversation
or separate attachment is required. The supplied engineering requirements are the
eligibility basis; original organizer materials were not independently supplied.

## Start from the actual state

Read `AGENTS.md`, `PLANS.md`, `docs/STATUS.md` and this file. Inspect files and any Git
diff without discarding changes. Run the following from the repository root:

```sh
npm run check:offline
npm run doctor
```

A nonzero blocked command does not prevent unrelated work. Do not run the commands
through a blanket `|| true`, mark a skipped suite passed, or overwrite evidence to
conceal a failure. The preparation snapshot contains source but no genuine npm
lockfile, installed SDK, compiled Compact output, wallet connection or live payment.
M0 resolves those gaps on a suitably connected host. Recheck STATUS; this paragraph
is the initial snapshot, not a reason to redo already verified work on a later run.

## Product acceptance, not a proxy

One wallet funds an exact amount of one supported shielded asset. Only after actual
funding finality can the application share a bearer claim link and equivalent local
QR. An independent receiver wallet claims after the sender disconnects. Confirm
receiver credit AND spendability; demonstrate failed replay and atomic conflict
handling. Claiming consumes existing funded value and never mints replacements.
Use a clearly labeled, non-redeemable Preprod test asset unless a suitable real asset
is verified. NIGHT and DUST do not substitute for a shielded payment asset.

The link is bearer authority: anyone holding it, including the sender, can attempt
to claim. No intended-recipient identity is implied by connecting a wallet. There
is no automatic expiry/refund/recovery. Lost capabilities may mean permanently
unclaimable value. Do not broaden the MVP into request-to-pay or another product.

## Role routing

Use the installed, trusted client's custom-agent definitions:

| Role      | Exact model | Effort | Ownership                                                     |
| --------- | ----------- | ------ | ------------------------------------------------------------- |
| architect | gpt-6-astra | medium | Coordination, interfaces, threat model, ADRs, acceptance      |
| engineer  | gpt-6-sol   | high   | Full-stack, Compact, infrastructure, fixes and technical docs |
| verifier  | gpt-6-luna  | max    | Bounded checks and sanitized evidence                         |

Validate support and discovery before delegation. No silent substitutions. No
actual model delegation occurred during preparation. Up to two workers, disjoint
files, no nested coordinators, one heavy compilation/proving task at a time.
Use the explicit delegation/return contract in `PLANS.md`.

## Ordered milestones

All commands below use repository-root cwd. Read only the active task card plus its
listed context. Expectations are not observations.

| ID  | Implement now                                                       | Detailed executable task       | Gate                                                                       |
| --- | ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| M0  | Resolve tooling, exact graph, installed APIs and Codex capabilities | `docs/tasks/M0-toolchain.md`   | Genuine lock + installed checks; supported model routing or explicit block |
| M1  | Minimal real shielded funding-to-claim slice                        | `docs/tasks/M1-feasibility.md` | Independent receiver spendable coin, no replay, audited public transcript  |
| M2  | Complete contracts, domain, persistence and negative cases          | `docs/tasks/M2-core.md`        | Conservation, binding, recovery and corruption tests                       |
| M3  | 1AM and responsive link/QR application                             | `docs/tasks/M3-wallet-ui.md`   | Real extension authorization and privacy-safe two-context flow             |
| M4  | Preprod deployment, durable metadata and reconciliation             | `docs/tasks/M4-preprod.md`     | Chain-bound address, finality and wallet synchronization                   |
| M5  | Hardening, regression, pipeline and technical evidence              | `docs/tasks/M5-acceptance.md`  | Product acceptance distinct from external qualification                    |

M1 may require an owner-authorized provisional Preprod deployment to verify true
cross-wallet behavior. Record it durably and reuse it in M4 where compatible; M4
is not an instruction to redeploy. When live M1 is blocked, work on testable M2
utilities and M3 presentation, but do not freeze cryptographic interfaces or
advertise complete payments until the feasibility gate passes.

## Non-negotiable implementation rules

Keep the single Next.js application, strict TypeScript, Tailwind and source-owned
shadcn/ui components. Browser-side wallet and encrypted state operations feed typed
domain logic and an SDK adapter; the proof service runs locally by default. No
custodial signer, central account system, separate backend service, external QR service or
AI dependency in the application. Add infrastructure only for a documented,
verified necessity that preserves the privacy model.

Use integer atomic units and string serialization, validated asset metadata,
cryptographically secure 256-bit minimum claim entropy, versioned domain separation
and an authenticated compact payload. URL fragments are captured only in the
client, then scrubbed. Never place secrets in paths, queries, telemetry, logs,
server-rendered props or remote resources. Implement and test nonce-based CSP before
secret-bearing routes exist; current shell headers are not the final policy.

Enforce every security-relevant binding in the contract, not only the browser.
Verify actual coin receipt, qualification and consumption. Audit `disclose()` and
all implicit standard-library effects. `ownPublicKey()` alone is not signer
proof. A proposed note/nullifier construction is a hypothesis until compiled,
tested and inspected; do not advertise anonymity because assets are shielded.

Persist intent before funding. Separate payment progression from transaction
submission, inclusion, finality and wallet synchronization. Imported receipts are
unverified. Unknown outcomes must reconcile before retry. Encrypted stores must
not persist their own decryption keys; namespace by network, contract, schema and
wallet. Never hand-edit generated material or discard funded-deployment history.

## Fail-closed command implementation

`compile:contracts` compiles the candidate `contracts/private-payments.compact`;
`compile:issuance` compiles the separate fixed-supply test issuer. Artifact,
generated-runtime and synthetic local-proving actions are implemented. Remaining
product command gates route to `scripts/product/*.mjs` and block until implemented.
Each new action exports `run(args)` and returns
`{status: "passed", evidencePaths: [...]}` ONLY after its actual acceptance passes.
Tests may use isolated mocks, but integration/proving/live acceptance may not count
mock responses. Empty, skipped or unavailable suites must return nonzero.

Central command definitions are in `package.json`; details are in `docs/RUNBOOK.md`.
Keep both synchronized. Do not turn a product command into a shell-file existence
check. Contract artifact verification must inspect hashes, runtime compatibility
and actual generated outputs, not just directory names.

## Final acceptance and handoff

Execute the complete matrix in `docs/TESTING.md`. At least one real claim must use
an independently connected receiver and an unavailable sender browser. Confirm
value conservation, receiver spendability, failure of copied/tampered/concurrent
claims and absence of unintended disclosed fields in inspected public data.
A successful SDK test does not prove 1AM integration; report any extension limit.

Run compile, artifact validation, lint, typechecks, all relevant test layers and
production build. Inspect actual authorized remote pipeline results separately;
a workflow definition is not a successful run. Record deployment network, address,
transaction, observed finality and source/build/toolchain hashes. Update every
relevant requirement with observed evidence and regenerate its readable report.

Preserve owner-pending eligibility, repository metadata, supplied product references,
meaningful commits and real-participant evidence. Create a concise local Git commit after each meaningful logical change; do not
batch unrelated work or fabricate participants. A wallet is not a unique human.

Finish with implemented behavior, observed checks by scope, exact blockers and
owner actions, deployment evidence where real, residual privacy/security risks,
and the next exact action. Do not claim complete challenge qualification when
external requirements are pending.

## Owner policy (2026-09-26)

1AM.xyz is the primary wallet. Do not silently fall back to Lace. Keep wallet
authorization and all sensitive data client-side; never expose seed phrases,
private keys, claim secrets, coin openings or private state in logs, APIs, artifacts
or tool output. Deployment, asset issuance and every live transaction require
explicit owner approval before execution. Connection/signing prompts are manual
owner actions. Commit every meaningful codebase change separately with a clear,
concise message; local commits are authorized, pushes and history rewrites are not.
