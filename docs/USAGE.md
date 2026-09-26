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

Funding, sharing and claim actions remain disabled. The app does not hold funds,
create links, display payment balances or submit transactions. Automated connector
fixtures verify UI behavior only; a real owner-approved 1AM connection is pending.
The encrypted storage utilities are tested but are not wired to live payment flows.

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
zero decimals. No deployment, issuance or funding transaction has been authorized
or executed. Local proofs use synthetic fixtures and are not funds.
