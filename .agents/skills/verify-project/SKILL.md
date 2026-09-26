---
name: verify-project
description: Use when checking preparation, product acceptance, CI behavior, deployment identity, privacy evidence or requirement status.
---

# Verify Project

## Load only relevant context
docs/RUNBOOK.md, docs/TESTING.md, docs/EVIDENCE.md, docs/requirements.json and the active task.

## Bounded workflow
Name the verification scope first. Execute bounded commands and record actual exit/results. Preparation tests cannot satisfy product behavior; mocks cannot satisfy live acceptance. Missing, skipped or empty suites block completion. Inspect current source/toolchain hashes and invalidate stale evidence. Collect only sanitized technical facts. For independent-wallet claims require funded value, receiver credit, spendability, rejected replay and reviewed public disclosures. Treat wallet strings, signed attestations, unique humans and eligibility as different claims. Do not create commits or network-changing actions without owner authorization. Return concise evidence paths, failures and next exact actions.

## Stop boundary
Do not expand product scope or perform ancillary activities. Escalate secrets, wallet actions, funding, permissions, eligibility and irreversible operations. Never fabricate evidence or report an unobserved delegation.
