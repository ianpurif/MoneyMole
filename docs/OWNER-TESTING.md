# Owner QA — native NIGHT only

This is the current v2 flow. The original 1,000,000-unit issuer and mm1 links are
legacy; do not issue that asset or use its contract as a NIGHT escrow. NIGHT is
unshielded: amounts and addresses are public. Use Preprod only. DUST pays fees.
Every connection, deployment and transaction approval is your own manual action.
Never give an agent a seed, private key, recovery passphrase or bearer link.

## 1. Start the local prerequisites

Use Docker Desktop with WSL2 integration, Linux Node 22.16.0 / npm 10.9.2, Compact
0.31.1 and the repo's pinned dependencies. On this configured Windows host, run
from the MoneyMole repository in PowerShell:

```powershell
wsl --exec bash .local/run.sh node --version
wsl --exec bash .local/run.sh npm --version
wsl --exec bash .local/run.sh npm ci --no-audit --no-fund
wsl --exec bash .local/run.sh npm run services:up
wsl --exec bash .local/run.sh npm run compile:contracts
wsl --exec bash .local/run.sh npm run compile:legacy
wsl --exec bash .local/run.sh npm run compile:issuance
wsl --exec bash .local/run.sh npm run verify:artifacts
wsl --exec bash .local/run.sh npm run test:proving
wsl --exec bash .local/run.sh npm run build
wsl --exec bash .local/run.sh npm run start -- --port 3000
```

Stop an existing app with Ctrl-C before rebuilding or starting on its port. Leave
the final command running. The ignored .local/run.sh selects this host's verified
WSL runtime; a fresh machine uses the equivalent npm commands after installing
Node/Compact. The pinned Compose proof server listens at http://127.0.0.1:6300.
Actual synthetic proof generation must pass; an open port alone proves nothing.
The app is http://localhost:3000. Do not alternate localhost and 127.0.0.1: browser
storage and extension permissions are origin-specific.

Check .env.local has PROOF_SERVER_PORT=6300. All other reviewed public endpoints
and NIGHT metadata come from config/preprod.json, not invented NEXT_PUBLIC values.
No NIGHT contract address belongs in .env.local. The selected escrow is stored in
the browser and public exports; its private deployment recovery is encrypted.
No local Midnight node/indexer is required: the app uses configured official
Preprod services. Do not put any wallet credential in an environment file.

## 2. Prepare independent wallets

Chrome = Wallet A (sender), Brave = Wallet B (receiver), both real 1AM.xyz and both
on Preprod. Use separate independently created wallets, not two views of the same
account. Open the app in each browser, **Connect → 1AM**, and approve
connection manually. Confirm Preprod and DUST readiness in each wallet.

A needs at least the test amount of native Preprod NIGHT (use **1 NIGHT**) and
sufficient available DUST for escrow deployment and funding. B needs available
DUST for claim and controlled spend. B may already own NIGHT; it need not start
at zero. Obtain actual Preprod NIGHT through the current official network faucet
or a funded Preprod wallet, then let 1AM's DUST generation/synchronization finish.
MoneyMole does not mint NIGHT or convert the legacy test asset. No fixed DUST
quantity is promised: the wallet estimates each transaction's cost. If the wallet
cannot fund the fee, wait/top up through the wallet before continuing.

Record A and B's initial **NIGHT** balances privately (call them A0 and B0). Copy
A's **unshielded NIGHT address**, not its shielded address. Avoid unrelated NIGHT
transfers during the test so exact balance deltas remain attributable.

## 3. Deploy or recover a compatible NIGHT escrow

In Chrome/A, open **Tools → Create / recover a payment escrow**.
Expand it. Enter a separate local recovery passphrase (at least 16
characters; never a wallet seed). Click **Prepare / unlock escrow**. This prepares
an unsigned native NIGHT deployment or opens the existing v2 staging record.

If it already has a transaction identifier, click **Check deployment**; do not
approve a second deployment. If finalized, reuse it. Otherwise, when the review
shows Preprod and a new NIGHT escrow, click **Approve escrow deployment**, then
review and approve in 1AM. Expected: submitted, then **Check deployment** yields
**chain verified** on the finalized Preprod chain. No NIGHT is issued or deposited
by deploying; only DUST pays the fee.

Click **Save public deployment record** and **Save encrypted escrow recovery**. Keep the encrypted
file and passphrase private. The public download is
moneymole-night-preprod-deployment.json; copy it to reports/night-escrow.json.
Successful reconciliation selects the escrow in the workspace.
Use this same address in A and B. It is not the historical issuer address
47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635.
A compatible escrow can be shared or reused by senders; each payment is bound to
its actual escrow. No new escrow per payment is required.

If the tab locks while handling a wallet popup, unlock with the same wallet and
passphrase and check the saved deployment. The encrypted identifier survives;
never infer failure from a locked or closed tab.

## 4. Wallet A funds 1 NIGHT

In Chrome/A, enter the verified **Preprod escrow address** and a local payment
recovery passphrase, then **Unlock payment workspace**. Check the available NIGHT
balance. Select **Send**, enter **1** in **Amount in NIGHT**, and click **Save
payment draft**. Expected: Send displays **Sending 1 NIGHT**, draft.

In Activity, select the payment and expand **Recovery & receipts → Save encrypted
recovery** before authorizing. Use **Open in Send**, then **Prepare funding**;
keep the tab visible while the local prover runs.
Expected: prepared, **Approve funding of 1** appears. Click it and approve in 1AM
only if the review is Preprod and deposits 1 NIGHT into the intended escrow, with
DUST as fees. Click **Reconcile** until funding is finalized and verified.
Expected: A NIGHT = A0 - 1; escrow receives exactly 1 NIGHT. Sharing is enabled
only after the actual successful funding transaction contains this note.
Save updated encrypted recovery and **Save public receipt**; keep funding ID.

## 5. Link, QR and receiver independence

Choose **Show claim link / QR**. The private link contains /claim#mm2.…; its QR is
created on this device. Copy it privately into Brave/B. Do not paste it into chat,
Git, a terminal, evidence reports or an online QR decoder. For optical QA, use a
trusted local/offline scanner; confirm it decodes the exact same private link.
Do not send the link to an external scanning service. Finish sharing, then lock
or close A's workspace so B has no sender session/private store available.

In Brave/B, open the link at the same local app origin. Expected: the fragment is
removed from the address bar, the claim is captured locally and its escrow is
selected. If pasting manually, choose **Receive**, expand **Select escrow from a
claim link**, paste, then **Use claim escrow**. Unlock B's workspace with B's own
local passphrase; choose **Verify and save claim**. Expected: verified funded
claim saved encrypted; Receive displays **Receiving 1 NIGHT**. Save encrypted
recovery from Activity, then **Open in Receive**. Anyone with the link can compete
to claim, including A.

## 6. Wallet B claims that NIGHT

Choose **Prepare claim**, then **Approve claim of 1**, and approve the transaction
in B's 1AM. Keep the tab visible except for the necessary wallet interaction.
Click **Reconcile** until claim finality and wallet synchronization are confirmed.
Expected: the existing escrow balance decreases by 1 NIGHT; B NIGHT = B0 + 1.
The claim mints nothing. The public payout address is B's unshielded NIGHT address.
A remains A0 - 1. DUST fee changes are separate from those NIGHT balances.

Reload Brave, reconnect/unlock if needed, choose **Activity → Select payment**, and
**Reconcile**. Expected: same transaction and confirmed claim after fresh checks,
not a new claim. Try importing/verifying the original link again: it must report
already claimed/refuse another claim. No second NIGHT payout is allowed.

## 7. Spend the received NIGHT

On B's confirmed claim in Receive, choose **Send received NIGHT**, then expand
**Controlled spendability check** in Send. Enter A's actual
Preprod unshielded NIGHT address in **Destination NIGHT address**. Click **Approve
controlled spend of 1**, review and approve in 1AM, then **Reconcile**.
Expected: **Spend: finalized · verified**, B NIGHT returns to B0 and A returns to
A0. The verifier checks exact native inputs, change, recipient output and amount;
a sent identifier alone is not success. Save B's latest encrypted recovery and
public receipt, including spend ID. DUST fees are not returned.

## 8. Recovery and privacy checks

Reload A and B, unlock the same namespaces, select the saved records and reconcile.
A's record shows already claimed; B's record confirms claim plus controlled spend.
Lock/disconnect and verify private links/QR/records disappear. Switching accounts
must not unlock the other wallet's records. Wrong passphrase or damaged encrypted
file must fail without erasing the originals.

For independent import QA without deleting existing data, start the same built
app in another terminal on port 3001. Use the same wallet with that new origin,
manually approve its connection, select the same NIGHT escrow, create a local
passphrase, then **Tools → Import encrypted payment recovery**. Enter the
original export passphrase and choose the previously saved encrypted JSON.
Expected: imported local record first; **Reconcile** re-establishes its exact
chain state. No sign/submit should be needed. Stop the extra server afterward.

Privately inspect browser network requests: no bearer token in Next API requests,
paths, queries, referrers or remote assets. Proving requests go directly to the
trusted loopback prover and are sensitive: do not record their bodies. Public
chain data is expected to show NIGHT amounts/addresses; it must not expose the
raw bearer authority. Do not record the demo with an unspent claim QR visible.

## 9. Read-only chain verification

Use the public receipts to create reports/preprod-manifest.json (actual observed
values only; the receipts include the necessary decoded address hex fields):

```json
{
  "schemaVersion": 2,
  "network": "preprod",
  "asset": "NIGHT",
  "amountAtomic": "1000000",
  "deploymentRecord": "reports/night-escrow.json",
  "senderAddressHex": "<A receipt walletAddressHex>",
  "receiverAddressHex": "<B receipt walletAddressHex>",
  "spendRecipientAddressHex": "<B receipt spendRecipientAddressHex>",
  "fundingId": "<A receipt transactionId>",
  "claimId": "<B receipt transactionId>",
  "spendId": "<B receipt spendTransactionId>"
}
```

```powershell
wsl --exec bash .local/run.sh npm run verify:deployment -- --record reports/night-escrow.json
wsl --exec bash .local/run.sh npm run test:preprod -- --manifest reports/preprod-manifest.json
```

Expected: both exit 0. They re-query indexer/node finality, code/verifier identity,
exact native NIGHT deposit/payout/spend, destination and no mint. They do not
sign or submit. Missing input returns 2; failed verification returns 1. These
checks do not establish independent human wallet control or optical/browser QA.
Keep combined wallet/transaction linkage local unless publication is intended.

For complete acceptance, record every T01–T24 case in reports/owner-acceptance.json:
schemaVersion 1, ownerReviewed true, actual observedAt, manifestPath, cases with
id/result/source/evidencePath/evidenceSha256, and subjects with current path/sha256.
Every tracked src/config/contracts/scripts/tests and package/build/test/Compose/
toolchain/CI file is required by verify:product; do not copy stale hashes.
Use source owner_observed for manual observations and automated only for executed
checks. Evidence must be sanitized. Run npm run verify:product -- --acceptance
reports/owner-acceptance.json only with complete truthful observations. Organizer
qualification remains separate; excluded participation is not a NIGHT flow gate.

## If anything fails

- Rejected connection/signing: reconnect or approve only when ready; the saved
  draft remains. Check for an existing identifier before trying again.
- Unknown, partial, submitted or stalled: **Reconcile** the original identifier.
  Do not create another funding/claim/spend just because the UI timed out.
- Confirmed full claim failure: reconcile; **Retry failed claim** appears only
  if the original note remains unspent. Reset, prepare a fresh proof, then approve.
- Confirmed full spend failure: reconcile; **Retry failed spend** preserves the
  failed attempt, then permits a new explicit approval after balance checks.
- Failed funding: retain the original record. Only after canonical full failure
  and no deposited note may a separate new draft be funded; never clone unknown
  funding. There is no automatic funding retry button.
- Stale root: reprepare an unsubmitted claim against current state. Preserve any
  submitted transaction and reconcile first.
- Wrong old escrow/mm1/custom asset: use a verified v2 NIGHT escrow/link. Old
  encrypted stores are retained; do not convert their amounts or reset storage.
- Balance mismatch: wait for 1AM synchronization and stop unrelated transfers.
  Never mark the check passed by editing a baseline or an evidence record.
- Prover unavailable: restart only the project service; run test:proving. Do not
  route private witnesses to an arbitrary remote service.
- Recovery error: retain original files, correct wallet/escrow/original passphrase
  and use an isolated origin for import. Never disclose the passphrase.

## Demo-ready checklist

- [ ] Current NIGHT production build, prover and relevant local checks pass.
- [ ] Two independent 1AM wallets are on Preprod with enough NIGHT/DUST.
- [ ] New NIGHT escrow deployment is finalized and public record verified.
- [ ] A deposits 1 NIGHT; B claims the exact 1 NIGHT with A's session absent.
- [ ] B's controlled spend returns NIGHT to A; expected balances reconcile.
- [ ] Replay is rejected; no mint, duplicate payment or unknown outcome remains.
- [ ] Link and local QR work; no secret leaks into server/network artifacts.
- [ ] Reload and independent encrypted import restore the same finalized records.
- [ ] Read-only deployment and native Preprod manifest checks pass.
- [ ] Public NIGHT disclosure is described honestly; private data is hidden for recording.
