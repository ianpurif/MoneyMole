# Application architecture

## Stack and trust boundary

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Backend APIs are Route Handlers under `src/app/api/**/route.ts`; modules under
`src/lib/server/` import `server-only`. Server Actions are only for appropriate
non-secret mutations and are currently unnecessary. No Express, NestJS, Fastify
or separate application backend is used without a verified requirement and ADR.

The browser owns 1AM authorization, claim capabilities, witnesses and encrypted
state. They never enter Next.js APIs, Server Actions, server props or logs.
The backend serves allowlisted public compiler artifacts and build hashes.
The trusted loopback prover is a protocol tool, not an application backend.

```text
Next.js UI and public artifacts
  -> browser: 1AM session, payment controller, encrypted IndexedDB
       -> compiled Compact code and trusted loopback prover
       -> explicitly authorized 1AM balance/sign/submit
       -> official Preprod indexer and node finality
```

Status: implemented candidate protocol; independent-wallet acceptance and public
disclosure review remain pending. Code completion does not prove settlement or privacy.

## Funded-note protocol

`contracts/private-payments.compact` holds one shielded coin per payment.
Funding requires a positive Uint128 amount of the supported asset, receives the
actual contract-owned output and inserts a commitment in a 65,536-slot note tree.
The client rejects new funding at capacity; old claims retain their original escrow.

The exact Compact persistentHash struct binds note domain, fixed Preprod domain,
kernel self-address, coin nonce/color/value and 32-byte authority.
`payment-crypto.ts` uses matching runtime type descriptors, not JSON/SHA-256.

Claim witnesses supply the opening, qualified escrow coin and membership path.
The browser verifies finalized public output/index observations and reconstructs
the matching native input locally. It never queries the indexer with the opening.
Paths use the current root; prepare again when another funding changes it.

The circuit checks membership and a domain-separated spent nullifier, records
that nullifier and consumes the escrow coin into an exact receiver output.
There is no mint or change output in claim. ownPublicKey binds the output but does
not replace bearer authorization. Copied-proof, concurrent-claim and privacy
properties remain subject to the acceptance matrix.

## Asset and wallet

`oneam.ts` detects API-v4 1AM and explicitly connects to Preprod.
`payment-session.ts` binds the original shielded address, checks network/account
before sensitive operations and after balancing, and keeps DUST separate from
the shielded payment balance.

The supported asset derives from the fixed issuer in `payment-session.ts` and
domain `moneymole/test/v1`. The separate issuer creates 1,000,000 non-redeemable,
zero-decimal test units once. Issuance rejects other issuers because their assets
would be unsupported. Reuse the confirmed issuer record.

`payment-deployment.ts` stores address, initial state, maintenance key and build
identity encrypted before approval. Confirmation matches the original deployment
action, current circuit verifier keys and asset. Public export contains only
network/address/transaction/block and source/build/toolchain hashes.
Existing compatible escrow addresses stay selectable; no automatic redeployment,
migration or administrative withdrawal is implemented.

## Payment controller and settlement

`payments.ts` implements draft, prepare, approve, reconcile, share, receive,
controlled spend, encrypted recovery and public receipts.

- Persist encrypted intent before proving or wallet authorization.
- Persist the sealed identifier as outcome_unknown before submitting.
- Refuse a second submission when an identifier exists, including after reload.
- Verify native transaction identity, successful inclusion, canonical node finality,
  deployed verifier keys and supported asset.
- Enable sharing only after funding and qualified-coin checks.
- Match the receiver's expected input nullifier/output commitment to claim events;
  check wallet balance synchronization separately.
- A controlled spend sends exactly the received amount to another shielded address.
  Attribution requires an initially zero receiver test balance, no unrelated
  transfers and a zero balance after finalized spending.

Balance observations alone cannot prove conservation or independent wallets.
Imported phases do not enable sharing or certify receipts without reconciliation.
A definitive failed transaction remains recorded; there is no blind retry.

## Claim transport and recovery

The strict codec encodes 210 bytes as a 284-character mm1 token: version/network,
contract, asset, nonce, authority, funding identifier, Uint128 amount and 32-byte
HMAC. The tag detects accidental corruption; its key is part of the bearer
payload, so it does not authenticate a sender. Contract bindings enforce the opening.
The default localhost claim URL is 312 characters. QR is generated locally.

`/claim` captures the fragment in browser memory and immediately removes it.
The owner connects 1AM and saves the claim encrypted. Unsaved memory is not crash
recovery. There is no blob API or remote QR service.

IndexedDB uses AES-256-GCM, PBKDF2-SHA256 at 600,000 iterations, memory-only keys
and namespace AAD binding network, contract, wallet and schema. Revision
compare-and-swap preserves concurrent records. Recovery bundles authenticate
before one atomic insert-only transaction. Unknown schemas and corruption fail
closed; see ADR 004.

Hiding the tab or five minutes after unlock locks private storage. Interrupted
work cannot persist or submit after locking; reopen and reconcile recorded
identifiers. JavaScript memory erasure remains best effort.

## Proving and evidence

Browser fund/claim/issue proofs go directly to loopback port 6300. An origin-level
Web Lock serializes requests; separate profiles and CLI jobs require owner
coordination. CLI heavy jobs share a file lock. Never use arbitrary hosted proving.

Nonce CSP, no-referrer policy, same-origin resources and sanitized errors restrict
delivery. The public artifact and build routes accept no wallet input.
ADR 006 records webpack WebAssembly support.

Read-only CLIs verify real deployment/action/finality references without signing.
`verify:product` also requires hashed owner-reviewed evidence for every matrix
row. It does not make owner assertions independent automated proof, and it does
not establish participant or external eligibility requirements.
