# Architecture

## Application and trust boundaries

One Next.js App Router application uses TypeScript and Tailwind CSS. HTTP endpoints
are Route Handlers under src/app/api/**/route.ts. src/lib/server/ modules import
"server-only". Use Server Actions only for justified, authorized non-secret mutations.
No Express, NestJS, Fastify or separate application backend is required.

The browser owns 1AM connection, authorization, claim parsing, SDK transactions,
witnesses and encrypted IndexedDB. Next.js serves UI, public generated artifacts
and build fingerprints only. Never send wallet secrets, claim fragments, decrypted
state or witnesses through API routes, actions, server components or logs.
Browser proving goes directly to the trusted loopback proof server; it is a
protocol dependency, not an application backend. Nonce CSP and referrer protection
limit external resources; no telemetry, remote QR generator or central signer.

## Native NIGHT contract

contracts/night-payments.compact is the product. Its supportedAsset is nativeToken().
fund receives exactly the disclosed amount using receiveUnshielded and inserts a
note into a depth-16 tree. The commitment binds v2 domain, Preprod domain, kernel.self(),
native asset, amount, nonce and bearer authority. claim verifies current-root
membership, checks/inserts the spent nullifier, checks escrow balance and sends
exact NIGHT using sendUnshielded to the supplied UserAddress. Destination and amount
are bound by the proof's public transcript. No product circuit mints.

NIGHT and STAR are not separate assets: 1 NIGHT = 1,000,000 atomic STAR. Amounts and
addresses are public. The secret authorization remains private to the browser and
trusted prover. This is a privacy change from the historical shielded-token product,
recorded in ADR 007. Pool balances alone are not per-note payment evidence.

New funding changes the note root, so stale claim paths must be refreshed before
proving. Capacity is 65,536 notes. Retain full escrows for claims and use another
approved compatible escrow for new funding. There is no expiry/refund/admin drain.

## Wallet and settlement

PaymentFlow is a shared, in-memory coordinator owned by RecoverySession. The modal
advances through encrypted draft saving, fresh balance checks, proof preparation,
explicit wallet approval, submission and finalized reconciliation. It resumes from
the existing encrypted record rather than persisting a second UI state machine.
An already prepared proof is reused; a saved transaction ID always resumes at
confirmation. Claim links may switch the shared escrow without another local
unlock or disposing the active wizard. Optional spending of received NIGHT uses
the same modal, including its own saved identifier and confirmation result.

Draft creation and draft inspection do not query wallet balances or a placeholder
transaction ID. Display refreshes are coalesced and preserve labelled last-known
totals, while spending decisions require fresh validated wallet reads. Read/prover,
artifact, storage, approval and confirmation failures receive client-side safe
messages; raw errors and private payloads are never logged or exposed.

Web Locks serialize payment mutations across tabs, alongside encrypted record CAS.
Submission acknowledgement waiting is bounded without cancelling or retrying the
request; a missing response preserves outcome_unknown and its durable identifier.
Only observed canonical complete FAILURE plus an absent funding note permits a
new funding attempt. The old attempt is atomically archived. Partial/unknown
outcomes never authorize another submission. This is an ordered, resumable UX,
not a claim that browser actions and network settlement form one atomic transaction.

oneam.ts discovers the real 1AM provider and requires an explicit connection.
payment-session.ts binds shielded SDK keys plus the unshielded NIGHT address to
Preprod and the current account. getUnshieldedBalances supplies native NIGHT;
getDustBalance supplies fees. NIGHT payment amounts never use shielded balances.
SDK shielded public keys are still protocol inputs, not the payment destination.

payments.ts saves encrypted intent, constructs fund/claim, proves locally and
requests balanceUnsealedTransaction through the wallet. It compares reviewed
contract actions, saves the returned identifier, and only then submits. Wallet
rejection is distinct from an unknown submission outcome. Claim/spend retries
require observed canonical FAILURE, never PARTIAL_SUCCESS, stale local state or
an absent transaction. Failed attempts remain archived atomically with CAS writes.

payment-network.ts checks native transaction identity and canonical node finality.
night-settlement.ts inspects exact native contract effects, absence of mints,
claim destination and NIGHT outputs. Funding also checks the note in historical
and current verified state. Receiver credit must equal baseline + payment.
Controlled spend uses makeTransfer(kind: unshielded), validates recipient and
exact native debit/output before submission and after finality, and requires
B's balance to return to its original baseline. DUST is accounted separately.

## Payload, recovery and deployment

mm2 is a strict 210-byte payload / 284-character token with integrity checksum,
version/network/deployment/native asset/atomic amount/nonce/authority/funding ID.
It is bearer authority, not encrypted and not recipient authentication. Keep it
in a URL fragment, capture then scrub it; generate QR locally. Never publish a
claim token or record it in test artifacts.

AES-GCM records use a passphrase-derived key and AAD bound to network, wallet,
contract and schema. NIGHT payment/deployment stores use schema 2; legacy schema 1
is untouched. New deployment staging is night-payment-deployment-staging-v2.
The root RecoveryProvider owns one RecoverySession per connected wallet. It owns
the unlocked identity, selected escrow and payment/deployment/issuer controllers.
Closing Tools or navigating client routes does not discard these controllers.
The public escrow preference is wallet-scoped; the older selection remains readable.

Forgotten-passphrase resets use a separate local storage identity under the same
authorized wallet. Previous authentication wrappers are archived before selecting
the new workspace; no IndexedDB records are deleted or overwritten. Namespace
validation rejects another wallet's identity. Payments, escrow, issuer recovery,
preferences and backup imports all use the selected local identity, while chain
addresses, coin keys and authorization checks remain tied to the real wallet.
Other tabs lock when the active authentication record changes.

An enrolled passkey and an enrolled fallback phrase independently unwrap the
same local secret. Their authenticated wrapper is sufficient for local login;
unrelated damaged/legacy namespaces do not invalidate a successful passkey login.
Missing enrollment is shown as a recovery choice, never a request to bypass old
encryption. Wrapped backups can restore the local unlock method with their export
passphrase. Older exports still require their original secret and namespace.

Local authentication metadata in localStorage contains only encrypted key wrappers
and public credential metadata. WebAuthn requires user verification and PRF output
to derive an AES-GCM wrapping key. Unsupported authenticators fail closed and offer
the app passphrase fallback. Existing users unlock their original records before
enrolling a passkey; no legacy data is overwritten or implicitly re-encrypted.
The app passphrase minimum is seven Unicode characters (maximum 1,024 UTF-8 bytes);
PBKDF2-SHA256 remains at 600,000 iterations. Wallet/protocol secrets are unchanged.

Portable backups include a passphrase-wrapped local encryption secret, never a raw
key. Passkey users add a fallback before export; imports still accept original
legacy formats. Passkeys alone do not synchronize IndexedDB or recover records on
another origin/device. Imported transactions still require chain reconciliation.
Explicit lock, disconnect/account change, page close and five minutes without
interaction clear all managed controllers and unlock material. A brief wallet or
passkey prompt does not independently lock one part of the app. Unmanaged legacy
store consumers retain their original visibility/timer safeguards.

A NIGHT escrow has its own code/verifier identity and schema-v2 public deployment
record. No issuer address is a NIGHT escrow. Multiple senders may use the same
compatible escrow, or create/reuse their own; claims bind the selected deployment.
No automatic deployment occurs. The browser prepares an unsigned deployment and
the owner approves it. Public build/artifact fingerprints bind exported records.

## Configuration and legacy continuity

The authorized connector is wrapped once in a shared read scheduler. Installed
1AM 6.3.11 limits an origin to 20 reads per 10 seconds; repeated identity checks,
balance polling and payment preparation previously exhausted that budget. Reads
now run serially with a 16-per-10.1-second budget and share in-flight calls only.
The eight-second response timeout starts after queue admission. An explicit rate
limit gets one cooldown/retry; authorization and submission never do. There is no
cached identity shortcut: network/account checks still precede wallet actions.
Completed proofs are encrypted before the follow-up wallet check, so a temporary
read failure cannot discard them or force reproving. Stored record versions and
transaction identifiers are unchanged.

Wallet startup uses only connector reads, Bech32m public-key decoding and WebCrypto
hashing. It preserves the original SHA-256-of-coin-key-hex storage identity without
loading ledger WebAssembly or transaction/prover modules. Wallet balances use the
pinned native token identifier, covered by an SDK equivalence test. Recovery
initialization retries transient reads up to three times, has a 30-second deadline
per attempt, and exposes an explicit retry on the same authorized connection.
Late results after cancellation are discarded; startup never repeats authorization.

config/preprod.json owns public endpoints and paymentAsset metadata (NIGHT,
unshielded, 6 decimals, protocolVersion 2). Browser, CSP and CLI share it. The
remaining issuerAddress/assetDomain fields are historical only; paymentAsset()
uses nativeToken().raw and never derives an issuer token. .env.local contains only
PROOF_SERVER_PORT=6300 for Compose on this host; no wallet credentials belong there.
Changing a prover port also requires updating the reviewed public endpoint/CSP.

The original issuer is recorded in deployments/preprod/test-asset-issuer.json.
contracts/private-payments.compact and issuance/test-asset.compact and their
compiled artifacts remain for read-only verification and legacy recovery. Their
UI is absent from the NIGHT application. Old mm1 links and encrypted files are
not converted. The historical revision 16aa745 can be restored in a separate
checkout for legacy recovery; do not overwrite or delete either browser namespace.
