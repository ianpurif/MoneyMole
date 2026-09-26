---
name: midnight-wallet
description: Use when implementing or diagnosing 1AM discovery, explicit connection, network selection, authorization, balances, proving or wallet synchronization.
---

# Midnight Wallet

## Load only relevant context
docs/PRODUCT.md, docs/PRIVACY.md, docs/TOOLCHAIN.md, src/lib/midnight/port.ts; source references S8, S10, S13.

## Bounded workflow
Inspect connector 4.0.1 and the installed wallet types; do not guess method names from an older example. Connect only by an explicit user gesture to the configured network. Separate shielded asset balance from NIGHT and DUST. Preserve rejection/unknown outcomes. Verify the receiver actually discovers and spends the coin. Inspect browser-prover/CORS conditions without weakening security. Unit mocks test error handling only; actual extension acceptance requires an observed wallet action. Never log keys or raw wallet/proof requests. Return concise observed behavior and exact missing owner action.

## Stop boundary
Do not expand product scope or perform ancillary activities. Escalate secrets, wallet actions, funding, permissions, eligibility and irreversible operations. Never fabricate evidence or report an unobserved delegation.

## Application boundary
Use Next.js App Router, TypeScript and Tailwind CSS for frontend and backend.
HTTP APIs use `src/app/api/**/route.ts`; server-only modules use `src/lib/server/`.
Server Actions accept only appropriate non-secret UI mutations. Keep 1AM authority,
claim secrets, witnesses and private-state handling client-side; never send them
to Next.js APIs. No separate backend framework/service without a verified requirement.
