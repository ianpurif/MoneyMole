# Using MoneyMole

Implementation is available; final real-wallet testing is owner-run. Follow
`OWNER-TESTING.md` for acceptance evidence. Never enter a wallet seed or private
key into the app, chat, terminal or recovery forms.

## Start

Use the pinned Node/npm/Compact toolchain in TOOLCHAIN.md. After npm ci, compile
both contracts, start the project prover with `npm run services:up`, and run
`npm run dev`. Open http://127.0.0.1:3000. A production server needs a fresh
`npm run build` and restart. An older running build does not contain new code.

Click **Check for 1AM**, **Connect 1AM**, then approve Preprod connection.
Wallet A is Chrome; Wallet B is Brave. Both are already owner-reported ready with
DUST. Discovery does not authorize transactions. Disconnect clears the local
session; site permission can separately be revoked in 1AM. Account/network
changes invalidate the session.

Keep the same origin, wallet and recovery passphrase when returning. Passphrases
encrypt local records and must be at least 16 characters; never reuse a seed/key.
Hiding a tab or five minutes after unlock locks it. If a wallet prompt changes
visibility and interrupts an operation, reopen/unlock and reconcile before trying
again. Do not use browser flags to bypass security or clear browser data to fix a
transaction. Run proofs sequentially across Chrome/Brave and CLI jobs.

## Reuse the issuer and issue the test supply

Chrome / Wallet A: open **Tools**, then expand **Test asset issuer administration**, enter the existing
local passphrase and select **Prepare / unlock issuer deployment**. Confirm it
recovers issuer `47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`.
If the browser record is missing, use **Restore encrypted issuer recovery** with
its backup and original passphrase. Do not approve a different issuer deployment.

The issuer is already deployed. Once it reconciles, select **Prepare / recover
issuance**. This proves the separate one-time issuance of 1,000,000 non-redeemable
zero-decimal units to A. Review **Approve issuance of 1,000,000 test units**, then
approve in 1AM only when you intend to issue. **Check issuance** reconciles the
saved identifier and balance. Supply is not issued by deploying the contract.

Save **encrypted recovery** again after issuance preparation/submission so the
bundle includes both deployment and issuance records. Never put that file in Git.

## Select or create a payment escrow

Use an existing compatible escrow address when available. Otherwise, expand
**Create / recover a payment escrow**, enter a local passphrase, and select
**Prepare / unlock escrow**. Preparation persists recovery; it submits nothing.
Review the new Preprod escrow address, then explicitly approve **escrow deployment**
in the app and 1AM. This issues no tokens and funds no payment.

Use **Check deployment** until confirmed, save the **public deployment record**
and **encrypted escrow recovery**, and put the confirmed address in the workspace.
Encrypted backup and public deployment record have different purposes.
Unknown/submitted deployments must reconcile; do not create another.

## Sender: fund and share

Chrome / Wallet A:
1. Enter the escrow address and passphrase; **Unlock payment workspace**.
2. Check the shielded test balance. DUST pays fees separately; the wallet presents
   the actual fee request.
3. Under **Send**, enter whole test units and **Save payment draft**.
4. Saving opens **Activity** with the draft selected. Choose **Prepare funding**, then **Approve funding of [amount]**.
   Review and approve the actual 1AM request.
5. **Reconcile** until finalized funding and coin qualification are confirmed.
6. Expand **Recovery & receipts** to **Save encrypted recovery**. **Show claim link / QR** becomes available only
   for finalized, unclaimed funding. Copy privately or scan the locally generated QR.

Anyone with the link can claim, including the sender. There is no refund, expiry
or recipient restriction. Do not paste links into chat, server logs or test reports.
The sender can now disconnect and close Chrome.

## Receiver: claim and spend

Brave / independent Wallet B:
1. Open the complete link. Its fragment is captured in memory and removed from
   the address bar. Connect 1AM; the claim selects its escrow automatically.
2. Enter a local recovery passphrase and **Unlock payment workspace**.
3. Under **Receive**, choose **Verify and save claim**. If pasting instead,
   expand **Select escrow from a claim link**, paste it, and choose **Use claim escrow** before unlocking.
4. **Save encrypted recovery**, **Prepare claim**, and explicitly **Approve claim
   of [amount]** in 1AM.
5. **Reconcile** until claim input/output settlement and wallet synchronization
   are confirmed. **Save public receipt** exports sanitized observations.
6. For spendability evidence, use a receiver whose prior test-asset balance was
   zero and avoid unrelated transfers. Expand **Controlled spendability check**,
   enter another Preprod shielded address and separately approve the spend.
   Reconcile until finalized and the receiver test balance returns to zero.

Do not interpret an imported record, an indexer response alone or a wallet balance
alone as full payment acceptance. The owner must also review the negative and
privacy cases in TESTING.md.

## Recovery and failures

Unlocking the original wallet/contract namespace lists saved payments. Select one
and reconcile before sharing or trusting its receipt. **Import encrypted payment
recovery** authenticates the original wallet/contract namespace and export
passphrase, then inserts only an absent record. Administration bundles import
atomically; an existing or invalid entry preserves the whole prior store.

Wrong passwords, corrupt files and unknown schemas never reset stored data.
A backup restores secrets, not proof of settlement. A different origin can import
an encrypted backup only with the same wallet and original passphrase.

A transaction with an identifier cannot be blindly submitted again. Use Reconcile
after reload, lost responses or node/indexer outages. An unsubmitted proof can be
prepared again against fresh state. Definitive failed records stay preserved.
If no identifier was stored, the app did not call submit; prepare again as needed.

Local prover failures never fall back to a remote service. Confirm the expected
loopback service and browser access using the owner testing procedure. Funded notes
remain at their original address when an escrow reaches capacity. Keep that
deployment and its artifacts available for claims.

## Focused interface

Send, Receive and Activity share one local wallet session. Only the selected task
is shown. Connecting leads to the local workspace unlock; it does not fund a
payment. Activity holds saved drafts and receipts, with transaction identifiers,
recovery downloads and spendability checks disclosed on demand. **Lock workspace**
clears decrypted state. The **Tools** sheet contains separate issuer administration;
closing it locks its in-memory controller while keeping encrypted records.

Brief clipboard and connection notifications use Sonner. Proof, authorization,
pending finality and recovery messages stay beside the payment as persistent
status. Unknown outcomes still require reconciliation, and sharing is unavailable
until finalized funding is verified.
