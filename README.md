# MoneyMole

[![Engineering verification](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml/badge.svg)](https://github.com/ianpurif/MoneyMole/actions/workflows/ci.yml)

**Sender-funded native NIGHT payment links on Midnight Preprod, using 1AM.**
Wallet A escrows NIGHT, shares a bearer link or local QR, and independent Wallet B
claims the same NIGHT. DUST pays transaction fees only. No custom token, mint on
claim, wrapping, exchange rate or mainnet money is involved.

## What This Product Does

The product idea is a funded payment capability: a client deposits NIGHT and sends
its claim to a freelancer, who can redeem without the sender being online. NIGHT
amounts and addresses are public. The private part is bearer authorization and
client-side recovery, not anonymous or shielded value transfer. Anyone with the
link, including its sender, can claim. There is no expiry or refund.

## Contract Address

The owner changed the payment asset from the historical shielded test token to
native NIGHT on 2026-09-27. [ADR 007](docs/adr/007-native-night-payments.md) records
the compatibility and disclosure changes. The current contract is
[night-payments.compact](contracts/night-payments.compact). Its constructor fixes
nativeToken(), fund uses receiveUnshielded and claim uses sendUnshielded. Amounts
use integer STAR: **1 NIGHT = 1,000,000 STAR**, with six decimal places in the UI.

The verified Preprod NIGHT escrow is
`685d5f51be99ac8cb2f56d82c806aa92bcbd93ffe74137b409efd5724b9adc63`.
Its [public deployment record](deployments/preprod/night-payment-escrow.json)
identifies transaction
`0043457907ca3523d4aa6e1a570a2ecf5d0a5239f2a456d736442b10be9e660544`.
Read-only checks found the finalized deployment, matching fund/claim verifier keys,
two successful native NIGHT funding calls and one successful claim call. The app
selects this escrow by default; a wallet's saved escrow choice or a claim link can
select another compatible, independently verified escrow.

| Network | Payment contract | Deployment transaction ID |
|---|---|---|
| Preprod | `685d5f51be99ac8cb2f56d82c806aa92bcbd93ffe74137b409efd5724b9adc63` | `0043457907ca3523d4aa6e1a570a2ecf5d0a5239f2a456d736442b10be9e660544` |

## Live Demo

**Owner placeholder:** no hosted/Vercel URL has been supplied or verified. Run
locally at http://localhost:3000 using the setup below.

## Current evidence and limits

Local checks and actual wallet acceptance are separate. See [current status](docs/STATUS.md)
and [wallet/card verification](docs/evidence/wallet-card-verification.json). Synthetic
contract/proving/integration/browser tests never establish a real Preprod payment.
The current revision fixes temporary-read disconnects, retains 1AM authorization
across client navigation, and uses a centered, fixed-height wallet card with internal
scrolling. Full reloads still need an explicit **Connect Wallet** action because connector v4
has no passive restore API. Private records retain their separate automatic lock.

[Run 36319963556](https://github.com/ianpurif/MoneyMole/actions/runs/36319963556)
passed on an earlier native-NIGHT revision. [Run 36371511897 for commit
8e12329](https://github.com/ianpurif/MoneyMole/actions/runs/36371511897) failed at
the browser security/synthetic authorization step; it is **not** a passing run
for that source revision. Check the live CI badge for newer commits. Local build,
proving, browser connectivity and read-only deployment
checks passed in [the scoped verification record](docs/evidence/night-escrow-verification.json).
Independent-wallet credit/spend/recovery and private-link delivery still require
owner-observed evidence. Public chain calls do not prove who controlled either
wallet or make native NIGHT amounts private. See [usage and origin recovery](docs/USAGE.md).

The retained issuer at
`47f3f2f299d79608cf8c0048e775391428d903ab2c7ef054f42ac294df366635`
and deployment identifier
`003664b95a34f2596809d49982819f3f1e38347d5fe444a13c199bdcae03757886`
are **historical test-token evidence, not a NIGHT escrow**. Its original
[record](deployments/preprod/test-asset-issuer.json), source and read-only verifier
remain intact. Do not redeploy or issue that asset for NIGHT testing.

## Level 1 Evidence

| Requirement | Evidence and status |
|---|---|
| Node 22, Docker, Compact compile | Pinned versions and commands in [TOOLCHAIN](docs/TOOLCHAIN.md), [RUNBOOK](docs/RUNBOOK.md) and [CI](.github/workflows/ci.yml); current contract source is [night-payments.compact](contracts/night-payments.compact). Local build/proving passed in the [verification record](docs/evidence/night-escrow-verification.json). |
| Passing tests and generated circuits/keys | [Contract tests](tests/contracts/night-runtime.mjs), [integration tests](tests/integration/payment-records.test.ts), [test matrix](docs/TESTING.md), and `npm run compile:contracts && npm run verify:artifacts`. Generated `managed/night-payments/` exists after compilation and in CI, but is ignored in Git; only [managed/README.md](managed/README.md) is committed. |
| Deployed Preview/Preprod contract and visible address | **Verified on Preprod:** the NIGHT escrow address and deployment transaction above, with the [public record](deployments/preprod/night-payment-escrow.json) and [read-only verification](docs/evidence/native-night-level-verification.json). No Preview deployment is claimed. |
| Initial product idea | The funded bearer-link idea is the opening paragraph above. |
| At least 5 meaningful commits and public README/setup | [Commit audit](docs/evidence/commit-audit.json) reviewed 35 substantive published commits on an ancestor of current `main`; see [history](https://github.com/ianpurif/MoneyMole/commits/main/) and [setup](#setup). |
| Compile/deployment screenshots | **Owner placeholder:** add sanitized screenshots; the files/commands above are the current technical evidence. |

## Level 2 Evidence

| Requirement | Evidence and status |
|---|---|
| Wallet connect/disconnect | [Wallet adapter](src/lib/midnight/oneam.ts) and [picker](src/components/wallet-connect-modal.tsx) implement explicit 1AM/Lace selection and disconnect. The owner reports 1AM is accepted in place of Lace; real extension behavior still needs owner-observed evidence. |
| Successful frontend circuit call | [Payment controller](src/lib/midnight/payments.ts) calls `fund`/`claim`; the verified escrow has two successful fund calls and one claim on Preprod ([public identifiers](docs/LEVEL-AUDIT.md#evidence-that-can-be-checked-now)). Their originating frontend/wallet session is **not independently established** by the read-only chain check. |
| Observable privacy behavior | [Compact source](contracts/night-payments.compact) and [privacy boundary](docs/PRIVACY.md) show a private bearer authority and public commitment/nullifier. Local proofs pass; a real-wallet public-transcript disclosure review remains pending. NIGHT amounts and addresses are public. |
| Preprod address and 8 meaningful commits | Same [deployment record](deployments/preprod/night-payment-escrow.json) and [commit audit](docs/evidence/commit-audit.json). |
| Live demo and wallet/circuit video | **Owner placeholders:** live URL and demo video have not been supplied. |

## Level 3 Evidence

| Requirement | Evidence and status |
|---|---|
| Functional privacy dApp | Send/Receive/Activity, encrypted recovery and single-use claim logic are implemented in [payments.ts](src/lib/midnight/payments.ts) and the [architecture](docs/ARCHITECTURE.md). Independent-wallet credit, spendability, replay rejection and live privacy observation remain pending; do not infer full MVP acceptance from synthetic checks. |
| At least 3 passing tests | Local contract, unit and saved-record integration suites are documented in [TESTING](docs/TESTING.md) and [verification evidence](docs/evidence/night-escrow-verification.json). |
| CI/CD | [Workflow](.github/workflows/ci.yml); [earlier passing run](https://github.com/ianpurif/MoneyMole/actions/runs/36319963556); [failed run for 8e12329](https://github.com/ianpurif/MoneyMole/actions/runs/36371511897). Check the live badge for newer commits; the failed run does not establish a passing current pipeline. |
| Approved idea and 10 meaningful commits | [Proposal](PROPOSAL.md) exists but submission/organizer approval is **not evidenced**. The [commit audit](docs/evidence/commit-audit.json) exceeds 10 substantive published commits. |
| Live URL, test screenshot, one-minute video | **Owner placeholders:** add the actual URL, screenshot and video when available. |

## Level 4 Evidence

| Requirement | Evidence and status |
|---|---|
| Working Preprod MVP | [Deployed escrow](deployments/preprod/night-payment-escrow.json) and successful on-chain fund/claim calls are real. An independently observed two-wallet link/QR claim, receiver credit/spend and recovery are still required by the [acceptance matrix](docs/TESTING.md). |
| README, setup, usage | This README, [USAGE](docs/USAGE.md), [RUNBOOK](docs/RUNBOOK.md) and [architecture](docs/ARCHITECTURE.md). |
| Product-repo CI and 15 meaningful commits | [Workflow](.github/workflows/ci.yml) and [commit audit](docs/evidence/commit-audit.json); run 36371511897 failed as noted above. Check any newer run separately. |
| Hosted Preprod demo, product X profile, MVP video | **Owner placeholders:** no URL, profile or video is claimed. |

## Level 5 Evidence

| Requirement | Evidence and status |
|---|---|
| Same MVP extended | Recovery, safe retry, QR, destination-bound claim and receipt controls extend the [same NIGHT flow](docs/ARCHITECTURE.md); the Level 4 independent-wallet acceptance gap carries forward. |
| 50 verifiable Preprod users | **Owner placeholder:** [USERS.md](USERS.md) has no asserted user count or wallet list. Wallet control and unique humans require separate evidence. |
| Feedback loop and updated documentation | **Owner placeholder:** [FEEDBACK.md](docs/FEEDBACK.md) is ready for real reports and change links. Current technical docs are linked above; no user feedback is invented. |
| At least 20 meaningful commits, live link and demo video | [Commit audit](docs/evidence/commit-audit.json) exceeds 20; **owner placeholders** remain for URL and video. |

## Level 6 Evidence

| Requirement | Evidence and status |
|---|---|
| Same MVP extended and updated docs | Same implementation and acceptance limits as Level 5; [USAGE](docs/USAGE.md), [PRIVACY](docs/PRIVACY.md) and [current audit](docs/LEVEL-AUDIT.md) document them. |
| Users and feedback | The owner-supplied checklist asks for **70 total Preprod users**; [LAUNCH_USERS.md](LAUNCH_USERS.md) and [FEEDBACK.md](docs/FEEDBACK.md) are placeholders, not proof. The [public Rise In program page](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight) instead describes **Mainnet launch and 20 real users** at Level 6. The applicable rubric needs organizer confirmation; neither target is claimed complete. |
| Commits and CI | The stricter supplied submission checklist says **30 meaningful commits**; [commit audit](docs/evidence/commit-audit.json) reviewed 35 published substantive commits. Run 36371511897 failed; inspect the live workflow for newer results. |
| Mainnet/hosted demo, product X, video/screenshots | **Owner placeholders:** no Mainnet deployment, hosted URL, X profile, video or screenshots are claimed. |

The [detailed current audit](docs/LEVEL-AUDIT.md) separates implementation, live
chain observation, owner evidence and missing submission items. The pasted detailed
checklist is recorded in [LEVEL-AUDIT-SCOPE](docs/LEVEL-AUDIT-SCOPE.md); Rise In's
public [program page](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)
confirms the six-stage journey but differs on Level 6. The generated
[REQUIREMENTS.md](docs/REQUIREMENTS.md) tracks source-bound engineering evidence;
its older Level audit snapshot is historical. Neither local proofs nor public NIGHT
calls establish hidden-amount privacy or organizer eligibility.

## Tech Stack

Next.js App Router, TypeScript, Tailwind CSS, Midnight Compact/Midnight.js,
supported browser wallet connectors and a trusted loopback proof server. The
browser owns wallet authorization, witnesses and encrypted local records; the
Next.js server exposes only public application resources. See [architecture](docs/ARCHITECTURE.md).

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
npm run start
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
| [config/preprod.json](config/preprod.json) | Reviewed indexer/RPC/prover endpoints, default verified NIGHT escrow, NIGHT/unshielded/6 decimals/v2 metadata; historical issuer fields retained only for legacy verification |
| Browser localStorage | Wallet-scoped public escrow selection, `moneymole/escrow/v3/<localIdentity>`; legacy `moneymole/night-escrow/v2` remains readable |
| Encrypted IndexedDB | Wallet/contract/network/schema-v2 payment and deployment records; passphrase-derived keys never saved |
| Public deployment export | The committed default record is under deployments/preprod/; any new owner-approved escrow export can be saved separately and verified with `--record <path>` |
| Encrypted exports | Private payment and escrow recovery; keep outside Git and never send to an agent |
| deployments/preprod/test-asset-issuer.json | Original issuer record, not current NIGHT configuration |

The verified default NIGHT escrow is in config/preprod.json, not an environment
secret. An owner may deploy/reuse a
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
   The verified default escrow is already selected. Use **Tools → Create / recover a
   payment escrow** only to recover another compatible escrow or deliberately deploy
   a new one with explicit wallet approval.
3. The default verified escrow is shared across Send, Receive, Activity and Tools.
   If deliberately using another compatible escrow, select **Use escrow** first.
   In **Send**, enter **1**
   NIGHT and click **Send NIGHT**. The compact modal saves encrypted recovery, checks funds,
   and prepares the proof. Choose **Approve payment in wallet**, review in 1AM,
   and wait for confirmation in the same modal: A = A0 - 1; escrow +1.
4. The confirmed modal shows the private claim link / QR. Share with B, then close
   A's session. B opens the mm3 fragment link (scrubbed locally), unlocks, and clicks
   **Receive NIGHT**. The modal verifies and prepares the claim; B chooses
   **Approve claim in wallet** and waits for confirmation: B = B0 + 1.
5. In the confirmed receive modal, B expands **Send received NIGHT** and enters
   A's unshielded NIGHT address,
   approves the exact spend and reconciles: B = B0, A = A0, DUST fees separate.
6. Reload/unlock/reconcile, independently import encrypted recovery on another
   local origin, test rejected replay and scan the QR privately. Export sanitized
   public receipts and run the read-only deployment/native settlement verifiers.

No custom-token issuance is part of these steps. Old mm1 links are rejected and
old encrypted records stay untouched. Use historical revision 16aa745 in a separate
checkout if legacy asset recovery is ever needed; never reinterpret its units.

Close a payment modal and use **Resume payment** or **Activity → Open payment**
to continue its saved phase. Confirmation retries never submit again. A confirmed
complete failed attempt can be retried only after fresh chain checks; unknown or
partial outcomes stay at confirmation. Backups remain in Activity → Recovery & receipts.

The card displays total NIGHT and current DUST before recovery unlock, refreshing
on a visible 15-second interval, focus and transaction operations. Temporary read
failures retain the last known totals with an updating label; spending checks use
fresh wallet reads. Send contains
funding/sharing; Receive contains claims; Activity contains history, receipts and
encrypted exports. Escrow setup and encrypted imports live in Tools. See
[usage](docs/USAGE.md) for recovery and balance availability behavior.

## Privacy Model

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

## Run Tests

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
npm run verify:deployment
npm run test:preprod -- --manifest reports/preprod-manifest.json
```

`test:preprod` requires owner-reviewed NIGHT transaction records; `verify:deployment`
now defaults to the committed escrow record and is read-only. Exit 2 is blocked,
never passed. verify:issuer is read-only historical continuity. Connectivity checks
need the running app/prover. Full verify:product also requires the complete hashed
owner-reviewed [acceptance matrix](docs/TESTING.md). CI installs/compiles/tests/builds
from the locked graph; it cannot approve wallets or establish live Preprod payments.

## CI/CD and meaningful history

Meaningful local commits cover decisions, circuits, wallet/recovery and native
verification separately; publication and remote CI must be observed independently.
Do not infer a qualifying commit count from automated file counts. Git history,
[status](docs/STATUS.md) and source-bound evidence distinguish current, historical,
synthetic and real observations. No wallet secrets are needed by CI.
