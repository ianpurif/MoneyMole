# Durable deployment records

The confirmed issuer is in `preprod/test-asset-issuer.json`. It is separate from
the payment escrow. Recover and reuse it; never redeploy after a session restart.

A payment escrow record has not yet been observed. After explicit browser
approval and finality, use **Save public deployment record**, retain it as
`preprod/<address>.json`, then run:

```sh
npm run verify:deployment -- --record deployments/preprod/<address>.json
```

This checks compiled keys, asset, build identity and finalized chain state.
Keep older records while funded notes may remain. Follow `record.schema.json`;
never include openings, private amounts/relationships, claim secrets or wallet keys.
Encrypted recovery exports belong outside Git and are not deployment evidence.
