# Using MoneyMole with Preprod NIGHT

1. Run the production app at http://localhost:3000 and the local prover at port 6300.
   Use Node 22.16.0/npm 10.9.2 and config/preprod.json. .env.local only needs the
   public PROOF_SERVER_PORT=6300 setting. No wallet secret or issuer setup is needed.
2. Chrome/A and Brave/B: click **Connect**, select a detected **1AM** or **Lace**
   wallet, and manually approve Preprod. 1AM is listed first; selection is explicit.
   A needs NIGHT to send; both need available DUST for fees. B may already own NIGHT.
3. A opens **Tools → Create / recover a payment escrow**. Prepare / unlock escrow with a
   private local passphrase, approve a new NIGHT deployment only if none exists,
   then Check deployment. Save its public record and encrypted backup. Legacy
   issuer/test-token escrows cannot be reused as NIGHT escrows.
4. Unlock MoneyMole once and select the confirmed NIGHT escrow. Enter an amount
   with up to six decimals and choose **Send NIGHT**. One modal saves the encrypted
   draft, checks NIGHT/DUST, prepares the proof and waits for your approval.
   Choose **Approve payment in wallet**, review in 1AM and stay in the modal for
   submission and confirmation. It shows a private link/QR only after finality.
5. Share that link privately with B. B opens it, unlocks local recovery, and chooses
   **Receive NIGHT**. The same modal verifies/saves the claim and prepares its proof.
6. B chooses **Approve claim in wallet** and waits for confirmation. B receives the
   exact escrowed NIGHT; no mint occurs. Check baseline + amount independently in 1AM.
   Close and **Resume payment**, or select a record in Activity and **Open payment**,
   to resume. **Retry this step** preserves the draft/proof; **Check confirmation**
   only observes the saved transaction and never resubmits it. Encrypted exports
   and public receipts remain in Activity → Recovery & receipts.
7. In the confirmed receive modal, B expands **Send received NIGHT**, enters A's unshielded NIGHT address,
   approves the exact spend, and reconciles. B returns to baseline, A recovers the
   payment; DUST fees remain separate. Save updated recovery and public receipts.
8. Reload/unlock/reconcile both saved records. For import, use the same wallet and
   escrow in an isolated origin, the encrypted file and its original passphrase.
   Imported/local labels are not chain evidence. Unknown outcomes cannot be retried.

NIGHT transfers publicly reveal amounts/addresses. Claim secrets and recovery
remain client-side. Anyone holding a link can claim, including its sender. There
is no expiry/refund. Never publish live links or discard encrypted backups.
See OWNER-TESTING.md for exact manual failure/recovery and read-only verification.

## Connection and local recovery

Use **http://localhost:3000** consistently. A wallet connection remains in memory
across MoneyMole client navigation. Temporary connector or DUST reads retain that
connection and retry automatically; payment operations still require a successful
current identity check. A confirmed disconnect, changed account, or changed network
invalidates it. Disconnect clears the local connection without deleting encrypted
records or revoking extension permissions.

Connector v4 has no passive restore method. A full reload or a new tab requires an
explicit Connect and wallet selection; the app never opens authorization prompts on its own.
The shared private workspace locks after five minutes without interaction, on
disconnect or when the page closes. A wallet prompt does not independently lock it. Unlocking those records is separate from connecting the wallet.

Browser storage is origin-specific. Records previously saved at 127.0.0.1 are not
visible at localhost and have not been deleted. If needed, open the original origin,
use its existing encrypted export, and import on localhost with the same wallet,
escrow and original export passphrase. Never redeploy to replace missing local data
or enter a wallet seed. Keep the encrypted export private.

The wallet card shows total native NIGHT and current DUST (not its generation cap),
even before local records are unlocked. Totals refresh every 15 seconds while visible,
on focus/return, during reconciliation and after payment or deployment operations.
Temporary failed reads preserve last known totals with an updating label. Before
the first reading the card shows an ellipsis, never a fabricated zero. Payment
readiness always checks fresh balances, never the cached display.

Send and Receive open the shared payment modal. It owns draft saving, funding,
claiming, sharing and optional sending of received NIGHT. Activity owns history, transaction details and
receipts, with links back to the appropriate action. Tools contains escrow setup,
encrypted payment import (after unlock) and workspace metadata. Recovery guidance
appears in a toast on connection and passphrase focus. Tabs scroll inside the fixed
card; the sidebar does not replace the active payment workspace.
