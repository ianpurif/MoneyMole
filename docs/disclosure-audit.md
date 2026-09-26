# M1 diagnostic disclosure review

## Candidate review, 2026-09-26

`private-payments.compact` and the separate test issuer compile with 0.31.1.
Thirteen generated-runtime cases pass; local proof-server 8.1.0 constraint checks
and proof generation pass for synthetic fund, claim and issue calls. These checks
do not establish native coin membership, sealed transaction validity or anonymity.

The candidate's public ledger contains the supported asset color, an append-only
note tree and a spent-nullifier set. Commitment inputs bind the fixed Preprod
domain, `kernel.self()`, exact fresh coin fields and private bearer authority.
The fixed string is domain separation, not proof of the chain network: native
transaction/deployment network validation and cross-network tests remain required.
`ownPublicKey()` selects the receiver output; secret knowledge is the authorization.
No claim path calls a mint helper. The separate issuer has an issuer-secret
commitment and one-time supply flag; its mint helper has explicit disclosure.

The tree checks its current root. New deposits invalidate old paths, so the
receiver must refresh the path from authenticated public state. Runtime tests
reject stale paths and accept refreshed ones. Capacity is 65,536 deposits; the
app must reject new funding at capacity and preserve claims against old deployments.
This candidate makes no claim about anonymity-set size or timing correlation.

Runtime replay tests use updated ledger state; they are not a concurrent native
transaction test. Claim destination binding against a copied proof, qualified-coin
discovery with the sender absent, and inspection of sealed public data remain live
M1 gates. Test-asset issuance and deployment require concrete owner approval.

## Diagnostic background

Scope: compiler-generated code from `contracts/probes/shielded-io.compact`,
Compact compiler 0.31.1/runtime 0.16.0. This unauthorized diagnostic must never be
deployed or funded. It is not the product contract, a proof, or a real payment.

The compiler initially rejected private inputs to `receiveShielded` and
`sendShielded`: the helpers expose coin commitments/nullifiers and branch effects.
Explicit `disclose` annotations now acknowledge these effects for inspection.
They do not establish acceptable privacy. No real secret was used or recorded.

The generated `receiveShielded` implementation queries the contract self-address,
creates a Zswap output and records its commitment in the receive effects.
`sendShielded` creates the qualified Zswap input and receiver output, with a
conditional change output. Its native effects and public transcript must be checked
in an actual sealed transaction before any claim of unlinkability. Empty exported
arguments and absence of application ledger fields do not mean zero disclosure.

Observed type mismatch with current web documentation: the installed compiler
emits `mt_index` and `is_some`, matching installed runtime declarations, rather than
the documentation's `mtIndex`/`isSome`. Use generated types for adapters.

Remaining M1 gates: independently discoverable qualified escrow coins; validated
membership/commitment/nullifier construction bound to deployment and asset; output
destination binding; actual proof and public transcript review; independent 1AM
receiver credit and subsequent spend with the sender unavailable. The owner authorized implementing the versioned codec and sharing route before
live acceptance. Their presence does not resolve these gates.

## Local escrow qualification candidate
The client-only feasibility helper reconstructs a contract-owned commitment from
an opening locally, matches exactly one public contract/commitment/index observation,
and asks ledger-v8 to construct an input against the supplied coin tree. It rejects
missing/ambiguous observations, changed openings, invented indices and absent coins.
The synthetic fixture must apply postBlockUpdate before constructing a spend input;
the native runtime rejects an un-rehashed tree. Those historical local cases do not authenticate an indexer or establish live
settlement. The implemented payment controller now checks official node finality,
transaction identity and the spent set, then matches claim input/output events.
The new adapter has not undergone final real-wallet testing.
