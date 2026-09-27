# Private Payments: technical product proposal

**Category:** payments. **Network:** Midnight Preprod.
**Status:** candidate product implementation complete; real payment acceptance
remains owner-pending. **Eligibility approval:** owner-pending.

The owner excludes unsupplied organizer approval from the current scoped Level
submission pass. This does not turn this draft into an approved proposal.

## Problem and intended users
A sender should be able to pre-fund a transferable claim without exposing payment
amounts or a direct participant mapping in ordinary public application state.
People sending funds, freelancers receiving client payments and small businesses
are the intended users. This is a product hypothesis, not measured market evidence.

## Proposed solution
A sender authorizes funding of one shielded asset into a Compact payment contract.
After actual funding finality, a locally generated bearer link and QR let a separate
receiver wallet claim the same value once. The receiver initiates the transaction
and must obtain a discoverable, spendable output without sender-browser access.
No mint-on-claim, central signer or unshielded fallback can satisfy the proposal.

## Technical distinction and validation
Private authority plus audited public commitment/nullifier state aim to authorize
single use while avoiding raw amount and sender-receiver disclosure. This construction
is conditional on the funding/qualification/claim feasibility slice, generated
transcript audit and independent-wallet acceptance. The protocol is not claimed
superior or private merely because the underlying asset is shielded.

## Delivery and risks
M0 establishes tools and dependency compatibility; M1 proves actual cross-wallet
value transfer; M2–M4 complete private persistence, wallet UX and durable Preprod
operation; M5 hardens and gathers permitted technical evidence. Key risks are coin
qualification, recipient discovery, authorization assumptions, public library effects,
proof-provider trust, lost bearer links and deployment continuity.

## Eligibility decision needed
No organizer approval or verifiable idea-list entry has been supplied for this
payment product. This file is a draft; it does not establish submission or approval.
The owner must submit it and provide the organizer's decision and applicable
idea-list reference. Do not change the product to imply eligibility.
The current Level audit excludes users and feedback and conservatively uses the
stricter Level 6 checklist threshold of 30 meaningful commits.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.
