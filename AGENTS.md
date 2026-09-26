# Private Payments: repository operating rules

Act as the architect/coordinator. When asked to execute `BUILD.md`, implement the
first unblocked task immediately, then continue; do not stop after writing another plan.
Read `BUILD.md`, `docs/STATUS.md` and the active `docs/tasks/M*.md` first. Load other
context only as that task requires. `docs/requirements.json` owns requirement IDs
and states; `docs/REQUIREMENTS.md` is derived. `docs/SOURCES.md` owns verified research.

## Boundaries
Real shielded value must move between independent wallets. A counter, commitment,
proof, imported receipt or mocked balance is not a payment. The shell intentionally
has no payment actions. Keep issuance separate from claiming. Never expose claim
secrets, coin openings, private state or wallet keys in logs, artifacts or MCP calls.
Scope work to product engineering, developer tools, technical docs, tests and
permitted technical evidence. Do not import unrelated activities from external material.

No commits, history changes, author changes, global configuration edits or permission
relaxation without explicit owner authorization. Preserve files on reruns. Never
redeploy just because a session restarted. Wallet actions, funds, secrets, permissions,
eligibility and irreversible changes require the owner's explicit action.

## Execution
Use Node 22, npm and one genuine lockfile. Linux/WSL2 is the toolchain target.
Read the command table in `docs/RUNBOOK.md`. Start with `npm run check:offline`,
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
