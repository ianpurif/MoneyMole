# Current MoneyMole status — 2026-09-28

This page describes the native NIGHT application on current `main`. Older
issuer-era status reports, UX checkpoints and their bounded checks remain in Git
history and `docs/evidence/`; they are not current payment-acceptance verdicts.
Use [README Level 1–6 evidence](../README.md#level-1-evidence) and the [current
audit](LEVEL-AUDIT.md) for the submission map.

## Deployed payment architecture

The NIGHT payment escrow is deployed on **Midnight Preprod** at
`685d5f51be99ac8cb2f56d82c806aa92bcbd93ffe74137b409efd5724b9adc63`.
Its successful deployment transaction identifier is
`0043457907ca3523d4aa6e1a570a2ecf5d0a5239f2a456d736442b10be9e660544`,
finalized at block 2735496. The [public record](../deployments/preprod/night-payment-escrow.json)
contains the transaction hash, finalized block hash and source/build/toolchain
fingerprints. `npm run verify:deployment` rechecks the live state, native asset and
local fund/claim verifier keys. The address is the default in
`config/preprod.json`; a saved compatible escrow or claim-bound address can take
precedence after verification. No automatic deployment occurs.

Read-only Preprod indexer/RPC inspection found **two successful native NIGHT
`fund` calls and one successful `claim` call** through that escrow, without minting.
These are meaningful contract calls, but the public chain cannot identify the
originating MoneyMole frontend session, separate human wallet owners, private
claim-link delivery or independent receiver spend/recovery. The legacy issuer
`47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`
is a different shielded test-token deployment and is not used for NIGHT payments.

## App flow and privacy

Connect Wallet shows explicitly selectable supported wallets, with 1AM primary.
A shared authenticated recovery session owns escrow selection and encrypted
payment records across Send, Receive, Activity, Tools and claim routes. Passkey
unlock is available when enrolled; the app-level recovery passphrase remains an
alternative. A forgotten passphrase can be replaced using an enrolled passkey or
recovered from a compatible encrypted backup; a fresh local workspace preserves
old encrypted records but does not recover their secrets.

Send NIGHT uses a compact resumable modal: it saves intent/proofs and transaction
identifiers, requests wallet approval once, submits, confirms and then reveals a
local claim link/QR. Receive verifies a funded bearer claim and asks for a separate
wallet-approved claim. Activity provides history/receipts and resumes saved work.
Unknown/partial submissions only reconcile their original identifier; fully
failed attempts can be reset after fresh chain checks. The wallet card reads real
NIGHT and DUST totals from the wallet, retaining a labelled last-known balance
through temporary read failures. See [USAGE](USAGE.md) and [ARCHITECTURE](ARCHITECTURE.md).

Native NIGHT is **unshielded**. Amounts, addresses, contract value movements and
timing are public and can reveal relationships. The Compact witness keeps bearer
authority and nonce private and enforces single use; it does not make the value
transfer anonymous. Client secrets stay out of Next.js APIs and public evidence.
The owner's hidden-amount requirement would need a different payment asset or
protocol architecture; no such migration is claimed. See [PRIVACY](PRIVACY.md).

## Verification and outstanding evidence

The [scoped local verification](evidence/night-escrow-verification.json) records
read-only deployment identity, real synthetic local proving, 53 utility tests,
11 shared-recovery tests, typecheck, production build and localhost:3000 browser
CORS/Preprod connectivity as passed. These checks contain no owner wallet
approval. `npm run doctor` reported the auxiliary Codex CLI unavailable inside
WSL while Node, npm, Docker, Compose and Compact checks passed; this is not a
payment failure.

The published [engineering workflow](../.github/workflows/ci.yml) has an
[earlier successful run](https://github.com/ianpurif/MoneyMole/actions/runs/36319963556).
Its [run 36371511897 for 8e12329](https://github.com/ianpurif/MoneyMole/actions/runs/36371511897)
**failed in the browser security/synthetic authorization step** after earlier
steps passed. Check the live workflow for newer commits before calling CI green.
The exact log-level cause is not established by the public jobs summary.

Unobserved acceptance: actual 1AM approval from two independent wallets,
MoneyMole-origin funding/claim, receiver credit/spendability, failed replay,
reload/import recovery and public-transcript disclosure review. External
submission items are also pending: organizer idea approval, hosted demo, video,
screenshots, product X profile, consented user/wallet evidence and actual user
feedback. Their [placeholders](../USERS.md) are not verification. Rise In's public
Level 6 Mainnet/20-user summary conflicts with the supplied Preprod/70-user
checklist; see [scope](LEVEL-AUDIT-SCOPE.md).

The owner controls every connection, deployment, issuance and live transaction
approval. Never send a seed, private key, passphrase, claim link, witness or
private payment record to CI, logs, a public repository or an agent.
