# MoneyMole Level 1–6 evidence audit

Observed 2026-09-29. This is the current native-NIGHT audit. The earlier issuer-era
Level verdict and `requirements.json`'s embedded `levelAudit` are historical
snapshots; neither proves the current payment flow. The [README](../README.md#level-1-evidence)
maps every supplied requirement. [LEVEL-AUDIT-SCOPE.md](LEVEL-AUDIT-SCOPE.md)
preserves the checklist and explains its conflict with Rise In's public Level 6
description. **No complete Level 1–6 submission verdict is claimed.**

## Evidence that can be checked now

| Claim | Evidence | Limit |
|---|---|---|
| Preprod NIGHT payment escrow | [Public deployment record](../deployments/preprod/night-payment-escrow.json), [read-only verification](evidence/native-night-level-verification.json), [source](../contracts/night-payments.compact), `npm run verify:deployment` | Address `685d5f51be99ac8cb2f56d82c806aa92bcbd93ffe74137b409efd5724b9adc63`, successful deployment ID `0043457907ca3523d4aa6e1a570a2ecf5d0a5239f2a456d736442b10be9e660544`, finalized block 2735496. It is not the historical issuer. |
| Meaningful contract use | Read-only Preprod indexer/RPC verification found two successful `fund` calls and one successful `claim` call, with native NIGHT unshielded effects and no mint. [Scoped evidence](evidence/night-escrow-verification.json). | The chain alone cannot establish which frontend or independent people controlled the wallets, delivery of a claim link, receiver spendability, or origin recovery. |
| Client wiring | [Default escrow](../config/preprod.json), [recovery session](../src/lib/private-state/recovery-session.ts), [payments](../src/lib/midnight/payments.ts), [wallet authorization](../src/lib/midnight/payment-session.ts). | Send funds and Receive claims; Activity reconciles read-only. Card balances are wallet reads. A post-claim transfer is a separate wallet action. |
| Compiled contract, circuits, tests | [Compact source](../contracts/night-payments.compact), [generated-artifact instructions](../managed/README.md), [contract tests](../tests/contracts/night-runtime.mjs), [acceptance matrix](TESTING.md), [local verification](evidence/night-escrow-verification.json). | Generated circuits/keys are ignored build output, not checked-in files. Local and synthetic tests are not owner-wallet acceptance. |
| Public repository and meaningful history | [Repository](https://github.com/ianpurif/MoneyMole), [35 reviewed substantive published commits](evidence/commit-audit.json), [current history](https://github.com/ianpurif/MoneyMole/commits/main/). | A raw total alone is not a meaningful-commit count. The 35-commit audit covers an ancestor of current `main`. |
| CI | [Workflow](../.github/workflows/ci.yml), [passing earlier run](https://github.com/ianpurif/MoneyMole/actions/runs/36528158551), [latest checked failed run](https://github.com/ianpurif/MoneyMole/actions/runs/36555725199). | Run 36555725199 for `3682a78` failed at “Check preparation utilities and evidence references.” No current-head green CI is claimed. |
| Submission links supplied 2026-09-29 | [Hosted app](https://moneymole.vercel.app/), [@moneymolepay](https://x.com/moneymolepay), [demo-video page](https://drive.google.com/file/d/13UA_JUO9VrcOQFvnCMzpRd1Z_H6BUKVl/view?usp=sharing). | Each page returned HTTP 200. Hosted wallet/payment function, X account control and video duration/content were not independently reviewed. |
| Local owner-supplied media and survey | `docs/evidence/images/{compile,contract,test-ss}.png`; local feedback CSV named `MoneyMole User Feedback & Review (Responses) - Form Responses 1.csv`. | Images were visually inspected; they and the CSV are untracked and absent from the public repository. The CSV contains 70 rows and 70 distinct Preprod-formatted wallet strings with nonblank feedback, not 70 verified users. Keep names/emails/responses private pending consent and review. |

For direct Preprod interaction lookup, finalized successful funding transaction
identifiers are `00a9c82b3cad1746ca59694c02277a08b33467e552b47a6e041ab8a5743812d7ea`
(block 2740102) and
`001698b4461a86443e98bc8c56665bd6060f17c379c3274cc4a5c313d48e3841a0`
(block 2740449). A finalized successful claim identifier is
`0081cd30c7c4be517d5b80b1efea012aa224b3cfaeda4c524a33745703c32a5601`
(block 2740505). The read-only [Preprod observer](../scripts/product/preprod-observer.mjs)
rechecked `SUCCESS`, canonical finality and a call to the escrow for each; the
native fund/claim effects were separately inspected. These public IDs are not
owner-wallet or frontend-origin evidence.

## Level 1 — technical foundation present, submission incomplete

Node 22/npm, Docker, Compact 0.31.1, current NIGHT source, local generated
fund/claim circuits/keys, tests, a finalized Preprod deployment, initial idea,
public README/setup and more than five reviewed meaningful commits have evidence
above and in [TOOLCHAIN](TOOLCHAIN.md). The generated files are reproducible rather
than tracked. Owner-supplied local `compile.png` shows both circuits and exit 0;
`contract.png` shows the Preprod 1AM Explorer contract page but not the deployment
transaction. Both images need public publication before they serve as submission
links. The [deployment record](../deployments/preprod/night-payment-escrow.json)
provides the exact finalized transaction independently of the screenshot.

## Level 2 — frontend and privacy observation incomplete

The explicit [1AM/Lace picker](../src/components/wallet-connect-modal.tsx) and
[wallet adapter](../src/lib/midnight/oneam.ts) implement connect/disconnect. The
owner reports 1AM acceptance in place of the supplied Lace wording. Contract
fund/claim calls exist, but read-only chain records do not identify the originating
frontend session. Private bearer authority, public note/nullifier and local proofs
are inspectable; a real wallet/public-transcript observation is pending. The
[hosted link](https://moneymole.vercel.app/) and
[video page](https://drive.google.com/file/d/13UA_JUO9VrcOQFvnCMzpRd1Z_H6BUKVl/view?usp=sharing)
are reachable, but their actual wallet/circuit content is unreviewed. Native NIGHT amounts and
addresses are public; no hidden-value claim is made. The 8-commit threshold is met
by the older reviewed history.

## Level 3 — functional acceptance and current CI incomplete

Send/Receive/Activity, encrypted recovery, safe retries and the one-time claim
circuits are implemented. More than three deterministic/contract/integration tests
pass locally, and an older remote CI run passed. A complete independent-wallet
payment, receiver spend, replay rejection, recovery and disclosure observation is
not evidenced. Current-head CI failed as shown above. [PROPOSAL.md](../PROPOSAL.md)
is a draft; no organizer idea-list submission or approval is evidenced. The
10-commit threshold is met. The [live URL](https://moneymole.vercel.app/) is reachable;
the local `test-ss.png` shows 111 passing Vitest cases at capture but is not public.
The [video page](https://drive.google.com/file/d/13UA_JUO9VrcOQFvnCMzpRd1Z_H6BUKVl/view?usp=sharing) is reachable; one-minute length and full flow are unreviewed.

## Level 4 — real escrow activity, MVP proof incomplete

The deployed Preprod escrow and fund/claim actions are real. This does not yet
establish the complete live MVP: independent Wallet B credit/spend, link/QR
delivery, reload/import and replay checks remain in the [acceptance matrix](TESTING.md).
README, [setup](RUNBOOK.md) and [usage](USAGE.md) exist. The CI workflow exists,
but the latest checked run 36555725199 failed; check newer runs separately. The
15-commit threshold is met. The [hosted app](https://moneymole.vercel.app/),
[X profile](https://x.com/moneymolepay) and [video page](https://drive.google.com/file/d/13UA_JUO9VrcOQFvnCMzpRd1Z_H6BUKVl/view?usp=sharing) are reachable, but reachability
does not establish a working hosted Preprod MVP or that the video shows it.

## Level 5 — user and feedback evidence pending

The same NIGHT flow has recovery, QR, destination-binding, receipt and safe-retry
extensions. Its Level 4 live-acceptance gap carries forward. The 20-commit threshold
is met. The owner-supplied local CSV contains 70 rows, 70 distinct submitted
Preprod-formatted wallet strings and 70 nonblank feedback fields. It does not prove
wallet activity, independent people, consent to public roster release or a
feedback-to-shipped-change loop. [USERS.md](../USERS.md) and [FEEDBACK.md](FEEDBACK.md)
record those boundaries. The [hosted URL](https://moneymole.vercel.app/) and
[video page](https://drive.google.com/file/d/13UA_JUO9VrcOQFvnCMzpRd1Z_H6BUKVl/view?usp=sharing) are supplied and reachable; their full-MVP content is unreviewed.

## Level 6 — rubric conflict and external evidence pending

The owner-supplied detailed checklist asks for 70 total Preprod users and 30
meaningful commits. The public [Rise In program page](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)
describes a Mainnet launch and 20 real users instead. Organizer confirmation is
needed before treating either user/network interpretation as the final rubric.
The reviewed 35 substantive published commits exceed the stricter supplied
commit threshold; no verified user cohort, feedback-to-change loop or Mainnet
deployment is claimed. [LAUNCH_USERS.md](../LAUNCH_USERS.md) records the local
CSV's limits. The [live link](https://moneymole.vercel.app/), [product X](https://x.com/moneymolepay) and
[video page](https://drive.google.com/file/d/13UA_JUO9VrcOQFvnCMzpRd1Z_H6BUKVl/view?usp=sharing) are supplied and reachable. Screenshots remain local/unpublished.

## Privacy and next independent observations

The native asset uses `receiveUnshielded` and `sendUnshielded`; amount, addresses,
timing and possible transfer relationships remain visible. Compact hides the
bearer authority/nonce, and the encrypted local records stay client-side. See
[PRIVACY](PRIVACY.md) and [disclosure audit](disclosure-audit.md). Real 1AM approval,
independent-wallet receipt/spend, secret-delivery/recovery, replay rejection and
review of the public transcript require owner-operated wallets. Those observations
must be recorded without claim secrets, seeds, private records or personal data.
