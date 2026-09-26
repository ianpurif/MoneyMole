# Acceptance matrix

No live product case below has been executed during preparation. The pure amount,
requirement-validation and attestation-integrity tests are utility tests, not
payment acceptance. `tests/unit` is the future installed Vitest execution layer;
`tests/boilerplate` can run on Node 22 without npm dependencies.

| ID | Scenario | Layers | Required observation |
|---|---|---|---|
| T01 | Actual value conservation | contract, proving, live | Sender/escrow/receiver shielded amounts reconcile; claim has no mint; DUST accounted separately. |
| T02 | Independent receiver | live, actual Lace | Sender context unavailable; B obtains and spends the funded coin. |
| T03 | Wrong secret | unit, contract, proving | Claim rejected; funded value remains unchanged. |
| T04 | Tampered amount/asset | codec, contract, proving | No substituted color or amount can settle. |
| T05 | Wrong network/contract | contract, live | Cross-domain and cross-deployment claim cannot consume a note. |
| T06 | Wrong coin/qualification/path | contract, proving | Merkle position and opening correspond to the real escrow coin. |
| T07 | Destination substitution/copied proof | proving, live | Copied proof cannot redirect the receiver output. |
| T08 | Duplicate/concurrent claims | contract, live | At most one settlement and one receiver output; rejected competitor is not a success. |
| T09 | Zero/negative/overflow/precision | unit, contract | Invalid amounts fail at the appropriate boundary; no float math. |
| T10 | Insufficient asset or DUST | integration, live | Separate truthful readiness and recoverable failure; no false funded state. |
| T11 | Rejected connection/signing | integration, actual Lace | No synthetic authorization; preserved local intent. |
| T12 | Prover unavailable/wrong service | integration, proving, browser | Bounded error, no fallback to an arbitrary remote prover. |
| T13 | Stale indexer/RPC disconnect | integration, live | Unknown/stale distinct from finalized and wallet-synced. |
| T14 | Interrupted submission | integration, live | Reconcile original identifier; no blind re-fund or re-claim. |
| T15 | Reconnect/reload/account switch | unit, integration, browser | Encrypted namespaces remain isolated and recoverable. |
| T16 | Malformed/oversized claim payload | unit, browser | Strict bounds and schema rejection, no raw payload logging. |
| T17 | Corrupted ciphertext/wrong unlock | unit, browser | Authenticated failure without destroying original data. |
| T18 | Imported receipt | integration, browser | Remains local/unverified until actual contract/transaction matches. |
| T19 | Explicit and implicit disclosures | compiled audit, proving, live | Inspected public data contains no unintended openings, raw amount or participant mapping. |
| T20 | Fragment and QR privacy | browser, network inspection | No secret to server/resources/referrer; scrubbed address; local QR round trip with measured bounds. |
| T21 | State migration/concurrent tab | unit, integration | Atomic writes and safe old-version recovery; no lost funded intent. |
| T22 | Old deployment continuity | integration, live | Funded notes on earlier retained contracts remain discoverable/claimable. |
| T23 | CI source/artifact identity | local, actual remote CI | Pinned graph, compiled outputs and tested source hashes match real run. |
| T24 | Participation evidence | local trusted review | Consent, deduplication, supported attestation verification and explicit wallet/human distinction. |

## Layer boundaries
Deterministic tests may mock adapters only within test fixtures. Contract tests
exercise compiled circuits rather than a hand-written simulation of the rules.
Integration tests exercise real adapter boundaries where available and label any
isolated mocks. Real proving tests use actual generated keys and the trusted local
service. Live Preprod acceptance additionally observes chain finality and wallet
credit/spendability. A browser test with a mock wallet does not prove Lace works.

Build product suite entry points under `scripts/product/` as specified in task cards.
They must reject absent or empty test globs and skipped necessary cases. Record
which checks are deterministic, proving, live or owner-observed. Test data is
synthetic only inside isolated test fixtures; never count it as real participation.

## Evidence hygiene
Do not capture raw claim fragments, witness requests, wallet secrets, unlocked
private state or payment relationships. Extract assertions and hashes into sanitized
technical evidence. Keep sensitive raw verification material local and outside Git.
The verifier reports incomplete coverage explicitly instead of weakening acceptance.
