# Durable deployment records

The native NIGHT payment escrow is recorded in
`preprod/night-payment-escrow.json`: address
`685d5f51be99ac8cb2f56d82c806aa92bcbd93ffe74137b409efd5724b9adc63`,
deployment transaction ID
`0043457907ca3523d4aa6e1a570a2ecf5d0a5239f2a456d736442b10be9e660544`
on Preprod. It is the app's verified default. Read-only verification checks
finalized deployment, native asset and both fund/claim verifier keys:

```sh
npm run verify:deployment
```

The historical issuer in `preprod/test-asset-issuer.json` is a separate contract,
not a NIGHT escrow. Never redeploy it after a session restart. A new owner-approved
escrow can be exported after finality and verified with `--record <path>`; preserve
all older records while notes may remain funded. Follow `record.schema.json`;
never include claim openings, private bearer authority, local recovery, wallet
keys or unpublished payment relationships. NIGHT amounts and addresses themselves
are public unshielded ledger data.
Encrypted recovery exports belong outside Git and are not deployment evidence.
