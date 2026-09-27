# Native Preprod NIGHT payments

Owner directive: replace the custom issuer token with native Preprod NIGHT.
This supersedes the earlier shielded test-asset product scope. DUST remains fee
resource only; there is no application issuance, wrapping or replacement token.

## Protocol and disclosure

NIGHT is unshielded. Use Compact nativeToken(), receiveUnshielded() and
sendUnshielded(), wallet getUnshieldedBalances()/getUnshieldedAddress(), and
unshielded transfers. Amounts and payment addresses are public on-chain. Keep
bearer secrets, private witnesses, wallet authorization and encrypted recovery
client-side; do not claim shielded NIGHT or private transfer metadata.

One NIGHT is 1,000,000 STAR. Parse user decimal strings with six decimals and
integer arithmetic, and store atomic STAR amounts. A funded note binds domain,
Preprod, deployment, native asset, amount, random nonce and bearer authority.
Claim atomically consumes its authorization and sends the same funded NIGHT to
the receiver's unshielded address. The proof binds the payout destination.

## Migration

Use a separate NIGHT contract/artifact identity, mm2 links, and distinct payment
and deployment recovery namespaces. Never reinterpret mm1 test-token records or
an old escrow as NIGHT. Retain original issuer, legacy contract sources/artifacts
and encrypted browser records for recovery; no automatic upgrade or redeployment.
Remove test issuance from the primary application. A new NIGHT escrow requires
an owner-approved deployment; every real transfer requires owner approval.

Settlement evidence must check native unshielded contract effects and outputs,
canonical finality and wallet balance deltas. B may already hold NIGHT to generate
DUST; spendability checks must use its recorded baseline rather than requiring
zero NIGHT. Unknown/partial outcomes never authorize retry.

## Verification

Compile with the installed 0.31.1 compiler; test generated fund/claim circuits,
amount bounds, replay, destination binding, real encrypted saved-record recovery,
native effects/output reconciliation, wallet rejection, proving and browser UI.
Historical custom-token evidence is not NIGHT acceptance. Live deployment,
two-wallet credit, spend and recovery remain pending until actually observed.

## Primary references checked 2026-09-27

- https://docs.midnight.network/compact/standard-library/exports
- https://github.com/midnightntwrk/example-private-party
- https://docs.midnight.network/glossary (NIGHT, STAR and tNIGHT)
- Installed dapp-connector-api 4.0.1 and ledger-v8 types.
