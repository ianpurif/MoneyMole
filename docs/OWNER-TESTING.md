# Owner QA — current native NIGHT flow

This is a manual acceptance guide, not a claim that the steps have been performed.
The verified default escrow already exists on Preprod at
`685d5f51be99ac8cb2f56d82c806aa92bcbd93ffe74137b409efd5724b9adc63`.
Its [public deployment record](../deployments/preprod/night-payment-escrow.json)
can be checked with `npm run verify:deployment`. Do **not** redeploy it merely to
resume a session. The old issuer is not a NIGHT escrow. NIGHT amounts and
unshielded addresses are public; DUST pays fees only.

## 1. Run the local app

Use the [RUNBOOK](RUNBOOK.md) on Linux/WSL2 with Node 22, the pinned Compact
toolchain, Docker and the local prover at `127.0.0.1:6300`. Keep the Next.js
frontend at **http://localhost:3000**. Do not switch to `127.0.0.1:3000`, which
has different browser storage and wallet permissions. Compile the current
contract and run the local checks before wallet QA:

```sh
npm ci --no-audit --no-fund
npm run compile:contracts
npm run verify:artifacts
npm run services:up
npm run test:proving
npm run build
npm run start
```

Stop an existing app process on port 3000 before rebuilding or starting another.
On this configured Windows host, prefix npm commands with
`wsl --exec bash .local/run.sh`. Public endpoint settings are in
`config/preprod.json`; no wallet credential belongs in `.env.local`.

## 2. Prepare independent wallets

Use two separately created Preprod wallets, preferably in separate browsers:
Wallet A sends and Wallet B receives. Click **Connect Wallet** and explicitly
select the detected wallet. 1AM is primary; supported Lace is optional, never an
automatic fallback. The owner personally approves connection and signing prompts.
A needs the test NIGHT amount plus available DUST; B needs DUST for claiming and
any later transfer. Record both starting NIGHT balances privately and keep
unrelated transfers out of the test interval. Do not enter a wallet seed in
MoneyMole.

Unlock MoneyMole once with an enrolled passkey or the local app recovery
passphrase. The default escrow should be selected and verified automatically.
**Tools → Create / recover a payment escrow** is for a different compatible
escrow or a deliberate new deployment; it is not a required step for the default.
Any new deployment requires separate explicit owner approval and a saved public
record plus private encrypted backup.

## 3. Send, claim and check value

1. In Wallet A, open **Send**, enter a small NIGHT amount and choose **Send NIGHT**.
   The resumable modal saves encrypted intent, checks fresh NIGHT/DUST balances
   and prepares the proof. Review and approve the funding in the wallet only if
   the network, amount and escrow are correct. Stay in the modal until canonical
   confirmation. Record the public transaction identifier and balance change.
2. Share the resulting claim link or QR **privately** with Wallet B. Do not paste
   it into issues, chat, logs, CI or evidence files. Close or disconnect A to
   establish that B does not depend on A's browser session.
3. In Wallet B, open the link, unlock, choose **Receive NIGHT**, and approve its
   claim in the wallet. Confirm B's actual NIGHT balance increased by the claim
   amount and the escrow note became spent. Record a sanitized public receipt.
4. In the confirmed receive modal, optionally use **Send received NIGHT** to
   transfer that exact value to A's *unshielded* NIGHT address. This is a separate
   wallet transfer, not a contract `claim` call. Confirm the recipient balance
   and account for DUST fees separately.

Closing the modal preserves progress. Use **Resume payment** or **Activity → Open
payment** to return to it. **Check confirmation** only reconciles the saved
identifier; it must never authorize or submit the original transaction again.
Do not start a duplicate funding or claim from an unknown/partial outcome.

## 4. Recovery and negative checks

Reload, reconnect explicitly, unlock once and reconcile the same records.
Export encrypted backups from Activity and keep them outside Git. Import only
into the correct wallet/network/escrow with the original export secret. Confirm
that a wrong secret, changed amount/deployment/destination and a repeated claim
fail without a second NIGHT payout. A passkey can unlock only where it was
enrolled; a fresh workspace does not recreate lost bearer authority.

For network-side evidence, use the [acceptance matrix](TESTING.md) and the
read-only `npm run test:preprod -- --manifest <private-manifest.json>` verifier
with actual observed identifiers. The manifest and any identity/consent records
stay outside Git. Public receipts may show native amounts and unshielded addresses,
but must not include bearer secrets, claim fragments, witness inputs, passphrases,
private keys or unrelated payment relationships. Local fixtures and a successful
deploy check do not prove the full two-wallet journey.

## Submission boundary

Only completed observations count. The [README evidence map](../README.md#level-1-evidence)
now links the supplied hosted app, X profile and video page. Verify the hosted
wallet/prover/payment journey and review the video against each claimed Level;
page reachability alone does not pass acceptance. Three locally inspected
screenshots still need publication. The local feedback CSV needs consented,
independently checked user evidence and feedback-to-change attribution before a
50/70-user or completed-loop claim. The latest checked
[CI run 36555725199](https://github.com/ianpurif/MoneyMole/actions/runs/36555725199)
failed; inspect any later run before claiming a passing current pipeline.
The [Level audit](LEVEL-AUDIT.md) lists the remaining evidence without assuming
organizer approval.
