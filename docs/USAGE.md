# Implemented usage

## Wallet preparation
Use Node 22.16.0/npm 10.9.2 on Linux/WSL2, then run `npm ci` and `npm run dev`.
On this host an ignored, project-local runtime was verified; the shortcut is
`bash .local/run.sh npm run dev` from WSL. No global Node selection was changed.

Click **Check for 1AM**, then **Connect 1AM**, and approve in the extension.
The app requests Preprod, checks the returned network and shielded address, and
reports whether DUST exists without claiming a transaction fee estimate. It keeps
the connection and address only in browser memory. **Disconnect** clears that
local session; revoke the site's permission in 1AM to revoke extension access.
Account/network changes invalidate the session on the next check or window focus.

Funding, sharing and claim actions remain disabled. The owner reports independent
1AM connections with DUST in Chrome (A) and Brave (B). Automated connector fixtures
verify UI behavior only; payment acceptance still requires real transactions.

## Issuer deployment approval
Use Wallet A in Chrome at `http://127.0.0.1:3000`. Connect if the refreshed page
requires it. Choose a private local recovery passphrase (not a seed/key), then click
**Prepare / unlock issuer deployment**. Preparation builds the actual compiled
issuer transaction in the browser and persists encrypted recovery before signing.
It does not submit. Keep the passphrase private and use **Save encrypted recovery**.

Review Preprod, the displayed contract address and deployment-only scope, then click
**Approve issuer deployment on Preprod** and approve the request in 1AM. DUST pays
deployment fees; no test tokens are issued by deployment. The client checks the
balanced deployment against the reviewed address/state, persists its identifier
before submission, and polls the public indexer for matching successful inclusion.
Pending/unknown outcomes must be checked, never redeployed. **Check deployment**
retries the read-only observation. Reload and unlock resumes the same encrypted
record. Hiding the tab or five minutes of inactivity locks the store; unlock again
if necessary. An encrypted export alone is not chain confirmation.

The issuer deployment has now been observed on Preprod; its public record is in
`deployments/preprod/test-asset-issuer.json`. Reuse it. Escrow deployment, funding
and claims still require subsequent separate owner approvals. Do not delete local browser data.

## Separate test issuance
After refreshing in Chrome, reconnect Wallet A and use the same local passphrase
to **Prepare / unlock issuer deployment**. The app reconciles the existing issuer;
it does not redeploy. Once deployment is confirmed, **Prepare / recover issuance**
constructs and proves a one-time issuance of 1,000,000 atomic units to Wallet A.
Private inputs go directly to the loopback prover at `http://127.0.0.1:6300`, never
Next.js. Keep the tab visible while proving. The local prover must be running.

Review the amount, recipient and asset, then choose **Approve issuance of 1,000,000
test units** and approve the separate transaction in 1AM. The app persists its
identifier before submission and checks the issuer's successful on-chain call,
public issued flag and Wallet A's reported shielded balance separately. Unknown
outcomes cannot be resubmitted. **Check issuance** retries observation and wallet
synchronization. This issuance is not a funded payment or proof of spendability.

Do not send assets to this source package. No deployed contract address exists in
its records. Do not interpret the compile-only probe as a payment destination.

## Troubleshooting current commands
If bootstrap cannot resolve registry hosts, correct the host's authorized network
configuration and rerun; do not create a placeholder lockfile. A product command
that returns BLOCKED is accurately reporting a missing implementation. Follow the
corresponding task card in BUILD.md instead of removing the guard.

If Codex ignores project settings, review its normal trusted-project state, reopen
the session and inspect effective settings with the read-only doctor. Custom-agent discovery needs a current observed session record; the MCP doctor
separately inspects the installed client's initialized tool listing.

If the local proof port is occupied, inspect the listener and choose an explicit
supported configuration. Do not terminate unrelated services. TCP availability
alone is not a working proof. Current operations are in RUNBOOK.md.

Production browser checks require `npm run build` before `npm run test:browser`.
Do not use `contracts/probes/` as deployment input: those files are diagnostics.

The owner selected a separately issued non-redeemable Preprod test asset. The
candidate issuer creates 1,000,000 atomic units once; proposed display precision is
zero decimals. Issuer deployment is confirmed; issuance and funding remain pending.
Local proofs use synthetic fixtures and are not funds.
