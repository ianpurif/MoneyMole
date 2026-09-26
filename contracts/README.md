# Contracts
`probes/claim-commitment.compact` is an uncompiled, compile-only syntax probe. It
uses a private witness, public commitment and explicit disclosure; it transfers
nothing and must never be deployed as the payment product. Run `npm run compile:probe`.

M1 creates `private-payments.compact` only after inspecting the pinned compiler and
runtime. `npm run compile:contracts` fails with exit 2 while that file is absent.
Issuance is a separate contract/module and may never be called during claiming.
See `docs/tasks/M1-feasibility.md` and `docs/PRIVACY.md` before changing this directory.
