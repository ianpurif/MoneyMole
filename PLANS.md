# Resumable execution protocol

The task cards in `docs/tasks/` are implementation specifications, not requests to
create more plans. Maintain one active milestone in `docs/STATUS.md`. Before work,
inspect current files, deployment records, requirement evidence and any dirty Git
state. Preserve owner changes. A completed task is reusable only while its source,
lockfile, compiler, network and deployed-contract assumptions remain unchanged.

## Delegation contract
Each delegation must contain the following filled fields; placeholders are not work:

```text
Task ID and objective:
Role and requested model/effort:
Read only these context paths:
Owned files (exclusive):
Dependencies and evidence already verified:
Concrete implementation tasks:
Acceptance commands (repository-root cwd):
Forbidden mutations / security constraints:
Return: changed paths; command + exit + scope; evidence paths;
        unresolved risks; blockers with exact missing action.
```

The architect owns shared interfaces, `docs/requirements.json`, `docs/STATUS.md` and
cross-cutting ADRs. The engineer may own contracts while the verifier owns separate
tests, but neither edits shared interfaces until the architect grants a handoff.
Do not duplicate source research already recorded with applicable versions. If the
source or installed types disagree, record the conflict and resolve it in a bounded
probe, not by changing versions at random.

## Milestone record
After each milestone, record actual completed files, remaining work, commands and
exit codes, sanitized evidence paths, decisions, blockers and next exact command.
Expected behavior remains labeled expected until observed. `implemented` means code
exists; `verified` additionally requires evidence. Do not infer product readiness
from preparation tests. Do not infer challenge qualification from technical readiness.

## Recovery
For an interrupted transaction, preserve its locally stored intent and identifier;
query finality and wallet synchronization before allowing another transaction. If
its outcome remains unknown, expose that state and stop retries. Never create a new
contract merely because the old address is not in browser memory. Locate and verify
the durable record. Preserve previous deployments with potentially funded payments.

A failed command gets a short diagnosis and one evidence-driven correction. After
three equivalent failures, stop that dependency, record the hypothesis and exact
owner/environment action needed, and execute independent work. Compiler/prover jobs
share `.local/heavy-tool.lock`. Browser proofs share an origin-level Web Lock;
coordinate CLI work and separate browser profiles manually, because those locks
cannot share one filesystem or browser origin.

## Evidence integrity
Use `reports/` for local diagnostics and `docs/evidence/` for reviewed, sanitized
technical records only. No raw proof requests or wallet logs. Verified requirement
entries must include command, scope, observedAt, a passed result, evidence-file SHA-256
and SHA-256 digests of every source/config subject on which the result depends.
Changing a subject invalidates the observation. Regenerate the readable report with
`npm run requirements:report`, then `npm run requirements:check`.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.

## Owner policy (2026-09-26)

1AM.xyz is the primary wallet. Do not silently fall back to Lace. Keep wallet
authorization and all sensitive data client-side; never expose seed phrases,
private keys, claim secrets, coin openings or private state in logs, APIs, artifacts
or tool output. Deployment, asset issuance and every live transaction require
explicit owner approval before execution. Connection/signing prompts are manual
owner actions. Commit every meaningful codebase change separately with a clear,
concise message; local commits and pushes to ianpurif/MoneyMole are authorized; history rewrites are not.


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
