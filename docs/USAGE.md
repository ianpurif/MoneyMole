# Using MoneyMole with Preprod NIGHT

1. Run the production app at http://localhost:3000 and the local prover at port 6300.
   Use Node 22.16.0/npm 10.9.2 and config/preprod.json. .env.local only needs the
   public PROOF_SERVER_PORT=6300 setting. No wallet secret or issuer setup is needed.
2. Chrome/A and Brave/B: Check for 1AM, Connect 1AM, manually approve Preprod.
   A needs NIGHT to send; both need available DUST for fees. B may already own NIGHT.
3. A expands Create / recover a payment escrow. Prepare / unlock escrow with a
   private local passphrase, approve a new NIGHT deployment only if none exists,
   then Check deployment. Save its public record and encrypted backup. Legacy
   issuer/test-token escrows cannot be reused as NIGHT escrows.
4. Select the confirmed NIGHT escrow and Unlock payment workspace. Send an exact
   amount with up to six decimal places (example: 1 NIGHT). Save payment draft,
   Save encrypted recovery, Prepare funding, Approve funding of 1, then Reconcile.
5. After funding finality, Show claim link / QR. Privately deliver it to B and close
   A's workspace. B opens the fragment link or uses Receive / Use claim escrow,
   unlocks its own local records, then Verify and save claim.
6. B saves recovery, Prepare claim, Approve claim of 1, then Reconcile. B receives
   precisely the escrowed NIGHT; no mint occurs. Check baseline + amount in 1AM.
7. B expands Controlled spendability check, enters A's unshielded NIGHT address,
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
explicit Connect 1AM click; the app never opens authorization prompts on its own.
The private payment workspace independently locks when the tab is hidden or after
five minutes. Unlocking those records is separate from connecting the wallet.

Browser storage is origin-specific. Records previously saved at 127.0.0.1 are not
visible at localhost and have not been deleted. If needed, open the original origin,
use its existing encrypted export, and import on localhost with the same wallet,
escrow and original export passphrase. Never redeploy to replace missing local data
or enter a wallet seed. Keep the encrypted export private.

The wallet card keeps Send, Receive, Activity, Tools, Disconnect and (when unlocked)
Lock workspace visible. Scroll inside the main card to reach details, recovery and
escrow setup; expanding content does not resize the card.
