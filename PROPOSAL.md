# Private Payments: technical product proposal

**Category:** payments. **Network:** Midnight Preprod.
**Status:** proposed product with source-level preparation; no implemented or
verified payment flow. **Eligibility approval:** owner-pending.

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
The supplied Level 3 idea list does not explicitly list payment links. Private
Payroll / Splits is related but does not establish approval. The owner must supply
organizer approval for this payment product. Do not change it into payroll software
to imply approval. Level 6 remains Preprod with 70 total real participants; plan
conservatively for 30 meaningful owner commits pending conflict confirmation.
