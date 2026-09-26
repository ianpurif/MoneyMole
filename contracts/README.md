# Contracts
`probes/claim-commitment.compact` is a compiled, compile-only syntax probe. It
uses a private witness, public commitment and explicit disclosure; it transfers
nothing and must never be deployed as the payment product. Run `npm run compile:probe`.

`private-payments.compact` is the M1 candidate: exact one-asset receipt, deployment-
bound note, private membership, spent nullifier and exact caller-directed output.
`issuance/test-asset.compact` is a separate one-time issuer of 1,000,000 atomic
non-redeemable Preprod test units (proposed display precision: zero decimals).
The owner selected this asset category; deployment and issuance are not authorized.
Run `compile:contracts`, `compile:issuance`, `verify:artifacts`, `test:contracts`.
Local `test:proving` needs the loopback proof service. These commands have passed
within their recorded scope, but no sealed transaction/live payment is verified.
Issuance may never be called during claiming.
See `docs/tasks/M1-feasibility.md` and `docs/PRIVACY.md` before changing this directory.

The shielded-io.compact diagnostic has no authorization and MUST NEVER be deployed or funded. Its generated types use mt_index/is_some with compiler 0.31.1. See docs/disclosure-audit.md. Neither probe satisfies compile:contracts or real payment acceptance.
