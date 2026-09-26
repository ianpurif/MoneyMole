# Architecture and feasibility gates

Status: **proposed implementation architecture**, not a deployed payment protocol.
Source-grounded SDK capabilities are in `SOURCES.md`; the construction below is an
engineering hypothesis requiring M1 validation. Do not infer that a proof of a
commitment transfers funds.

## Boundaries

```text
Browser: React UI + explicit Lace authorization
    -> integer-valued payment domain and separate transaction state machine
    -> Midnight.js adapter + unlocked encrypted local store
    -> trusted local prover / connected wallet
    -> Preprod node and indexer
    -> Compact contract holding shielded assets
```

One Next.js App Router application. Public configuration may be server-readable;
wallet, claim payload, encrypted state and witnesses remain in the browser/prover
boundary. Next server code must not receive secrets. No extra backend or central
DB at inception. The app has no signing key, custody or user account system.
Source-owned UI components stay separate from SDK and private-state adapters.

## Proposed funded-note protocol (M1 gate, not a claim of support)
Choose one escrowed coin per payment to minimize splitting/change complexity.
Sender funding supplies the coin to the contract; an audited `receiveShielded`
call must enforce the actual receipt. Store only a blinded note commitment in a
contract accumulator. A claim proves membership privately, spends the matching
qualified escrow coin, records a nullifier and creates the exact receiver output
atomically. Do not store a public note-ID-to-claimed mapping that trivially joins
funding with claiming. A proposed append-only note accumulator plus spent-nullifier
set must be checked against the pinned Compact data structures and public effects.

A canonical commitment must bind protocol domain/version, the actual deployment
network domain and contract address, asset color, atomic amount, escrow coin nonce
and claim authority. Binding a browser-supplied network string is insufficient:
anchor network configuration in the deployment/contract and transaction verifier.
Do not claim cross-network binding until the contract's available self-address and
network assumptions are validated. Cross-deployment replay tests are required.

Select documented `persistentCommit`/hash primitives and validate exact Compact
encoding against generated runtime test vectors. A JavaScript SHA-256 over JSON is
not assumed equivalent. Derive a domain-separated nullifier from private authority
and note identity; publicly revealing it must not reveal the public funding note
association. Nullifier uniqueness, membership soundness, root freshness and replay
resistance need compiled tests. If roots are stateful, evaluate a bounded history
rather than silently making old notes unclaimable when another note is inserted.

This is deliberately not an invented Compact circuit listing. M1 must establish
that coin selection, membership and all library effects preserve the claimed
privacy before freezing the protocol. A compile-only witness probe lives separately.

## Receiver knowledge and independence
The protected fragment payload must carry every required private opening: claim
authority, coin nonce, color, amount, protocol version and precise contract/network
binding. Public locator fields may include a funding transaction reference and
note index only if the threat model accepts their disclosure to queried services.
Do not put private openings in indexer queries. Obtain coin qualification/Merkle
positions and authenticated note paths from verified chain data; validate they
correspond to the actual received coin. Do not rely on the sender browser to serve
witnesses, on a raw self-asserted `mtIndex`, or on an in-memory deployment address.

The public docs distinguish fresh and qualified coins and expose naming variations
across tutorials (`mt_index`) and current type definitions (`mtIndex`). Inspect
installed types rather than guessing field spelling. If no privacy-preserving,
independent witness-discovery path works, record that exact blocker; do not switch
to public transfers or pretend an encrypted receipt solves it. [S10, S11]

## Destination and competing claims
Make the receiver the caller when required by wallet coin-discovery behavior.
Current tutorial guidance warns about notification to another wallet; a successful
send helper alone is not evidence the intended receiver can spend the output. The
wallet key returned by `ownPublicKey()` is not, by itself, signer authorization.
The bearer secret authorizes the note; the recipient destination must be bound to
the proof/transaction's exact output and applicable wallet authorization. [S10]

Someone copying a proof without its witness must be unable to replace the output.
Someone holding the secret may construct a new competing claim by design. Nullifier
check/write, original coin consumption and receiver output must succeed or fail
atomically. Concurrent claim tests must show one settlement, not two UI successes.
Receiver spendability requires a subsequent controlled receiver-originated spend
or equivalent ledger-backed evidence, not just a displayed balance.

## Private persistence and transport
Use encrypted IndexedDB with authenticated namespace (network, contract, wallet,
schema), random encryption nonces, explicit unlock and a reviewed password-to-key
strategy. Never persist the key alongside ciphertext or derive it from a public
wallet address. Design an encrypted export/recovery format and transactional
migration before funding. Exact KDF parameters remain a benchmarked/security-reviewed
M2 decision, not a guessed constant. Keep an intent record before a wallet can fund.

Capture fragment data client-side, move it to the unlocked protected session/store
and immediately remove the address-bar copy without losing recovery. Use a compact
versioned binary codec with strict size, integer, length and tag bounds; inspect
QR payload lengths at actual accepted asset precision. Generate QR locally. A
backend blob service is not justified unless measured size constraints require it;
then only ciphertext may leave the client and keys must remain in the fragment.

## Reliability and durable identity
Keep transaction state separate from payment state. Persist draft and submission
identity, distinguish finality from wallet synchronization, and reconcile after
network interruptions. A lost response is not permission to re-fund. Record contract
address, network, transaction, source/build/toolchain hashes and observed finality
in `deployments/`. Preserve earlier contracts until no funded obligations remain.
Never update every record to the newest address indiscriminately.

## Interfaces to finalize
`src/domain/` already supplies atomic-unit helpers and design-only types. The SDK
and private-store ports do not implement payments. After M1, define FundingIntent,
ClaimOpening, VerifiedFunding, PreparedClaim and reconciliation error unions from
observed SDK types. Private fields must not be accepted by server components.
Prefer small explicit adapters over a generic multi-chain framework.
