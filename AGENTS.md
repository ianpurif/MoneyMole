# Private Payments: repository operating rules

## Current owner directive — autonomous local setup and verification
Finish all engineering remediation before asking for wallet actions: safe retries
after observed final failures, real saved-record integration coverage, dependency
audit fixes and maintainable public configuration. Reverify changed subjects;
retain original issuer records and never treat a partial/unknown outcome as failed.

Own the local Node/NVM, dependency, environment, Docker/prover and application
setup. Configure `.env.local` directly with real local/test settings. Run all
available compilation, artifact, lint, type, unit, contract, integration, proving,
browser, build, requirements and read-only issuer checks; fix failures and continue.
This supersedes the previous coding-only testing hold. Complete all automatable
work before returning for a necessary manual wallet action. Local fixtures do not
establish real payment acceptance. Never invent credentials or evidence. Keep
unobserved acceptance pending. Commit each logical change; publish completed non-sensitive work to the owner-approved MoneyMole repository.
Deployment, issuance and live transactions still require explicit owner approval.

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


Act as the architect/coordinator. When asked to execute `BUILD.md`, implement the
first unblocked task immediately, then continue; do not stop after writing another plan.
Read `BUILD.md`, `docs/STATUS.md` and the active `docs/tasks/M*.md` first. Load other
context only as that task requires. `docs/requirements.json` owns requirement IDs
and states; `docs/REQUIREMENTS.md` is derived. `docs/SOURCES.md` owns verified research.

## Boundaries
Real shielded value must move between independent wallets. A counter, commitment,
proof, imported receipt or mocked balance is not a payment. Payment actions require
explicit wallet approval and observed finality. Keep issuance separate from claiming. Never expose claim
secrets, coin openings, private state or wallet keys in logs, artifacts or MCP calls.
Scope work to product engineering, developer tools, technical docs, tests and
permitted technical evidence. Do not import unrelated activities from external material.

Create a Git commit after every meaningful codebase change with a clear, concise
message. Keep logical changes separate; do not accumulate unrelated uncommitted
work. This is standing owner authorization for local commits, not pushes. No history
rewrites, author changes, global configuration edits or permission relaxation
without explicit owner authorization. Preserve files on reruns. Never
redeploy just because a session restarted. Wallet actions, funds, secrets, permissions,
eligibility and irreversible changes require the owner's explicit action.

## Execution
Use Node 22, npm and one genuine lockfile. Linux/WSL2 is the toolchain target.
Read the command table in `docs/RUNBOOK.md`. Normally start with `npm run check:offline`,
`npm run doctor`, then M0. `npm run verify:boilerplate` is preparation only;
`npm run verify:product` requires real product evidence. Exit 2 means blocked, not passed.
After three equivalent failures, change the hypothesis or record a blocker.

## Delegation
Validate installed Codex schema, effective project config, agent discovery and account
model/effort availability first. Requested routing is architect/astra/medium,
engineer/sol/high, verifier/luna/max; full model IDs are in `.codex/agents/`.
Never silently substitute or claim a delegation that did not occur. At most two
spawned workers; no worker may spawn another. Assign disjoint files and use the
handoff contract in `PLANS.md`. Serialize compiling and proving. Architect alone
updates shared requirements/status unless ownership is explicitly transferred.
Return paths, checks with actual outcomes, evidence, risks and blockers, not full logs.

## Owner policy (2026-09-26)

1AM.xyz is the primary wallet. Do not silently fall back to Lace. Keep wallet
authorization and all sensitive data client-side; never expose seed phrases,
private keys, claim secrets, coin openings or private state in logs, APIs, artifacts
or tool output. Deployment, asset issuance and every live transaction require
explicit owner approval before execution. Connection/signing prompts are manual
owner actions. Commit every meaningful codebase change separately with a clear,
concise message; local commits and pushes to ianpurif/MoneyMole are authorized; history rewrites are not.

## Remediation checkpoint (2026-09-27)

The requested engineering fixes and full local application verification are complete
on the revision bound by docs/evidence/local-verification.json. Resume using
docs/STATUS.md; do not redo issuance/deployment or treat local fixtures as live E2E.
Revalidate evidence whenever its bound source/configuration changes. Public runtime
settings live in config/preprod.json; owner secrets stay in encrypted browser state.

## Current Level audit scope (2026-09-27)
Audit against docs/LEVEL-AUDIT-SCOPE.md. Exclude videos, hosted app links,
screenshots, users and user feedback from this audit. Accept 1AM in place of Lace;
real wallet/circuit/privacy evidence remains required. Fix automatable gaps and
keep public-repository, remote-CI, organizer-approval and product-X evidence truthful.
Do not infer Level passes from local implementation or count excluded items as blockers.


## Current owner directive — publish verified submission work (2026-09-27)

The owner explicitly authorizes committing and pushing all completed non-sensitive
work to https://github.com/ianpurif/MoneyMole, then verifying public content and
GitHub Actions. This supersedes earlier no-push instructions for this repository.
Do not rewrite history, force-push, publish secrets or approve wallet prompts.
Update the README with a judge-friendly Level 1–6 evidence map, deployment identity,
setup/usage, privacy, recovery/security, CI and meaningful history. Rerun all checks.
Exclude videos, hosted website, screenshots, users/feedback, X, Lace branding and
unsupplied organizer approval evidence from the current scoped Level verdicts.
A real working payment escrow and wallet/circuit evidence are still required.
Prepare 1AM operations up to their approval screen; the owner personally confirms
connections, unlocks private recovery and signs transactions. Do not redeploy the
existing issuer or invent private recovery material. Continue all independent work
before returning an exact manual action. The friend's README is presentation
reference only; its contracts, counts and acceptance claims are not MoneyMole evidence.
