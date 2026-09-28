# Private Payments: technical product proposal

**Category:** payments. **Network:** Midnight Preprod.
**Status:** candidate product implementation complete; real payment acceptance
remains owner-pending. **Eligibility approval:** owner-pending.

The owner excludes unsupplied organizer approval from the current scoped Level
submission pass. This does not turn this draft into an approved proposal.

## Problem and intended users
A sender should be able to pre-fund a transferable claim without handing its bearer
authority or local recovery data to an application server.
People sending funds, freelancers receiving client payments and small businesses
are the intended users. This is a product hypothesis, not measured market evidence.

## Proposed solution
A sender authorizes funding of native Preprod NIGHT into a Compact payment contract.
After actual funding finality, a locally generated bearer link and QR let a separate
receiver wallet claim the same value once. The receiver initiates the transaction
and must obtain a discoverable, spendable output without sender-browser access.
No mint-on-claim, custom issuer asset or central signer can satisfy the proposal.
NIGHT is unshielded: public amounts/addresses are an explicit owner-directed
scope change (ADR 007). Bearer authorization remains private.

## Technical distinction and validation
Private authority plus public commitment/nullifier state authorize single use.
The finalized Preprod escrow has two observed funding calls and one claim call;
their frontend origin, independent wallet control and full recipient spendability
are not established by read-only chain data. The protocol is not anonymous or
amount-private: the underlying NIGHT transfer publicly discloses amount and
unshielded addresses and may expose sender–receiver relationships.

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
The current Level audit includes user and feedback requirements as unfilled owner
placeholders. Its Level 6 network/user criteria conflict with the public program
page; no organizer ruling is inferred. The stricter supplied 30-commit threshold
is used for the history check.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.
