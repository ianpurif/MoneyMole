# Evidence and external qualification

`requirements.json` is authoritative. `verified` requires an actual passed command,
precise scope, date, evidence-file digest and digests of relevant source/config
subjects. The validator checks those references and detects changes. This prevents
an old pass from automatically surviving source edits; it is not a substitute for
technical review of what the command actually proved.

Technical readiness does not establish eligibility, public repository availability,
actual remote pipeline success, meaningful owner commits or real-human participation.
Organizer approval remains owner-pending. The strict current audit applies 30 for
Level 6 and verifies 35 substantive published commits. Public repository access
and successful CI run 36295888117 at 1b3ed38 were independently checked after the
owner supplied the repository URL. See LEVEL-AUDIT.md, evidence/commit-audit.json,
evidence/github-verification.json and evidence/level-verification.json. Other
public metadata fields remain null until supplied and checked. Current audit
exclusions are authoritative in requirements.json.auditScope; excluded items are
not silently marked verified. Later local documentation has not been pushed.

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
The private manifest has `schemaVersion: 1` and `entries`, each containing the signed
record's `evidenceSha256`, public `transactionId` and payment `contract`. It is
bounded to 1,000 nonempty records and decodes Preprod shielded addresses, checks
compiled escrow verifiers, finalized successful fund/claim actions and shielded
events. Only aggregate counts are printed. Signed consent and a separately trusted
attester key remain mandatory. Public chain data cannot independently bind a
shielded actor to a person or wallet; that association remains the trusted private
attestation. Keep the manifest outside Git. Missing or failed checks do not count.
Owner/organizer approval of this trust basis remains pending. Retain the explicit
wallet/human distinction. The Level 5 target is 50 real Preprod participants; Level 6
is 70 total, not invented additional people. Neither row is completed by this
utility alone. Never disclose private payment relationships to meet an evidence target.

## Meaningful history
`history:inspect` reads existing Git history only. Planned milestones in `COMMITS.md`
are suggestions, not fabricated events. Standing owner authorization permits a concise local commit after every logical
change. Pushes to ianpurif/MoneyMole are now owner-authorized; history rewrites remain unauthorized. Never alter timestamps/author identity or rewrite history to meet
counts. A numeric count alone does not prove meaningful engineering.
