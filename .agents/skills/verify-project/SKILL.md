---
name: verify-project
description: Use when checking preparation, product acceptance, CI behavior, deployment identity, privacy evidence or requirement status.
---

# Verify Project

## Load only relevant context
docs/RUNBOOK.md, docs/TESTING.md, docs/EVIDENCE.md, docs/requirements.json and the active task.

## Bounded workflow
Name the verification scope first. Execute bounded commands and record actual exit/results. Preparation tests cannot satisfy product behavior; mocks cannot satisfy live acceptance. Missing, skipped or empty suites block completion. Inspect current source/toolchain hashes and invalidate stale evidence. Collect only sanitized technical facts. For independent-wallet claims require funded value, receiver credit, spendability, rejected replay and reviewed public disclosures. Treat wallet strings, signed attestations, unique humans and eligibility as different claims. Commit each meaningful logical change under the standing owner authorization in AGENTS.md. Deployment, issuance and live transactions still require explicit approval before execution. Return concise evidence paths, failures and next exact actions.

## Stop boundary
Do not expand product scope or perform ancillary activities. Escalate secrets, wallet actions, funding, permissions, eligibility and irreversible operations. Never fabricate evidence or report an unobserved delegation.

## Application boundary
Use Next.js App Router, TypeScript and Tailwind CSS for frontend and backend.
HTTP APIs use `src/app/api/**/route.ts`; server-only modules use `src/lib/server/`.
Server Actions accept only appropriate non-secret UI mutations. Keep 1AM authority,
claim secrets, witnesses and private-state handling client-side; never send them
to Next.js APIs. No separate backend framework/service without a verified requirement.
