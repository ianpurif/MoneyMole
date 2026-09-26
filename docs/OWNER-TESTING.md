# Owner-run final acceptance

The coding pass intentionally did not run app/E2E tests. This procedure exercises
the implementation; it is not a statement that any step has passed.
Use the pinned tooling and exact compiled build. No push is required.

## Preparation and approvals

Use Chrome / Wallet A and Brave / independent Wallet B, both 1AM on Preprod.
Both are already reported connected with DUST. Start the current app and local
prover as described in USAGE.md. Never approve a different network or expose keys,
claim links, witnesses or recovery passphrases to tools, logs or other people.

Every deployment, issuance, funding, claim and controlled spend is a distinct
owner-approved transaction. Preparation and read-only reconciliation do not submit.
Do not deploy the issuer again. Recover its existing encrypted record and compare
the displayed address with deployments/preprod/test-asset-issuer.json.

Run local verification when ready:
```sh
npm run compile:contracts
npm run compile:issuance
npm run verify:artifacts
npm run lint
npm run typecheck
npm run test:unit
npm run test:contracts
npm run test:integration
npm run build
npm run test:browser
```

These commands do not replace real wallet acceptance. The browser fixture uses
synthetic providers. With the trusted prover running, `npm run test:proving`
uses synthetic openings for real proof generation; do not run it concurrently
with a browser proof.

## Real happy path

1. A recovers the confirmed issuer and, if still unissued, separately approves the
   one-time 1,000,000-unit issuance. Check finality and A's actual shielded balance.
2. Recover an existing escrow or explicitly approve a new compatible escrow once.
   Export its public deployment record and encrypted recovery.
3. B must start with zero of this test asset for controlled-spend attribution.
   Record private before/after observations locally, with DUST tracked separately.
4. A creates a small positive whole-unit draft, saves encrypted recovery, prepares
   and approves funding. Sharing must stay unavailable until finalized funding.
5. Transfer the bearer link privately or scan its local QR. Close/disconnect A.
6. B opens the link, checks fragment removal, unlocks, verifies/saves the opening
   encrypted and approves claiming. Confirm actual finality and receiver balance.
7. Reload B, reconnect/unlock the same namespace and reconcile the saved receipt.
   Export recovery and exercise import into an empty namespace with the same wallet.
   The import alone must not certify settlement.
8. B separately approves the controlled spend to another shielded wallet. Confirm
   the spend transaction, destination credit and B's zero test-asset balance.
9. Reopen A and reconcile: the original funding is spent and cannot be shared as
   unclaimed. A retained link or concurrent second claim must not pay again.
10. Complete the remaining T01–T24 matrix in TESTING.md. Public chain activity does
    not establish every negative case, privacy property or external requirement.

Record sanitized assertions, public transaction identifiers/block hashes and source
hashes only. Do not save raw network traces containing proofs/openings. The chain
report associates funding/claim/spend IDs; keep it local in ignored reports unless
the owner explicitly consents to publishing that linkage.

## Read-only chain evidence

Save the exported escrow record as deployments/preprod/<address>.json and create
an ignored reports/preprod-manifest.json containing these public fields:

```json
{
  "schemaVersion": 1,
  "network": "preprod",
  "deploymentRecord": "deployments/preprod/<actual-address>.json",
  "fundingId": "<actual finalized funding identifier>",
  "claimId": "<actual finalized claim identifier>",
  "spendId": "<actual finalized controlled-spend identifier>"
}
```

Replace placeholders with observed values; do not invent an evidence file.
Then run:
```sh
npm run verify:deployment -- --record deployments/preprod/<address>.json
npm run test:preprod -- --manifest reports/preprod-manifest.json
```

These commands re-query official Preprod indexer and node finality, deserialize
native transactions, verify deployment identity and inspect real action/event
kinds. They cannot independently establish private amount conservation, wallet
independence, destination credit, browser recovery or human identity. They do not
sign, deploy, issue or submit. Exit 2 means missing owner inputs; exit 1 means
verification failed; exit 0 passes only the scope recorded in the report.

## Full acceptance record

Create reports/owner-acceptance.json only after observing every applicable matrix
case. Its format is:
```json
{
  "schemaVersion": 1,
  "ownerReviewed": true,
  "observedAt": "<actual ISO timestamp>",
  "manifestPath": "reports/preprod-manifest.json",
  "cases": [
    {
      "id": "T01",
      "result": "passed",
      "source": "owner_observed",
      "evidencePath": "reports/owner-T01.json",
      "evidenceSha256": "<SHA-256 of sanitized evidence>"
    }
  ],
  "subjects": [
    { "path": "src/lib/midnight/payments.ts", "sha256": "<current SHA-256>" },
    { "path": "src/lib/midnight/payment-codec.ts", "sha256": "<current SHA-256>" },
    { "path": "contracts/private-payments.compact", "sha256": "<current SHA-256>" },
    { "path": "package-lock.json", "sha256": "<current SHA-256>" }
  ]
}
```

Include one case for every T01–T24 row and the complete current source subject list;
the abbreviated example is intentionally insufficient. The verifier requires all
tracked src/contracts/scripts/tests and package/build/toolchain/CI files. The
implementation evidence contains that list, but copy its hashes only if they still
match the exact source you exercised. Use source automated only for a real executed result, otherwise
owner_observed. SHA-256 can be computed locally with sha256sum or Get-FileHash.
Evidence may establish a scoped failure; never label it passed to satisfy the tool.

`npm run verify:product -- --acceptance reports/owner-acceptance.json` checks
matrix completeness, evidence hashes, source identity and revalidates the chain
manifest. A passing report remains partly owner-observed. T23 requires a real
authorized remote CI run; T24 and external participation/eligibility require
genuine consented evidence. Missing external evidence must remain pending.

## Minimal failure report

Report the browser/wallet, button or phase, sanitized message and public transaction
identifier if present. Include expected versus observed final state. Never report
a claim link, opening, passphrase, seed, private key or raw proof request.
Keep the original encrypted records and deployment identity for repair.
