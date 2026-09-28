# Evidence and external qualification

`requirements.json` is authoritative. `verified` requires an actual passed command,
precise scope, date, evidence-file digest and digests of relevant source/config
subjects. The validator checks those references and detects changes. This prevents
an old pass from automatically surviving source edits; it is not a substitute for
technical review of what the command actually proved.

Technical readiness does not establish organizer eligibility, wallet control,
unique humans or user feedback. The current [Level audit](LEVEL-AUDIT.md) applies
the owner-supplied detailed checklist, uses the stricter 30-commit Level 6
threshold and distinguishes its Preprod/70-user wording from Rise In's public
Mainnet/20-user summary. [Commit audit](evidence/commit-audit.json) reviewed 35
substantive published commits on an ancestor of current `main`. The [public
repository](https://github.com/ianpurif/MoneyMole) and an [older passing CI run](https://github.com/ianpurif/MoneyMole/actions/runs/36319963556)
are verifiable; [run 36371511897 for 8e12329](https://github.com/ianpurif/MoneyMole/actions/runs/36371511897)
failed at its browser security/synthetic authorization step. Check newer runs
through the live workflow; the older pass does not prove a newer commit is green.
Videos, hosted URL, screenshots, X,
users/wallet roster, feedback and idea approval are unfilled requirements or owner
placeholders, not exclusions that can be called passed. `requirements.json`'s
embedded `levelAudit` is a historical pre-NIGHT snapshot; its engineering
requirement states remain source-bound and are distinct from this submission audit.

## Current NIGHT evidence boundary

The [native escrow deployment record](../deployments/preprod/night-payment-escrow.json)
and [read-only Level evidence](evidence/native-night-level-verification.json) establish a
finalized Preprod NIGHT contract with matching fund/claim keys. Read-only indexer
and node checks observed two successful native funding calls and one claim call.
They do **not** establish the app/browser origin of those transactions, independent
Wallet B credit/spend, claim-link delivery, live recovery or hidden value. The
historical issuer and its tests are a separate asset and cannot substitute for
the NIGHT escrow. The current NIGHT asset is unshielded: amount and address data
are public. See [privacy](PRIVACY.md) and [acceptance](TESTING.md).

## Local participant attestation validator
`npm run evidence:participants -- <records.json> <trusted-public.pem>` verifies
**signed owner-observation integrity only**. Keep records and public-key trust
configuration outside Git, normally under `private-evidence/`. Obtain the attester
public key independently; accepting a key bundled by an untrusted submitter defeats
authenticity. The utility never signs or fabricates usage records.

Each record has exactly these fields:

| Field | Meaning |
|---|---|
| kind | Fixed `owner-observed-preprod-v1` |
| network | Fixed `preprod`, as asserted by the trusted attester |
| walletAddress | Exact locally retained wallet string; not a public report field |
| participantRef | Consented pseudonymous reference, 8–80 URL-safe characters |
| consent | Must be true |
| observedAt | Valid non-future observation timestamp |
| activity | `funded` or `claimed`, as attested |
| evidenceSha256 | Digest of locally retained observation evidence |
| signature | Ed25519 signature encoded as unpadded base64url |

The exact signed bytes are UTF-8 JSON of ordered `[fieldName, value]` pairs in the
order above excluding `signature`; use `attestationBytes()` as the canonical function.
Do not sign ordinary JSON object text whose ordering may vary. The signing key is
never accepted by the validator. Duplicate wallet strings are counted once; invalid
records are reported by index, never by raw address or participant name.

This preparation utility does **not** decode network-specific addresses, query chain
history, inspect the raw evidence behind a digest or prove unique humans. Network and
activity are signed assertions, not independently revalidated facts. Distinct
participant references are not a unique-human count. Its successful exit means only
that the supplied record signatures/structure were valid. Add
`--require-qualification` to require qualification; it returns blocked until the
additional owner/organizer decisions and independent human evidence are supplied.

An optional exact-SDK chain reference verifier is now implemented:
`npm run evidence:participants -- <private-records.json> <trusted-public.pem> --chain-manifest <private-manifest.json>`.
The private NIGHT manifest has `schemaVersion: 2`, `asset: "NIGHT"` and `entries`,
each containing evidenceSha256, transactionId, contract and amountAtomic (STAR).
It is bounded to 1,000 records and decodes Preprod unshielded addresses, checks
NIGHT escrow verifier keys, canonical successful fund/claim actions, exact native
amounts and the attested address against native input/output ownership. Only aggregate counts are printed. Signed consent and a separately trusted
attester key remain mandatory. Public chain data binds an unshielded address, not an independent person; human
identity remains a separate trusted private attestation. Keep the manifest outside Git. Missing or failed checks do not count.
Owner/organizer approval of this trust basis remains pending. Retain the explicit
wallet/human distinction. The supplied Level 5 target is 50 real Preprod
participants and the supplied Level 6 target is 70 total; Rise In's public Level 6
description differs. Neither target is completed by this utility alone. See
[USERS.md](../USERS.md) and [LAUNCH_USERS.md](../LAUNCH_USERS.md) placeholders.
Never disclose private payment relationships to meet an evidence target.

## Meaningful history
`history:inspect` reads existing Git history only. Planned milestones in `COMMITS.md`
are suggestions, not fabricated events. Standing owner authorization permits a concise local commit after every logical
change. Pushes to ianpurif/MoneyMole are now owner-authorized; history rewrites remain unauthorized. Never alter timestamps/author identity or rewrite history to meet
counts. A numeric count alone does not prove meaningful engineering.
