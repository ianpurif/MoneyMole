# Current execution state

Snapshot: 2026-09-26. Active milestone: **M0 — tooling and dependency resolution**.

## Preparation completed at source level
The Next.js shell, exact candidate package manifest, project Codex configuration,
three agent definitions, four scoped skills, product-specific context, six task
cards, machine-readable requirements, command gates, local utility tests and CI
source have been written. Amount helpers are implemented; payment operations and
private persistence are not. The Compact file is a compile-only, nonpayment probe.

## Observed validation
45 dependency-free utility tests passed with zero failures/skips. Domain-only types
and 13 TS/TSX syntax checks also passed within their documented scope.
See `docs/PREPARATION-REPORT.md` and its evidence files for actual command outcomes.
Do not infer an observed build from source presence. No Codex delegation occurred.

## Blockers
| Blocker | Consequence | Exact next action |
|---|---|---|
| Runtime registry/download DNS unavailable | No genuine package-lock.json or npm install | On an authorized connected host, run `npm run bootstrap`; correct only evidenced incompatible candidate pins. |
| Docker and Compact absent | No compiled probe, contract, keys or real proving | Complete reviewed installer metadata in M0, install pinned tools and run doctor/compile checks. |
| Codex absent | Installed schema, model account availability, agent discovery not validated | Open the trusted project in installed Codex and run the read-only doctor plus actual agent listing. |
| MCP not connected here | Endpoint only configured | Inspect actual Midnight MCP connection/tool listing in the trusted client. |
| Payment protocol not implemented | No funding, claim, deployment or receiver credit | Execute M1 after M0 tools; do not replace it with a simulation. |
| No owner external evidence | Eligibility, URLs, commits and real participant counts pending | Request only the specific external fact when needed; continue independent engineering. |

## Recent decisions
Single Next.js application, local trusted prover, no central custody/backend by
default. Sender-funded bearer direction only. Gate coin qualification, receiver
discovery and disclosure before protocol freeze. Preserve honest missing-lock status
instead of providing an invalid package-lock.json. Use Preprod and the supplied
Level 1–6 targets; keep qualification separate from engineering.

## Next exact action
At repository root: `npm run check:offline`, then execute
`docs/tasks/M0-toolchain.md`, beginning with `npm run bootstrap` on a connected host.
The single agent instruction remains: **Read and execute BUILD.md.**
