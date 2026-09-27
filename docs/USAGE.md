# Using MoneyMole with Preprod NIGHT

1. Run the production app at http://127.0.0.1:3000 and the local prover at port 6300.
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
