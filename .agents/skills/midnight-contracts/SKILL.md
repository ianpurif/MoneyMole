---
name: midnight-contracts
description: Use when writing, reviewing or compiling Compact payment circuits, witnesses, shielded coin flows or generated artifacts.
---

# Midnight Contracts

## Load only relevant context
docs/ARCHITECTURE.md, docs/PRIVACY.md, contracts/README.md, toolchain.lock.json; source references S7–S11 and S15.

## Bounded workflow
Inspect the installed compiler and runtime types first. Resolve one uncertain API with a minimal compiler-backed probe, then implement only the assigned circuit. Verify actual receipt/qualification/consumption, exact commitment encoding and destination binding. Audit explicit disclosure and implicit helper effects. Keep issuance separate. Run compile, artifact validation and targeted contract tests serially. Do not count the compile-only probe as a payment. Return changed paths, exact checks, sanitized evidence and remaining privacy/authorization assumptions. After three equivalent failures, record a blocker and escalate.

## Stop boundary
Do not expand product scope or perform ancillary activities. Escalate secrets, wallet actions, funding, permissions, eligibility and irreversible operations. Never fabricate evidence or report an unobserved delegation.
