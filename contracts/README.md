# Compact contracts

night-payments.compact is the current native NIGHT escrow. fund receives existing
unshielded NIGHT and commits its amount/nonce/authority; claim spends the same NIGHT
to a proof-bound UserAddress after membership and nullifier checks. DUST pays fees.
No current payment operation issues assets. NIGHT amounts and addresses are public.

Compile with Compact 0.31.1 through Linux/WSL (Windows compact.exe is unrelated):

```sh
npm run compile:contracts
npm run compile:legacy
npm run compile:issuance
npm run verify:artifacts
npm run test:contracts
```

managed/night-payments contains reproducible generated code/keys after compilation;
these large outputs are ignored in Git. The [current Preprod escrow](../deployments/preprod/night-payment-escrow.json)
is already deployed and uses the current fund/claim verifier keys. Legacy
private-payments.compact and issuance/test-asset.compact retain their original
identities and compile into separate directories; the original 1,000,000-unit
issuer is not the payment asset. Never edit generated artifacts or redeploy a
historical contract on restart. Any **new** product deployment needs the matching
NIGHT verifier keys and explicit owner approval; the existing escrow can be reused.
Probe contracts are diagnostics: never deploy/fund.

Generated tests execute 12 NIGHT cases plus 13 legacy regression cases. Local
proving additionally constructs and proves real SDK fund/claim transactions over
synthetic state; it never signs, seals or submits a wallet transaction.
