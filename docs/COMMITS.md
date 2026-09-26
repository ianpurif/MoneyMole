# Owner-controlled meaningful milestones

These are proposed messages, not commits already made. Use only for real, substantive
changes under the standing local-commit authorization; combine or revise when the actual work
differs. Never split empty changes or alter history to meet a number. Targets are
5/8/10/15/20/30 by Levels 1–6; 30 is conservative pending organizer confirmation.

1. `chore: establish reviewed toolchain and real dependency lock`
2. `chore: validate project-scoped Codex routing and skills`
3. `feat: add truthful application shell and typed domain boundaries`
4. `test: cover atomic-unit parsing and evidence validation`
5. `feat: add compiler-backed claim commitment probe`
6. `feat: isolate shielded test asset issuance from payments`
7. `feat: enforce actual shielded escrow receipt`
8. `feat: bind payment note domains and exact coin identity`
9. `feat: add atomic nullifier and single-use claim rules`
10. `test: verify independent receiver coin discovery and spendability`
11. `security: audit explicit and implicit contract disclosure`
12. `feat: add strict versioned claim payload encoding`
13. `feat: add encrypted wallet-scoped persistence`
14. `feat: add protected recovery export and import`
15. `feat: separate payment and transaction state machines`
16. `feat: reconcile unknown funding and claim outcomes`
17. `feat: integrate explicit 1AM connection and disconnection`
18. `feat: separate shielded balance and fee readiness`
19. `feat: connect sender funding UI to real contract calls`
20. `feat: add private fragment capture and local QR generation`
21. `feat: connect receiver claiming and verified receipts`
22. `security: enforce client resource and prover boundaries`
23. `feat: persist and verify Preprod deployment identity`
24. `fix: preserve outstanding payments across deployments`
25. `test: exercise tampering replay and concurrent claims`
26. `test: exercise outages interrupted submission and reload recovery`
27. `ci: compile real circuits test and build from the pinned graph`
28. `feat: validate consented participant evidence with explicit trust scope`
29. `docs: reconcile implemented behavior and technical acceptance evidence`
30. `security: close validated hardening findings and rerun regression`

## Owner policy (2026-09-26)

1AM.xyz is the primary wallet. Do not silently fall back to Lace. Keep wallet
authorization and all sensitive data client-side; never expose seed phrases,
private keys, claim secrets, coin openings or private state in logs, APIs, artifacts
or tool output. Deployment, asset issuance and every live transaction require
explicit owner approval before execution. Connection/signing prompts are manual
owner actions. Commit every meaningful codebase change separately with a clear,
concise message; local commits are authorized, pushes and history rewrites are not.
