# Generated material
Compilation writes current native NIGHT code/keys to `night-payments/`.
`private-payments/` and `test-asset/` retain legacy regression artifacts; they are
not the current payment asset. `probe/` and `coin-probe/` are diagnostics only.
Run compile:contracts, compile:legacy and compile:issuance, then verify:artifacts.
Never hand-edit outputs. Rebuild using the pinned compiler; record source and
output digests. Proving material is distinct from private witnesses and keys to
wallets. The latter must never enter this directory or version control.
