# MoneyMole

[![Engineering verification](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml/badge.svg)](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml)

**Sender-funded native NIGHT payment links on Midnight Preprod, using 1AM.**
Wallet A escrows NIGHT, shares a bearer link or local QR, and independent Wallet B
claims the same NIGHT. DUST pays transaction fees only. No custom token, mint on
claim, wrapping, exchange rate or mainnet money is involved.

The product idea is a funded payment capability: a client deposits NIGHT and sends
its claim to a freelancer, who can redeem without the sender being online. NIGHT
amounts and addresses are public. The private part is bearer authorization and
client-side recovery, not anonymous or shielded value transfer. Anyone with the
link, including its sender, can claim. There is no expiry or refund.

## Current evidence and limits

The owner changed the payment asset from the historical shielded test token to
native NIGHT on 2026-09-27. [ADR 007](docs/adr/007-native-night-payments.md) records
the compatibility and disclosure changes. The current contract is
[night-payments.compact](contracts/night-payments.compact). Its constructor fixes
nativeToken(), fund uses receiveUnshielded and claim uses sendUnshielded. Amounts
use integer STAR: **1 NIGHT = 1,000,000 STAR**, with six decimal places in the UI.

Local checks and actual wallet acceptance are separate. See [current status](docs/STATUS.md)
and [wallet/card verification](docs/evidence/wallet-card-verification.json). Synthetic
contract/proving/integration/browser tests never establish a real Preprod payment.
The current revision fixes temporary-read disconnects, retains 1AM authorization
across client navigation, and uses a centered, fixed-height wallet card with internal
scrolling. Full reloads still need an explicit Connect action because connector v4
has no passive restore API. Private records retain their separate automatic lock.

[Run 36319963556](https://github.com/ianpurif/MoneyMole/actions/runs/36319963556)
verified the preceding native migration. Publication and CI for this revision are
tracked in [current status](docs/STATUS.md); the earlier run is historical evidence.
A compatible NIGHT escrow and two-wallet payment/spend/recovery still require owner
approval and observed receipts. No real 1AM stability or NIGHT E2E is claimed from
synthetic tests. See [usage and origin recovery](docs/USAGE.md).

The retained issuer at
`47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`
and deployment identifier
`003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886`
are **historical test-token evidence, not a NIGHT escrow**. Its original
[record](deployments/preprod/test-asset-issuer.json), source and read-only verifier
remain intact. Do not redeploy or issue that asset for NIGHT testing.

## Level 1–6 evidence map

The exact owner-supplied criteria remain in [LEVEL-AUDIT-SCOPE.md](docs/LEVEL-AUDIT-SCOPE.md).
[requirements.json](docs/requirements.json) owns states; [REQUIREMENTS.md](docs/REQUIREMENTS.md)
is generated. Prior custom-token Level verdicts do not establish NIGHT acceptance.

| Level | Current implementation / evidence | Still required for current NIGHT scope |
|---|---|---|
| 1 | Pinned toolchain, compiled NIGHT contract/keys, tests, idea/setup and meaningful Git history | Actual approved NIGHT deployment and verified address; old issuer is historical only |
| 2 | 1AM connection, fund/claim, private bearer witnesses, public NIGHT disclosure | Real frontend circuit finality and observed privacy behavior |
| 3 | Recovery, negative cases, exact settlement checks and CI workflow | Working real NIGHT E2E; current revision CI is tracked in STATUS |
| 4 | Current setup/usage/architecture, retained identities and reconciliation | Same real NIGHT MVP; current engineering CI is tracked in STATUS |
| 5 | Domain binding, destination-bound payout, retries, strict payload and encrypted recovery | Actual independent wallet credit/spend and live security/privacy observations |
| 6 | Regression suites, source-bound evidence and meaningful engineering history | Full current acceptance matrix, live recovery and truthful submission review |

Videos, hosted links, screenshots, users/feedback, X, Lace branding and unsupplied
organizer approval are excluded from the owner's scoped audit. Exclusion is not
a verification result. Hidden NIGHT amounts cannot be claimed: the native asset
is unshielded. External qualification remains separate from implementation.

## Setup

Linux/WSL2 is the target. Use **Node 22.16.0**, **npm 10.9.2**, Compact compiler
**0.31.1**, Docker Desktop/Engine and the pinned proof server **8.1.0**. Windows
compact.exe is a filesystem tool, not the Midnight compiler. Use a single Linux
node_modules tree and the committed npm lockfile.

```sh
npm ci --no-audit --no-fund
node scripts/install-compact.mjs --approve-reviewed-installer
export PATH="$PWD/.local/compact/bin:$PATH"
export COMPACT_DIRECTORY="$PWD/.local/compact/artifacts"
npm run compile:contracts
npm run compile:legacy
npm run compile:issuance
npm run verify:artifacts
npm run services:up
npm run test:proving
npm run build
npm run start -- --port 3000
```

The installer command explicitly executes the repository-reviewed pinned installer;
inspect scripts/install-compact.mjs on a new host. Legacy compiles preserve historical
identities and regression coverage; they do not issue anything. generated managed/
code and keys are reproducible ignored artifacts, not fabricated checked-in output.
Keep the final app process running and open http://localhost:3000. Stop the app
before rebuilding. The proof server listens at http://127.0.0.1:6300.

On the already configured Windows host, prefix each npm command with
`wsl --exec bash .local/run.sh` in PowerShell. That ignored launcher is local host
setup, not part of a fresh clone. [OWNER-TESTING.md](docs/OWNER-TESTING.md) gives the
complete sequential manual flow and troubleshooting.

## Configuration and storage

| Location | Meaning |
|---|---|
| .env.local | Public `PROOF_SERVER_PORT=6300` Compose setting; never wallet credentials |
| [config/preprod.json](config/preprod.json) | Reviewed indexer/RPC/prover endpoints; NIGHT/unshielded/6 decimals/v2 metadata; historical issuer fields retained only for legacy verification |
| Browser localStorage | Selected public NIGHT escrow, key moneymole/night-escrow/v2 |
| Encrypted IndexedDB | Wallet/contract/network/schema-v2 payment and deployment records; passphrase-derived keys never saved |
| Public deployment export | Actual NIGHT address, identifier and source/build/toolchain hashes; save as reports/night-escrow.json for local verification |
| Encrypted exports | Private payment and escrow recovery; keep outside Git and never send to an agent |
| deployments/preprod/test-asset-issuer.json | Original issuer record, not current NIGHT configuration |

There is no global NIGHT escrow hardcoded in env. An owner may deploy/reuse a
compatible escrow; multiple senders can share one. Claims bind the specific
address in their link. The browser validates its verifier keys and native asset.
Changing a public prover endpoint requires the reviewed config/CSP and Compose
port to agree. Unused NEXT_PUBLIC values do not configure payments.

## Send, claim and verify

Forgot the local recovery passphrase? Use **Login with Passkey** if a passkey was
already enrolled, then replace the passphrase in **Tools → Security**. **Forgot
recovery passphrase?** also accepts a wrapped MoneyMole backup with its export
passphrase. Without either unlock method, old encrypted records cannot be decrypted.
The confirmed **Start a new local workspace** flow preserves the old records and
authentication metadata in this browser and creates a separate empty workspace.
Use **Switch to a preserved workspace** if the original unlock material is found.
No wallet, escrow deployment or transaction is created by this reset.

1. Chrome/A and Brave/B: real independent 1AM wallets on Preprod. A holds the NIGHT
   to send; both have enough available DUST. Record NIGHT balances A0 and B0.
2. A clicks **Connect Wallet**, selects **1AM** (or detected **Lace**), and unlocks
   **MoneyMole** once with a passkey or local recovery passphrase (at least 7 characters).
   Existing users enter their original app passphrase once, then add a passkey in
   **Tools → Security**. Passkey users add a recovery passphrase for portable backups.
   Open **Tools → Create / recover a payment escrow**. Approve a new NIGHT
   deployment only if no compatible v2 record exists; **Check deployment** until
   chain verified. Save public record and encrypted escrow recovery.
3. **Use escrow** with the verified address; recovered escrow state is shared across
   Send, Receive, Activity and Tools. In **Send**, enter **1**
   NIGHT, **Save payment draft**, save encrypted recovery, **Prepare funding**,
   then **Approve funding of 1** in 1AM. **Reconcile**: A = A0 - 1; escrow +1.
4. **Show claim link / QR**, share privately with B, then close A's session. B opens
   the mm2 fragment link (scrubbed locally), unlocks, **Verify and save claim**,
   saves recovery, **Prepare claim**, then **Approve claim of 1**. Reconcile: B = B0 + 1.
5. B chooses **Send received NIGHT**, then **Controlled spendability check** in
   Send, enters A's unshielded NIGHT address,
   approves the exact spend and reconciles: B = B0, A = A0, DUST fees separate.
6. Reload/unlock/reconcile, independently import encrypted recovery on another
   local origin, test rejected replay and scan the QR privately. Export sanitized
   public receipts and run the read-only deployment/native settlement verifiers.

No custom-token issuance is part of these steps. Old mm1 links are rejected and
old encrypted records stay untouched. Use historical revision 16aa745 in a separate
checkout if legacy asset recovery is ever needed; never reinterpret its units.

The card displays total NIGHT and current DUST before recovery unlock, refreshing
on a visible 15-second interval, focus and transaction operations. Send contains
funding/sharing; Receive contains claims; Activity contains history, receipts and
encrypted exports. Escrow setup and encrypted imports live in Tools. See
[usage](docs/USAGE.md) for recovery and balance availability behavior.

## Privacy, recovery and architecture

| Data | Boundary |
|---|---|
| NIGHT amount, input/output address, contract balance, timing | Public unshielded ledger |
| Note commitment, spent nullifier, native asset, verifier | Public contract state |
| Bearer authority, nonce, membership/private witness | Browser and trusted local prover; never Next.js APIs |
| Private records | Encrypted IndexedDB; passkey or local recovery passphrase; portable exports require a fallback passphrase |
| Wallet authorization and keys | 1AM; every approval belongs to the owner |

The proof demonstrates knowledge of the note opening and single-use authority,
with a bound payout destination. It does not hide NIGHT metadata. Lost bearer
secrets and backups can mean permanent loss. Do not expose live QR codes in demos.
Unknown/partial transactions reconcile only; canonical fully failed claims/spends
can be reset without losing their history. Imported records require fresh chain
checks. Five minutes without interaction, page close, explicit lock and
account/network changes lock the shared private session.

[Architecture](docs/ARCHITECTURE.md): Next.js App Router frontend/backend,
TypeScript, Tailwind, src/app/api/**/route.ts handlers, src/lib/server/ modules.
No separate application backend. Client-only wallet/witness/recovery logic calls
the trusted local prover directly. CSP, fragment scrubbing and local QR avoid
server handling of bearer data. See [privacy](docs/PRIVACY.md) and
[disclosure audit](docs/disclosure-audit.md) for limitations.

## Verification and history

```sh
npm run check:offline
npm run doctor
npm run audit:deps
npm run lint
npm run typecheck
npm run test:unit
npm run test:contracts
npm run test:integration
npm run test:proving
npm run build
npm run test:browser
npm run requirements:check
npm run verify:connectivity
npm run verify:issuer
npm run verify:deployment -- --record reports/night-escrow.json
npm run test:preprod -- --manifest reports/preprod-manifest.json
```

The final two require actual owner-approved NIGHT records. Exit 2 is blocked,
never passed. verify:issuer is read-only historical continuity. Connectivity checks
need the running app/prover. Full verify:product also requires the complete hashed
owner-reviewed [acceptance matrix](docs/TESTING.md). CI installs/compiles/tests/builds
from the locked graph; it cannot approve wallets or establish live Preprod payments.

Meaningful local commits cover decisions, circuits, wallet/recovery and native
verification separately; publication and remote CI must be observed independently.
Do not infer a qualifying commit count from automated file counts. Git history,
[status](docs/STATUS.md) and source-bound evidence distinguish current, historical,
synthetic and real observations. No wallet secrets are needed by CI.
