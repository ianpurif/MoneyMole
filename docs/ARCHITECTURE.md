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
