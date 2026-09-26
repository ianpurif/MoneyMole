---
name: private-payments
description: Use when changing payment invariants, claim payload encoding, local QR, bearer authorization, private persistence or settlement reconciliation.
---

# Private Payments

## Load only relevant context
docs/PRODUCT.md, docs/ARCHITECTURE.md, docs/PRIVACY.md, docs/TESTING.md; active M1/M2/M3 task only.

## Bounded workflow
State the affected invariant before editing. Enforce bindings in the contract as well as the client. Keep at least 256-bit authority entropy and exact compiler/runtime encodings. Capture secrets only from client fragments, scrub safely and never use external QR resources. Store recoverable intent before funding; encrypt with separately supplied unlock material and authenticated namespaces. Preserve unknown transaction outcomes and distinguish imported receipts. Test wrong/tampered/replayed/concurrent claims and corrupted/reloaded state. Do not infer signer authorization from ownPublicKey alone. Return the precise invariant, actual evidence and unresolved risks.

## Stop boundary
Do not expand product scope or perform ancillary activities. Escalate secrets, wallet actions, funding, permissions, eligibility and irreversible operations. Never fabricate evidence or report an unobserved delegation.

## Application boundary
Use Next.js App Router, TypeScript and Tailwind CSS for frontend and backend.
HTTP APIs use `src/app/api/**/route.ts`; server-only modules use `src/lib/server/`.
Server Actions accept only appropriate non-secret UI mutations. Keep 1AM authority,
claim secrets, witnesses and private-state handling client-side; never send them
to Next.js APIs. No separate backend framework/service without a verified requirement.
