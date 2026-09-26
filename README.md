# Private Payments

A product-specific development foundation for a **sender-funded, single-use shielded
payment link on Midnight Preprod**. Working label only; payment features are not yet
implemented. The repository contains a truthful Next.js shell and the self-contained
Codex execution workflow that builds the product from this starting state.

> Read and execute BUILD.md.

## Preparation status — read first
Source files and dependency-free tooling are created. **Full preparation validation
is blocked:** the build environment has no registry DNS access and no Codex, Docker
or Compact installation. Therefore there is no genuine `package-lock.json`, installed
Next/SDK graph, observed shell run, compiled circuit/key material, wallet connection,
contract deployment or live payment. Exact manifest pins are candidate versions,
not a tested compatible npm graph. No fake lockfile or successful transaction is supplied.

See `docs/PREPARATION-REPORT.md` for checks actually run and `docs/STATUS.md` for
current blockers. A source or utility check passing is not product acceptance.

## Start in your repository
Extract this directory into an empty working directory, including hidden `.codex`,
`.agents` and `.github` folders. Use Node 22.16.0/npm 10.9.2 on Linux or WSL2. Review
project configuration and open the repository in Codex. Approve normal project trust
only after review; reopen the session if required. Do not change global settings.

```sh
npm run check:offline
npm run bootstrap
npm run verify:boilerplate
npm run dev
```

Bootstrap creates the missing **real** lockfile from the registry and installs with
npm ci. It may expose incompatible candidate pins; M0 directs Codex to correct them
using actual package metadata. Full verification remains blocked until tools/client
capabilities and shell behavior are observed. After source preparation, the exact
Codex instruction above executes BUILD.md and continues through unblocked milestones.

## Intended product and privacy boundary
Connect -> fund a real shielded asset -> verify funding -> share local link/QR ->
independent receiver claims -> verify finality, credit and spendability. Claiming
must consume existing funded value, never mint a replacement. The first implementation
milestone proves this with two wallets after the sender disconnects.

The link is a bearer capability, including for its creator. There is no automatic
refund, expiry or recovery. A lost secret may leave funds inaccessible. Test assets
are explicitly non-redeemable; NIGHT and DUST are not substitutes for the shielded
payment asset. Amount privacy and participant unlinkability are requirements to
validate, not properties this shell establishes. See `docs/PRIVACY.md`.

## What is present
A single Next App Router/TypeScript/Tailwind shell with a source-owned shadcn-style
button; integer amount helpers and design-only ports; bounded fail-closed scripts;
three exact-model Codex agent definitions; four focused skills; six executable task
cards; structured requirements/evidence states; threat model and gated architecture;
local utility tests and future test/CI definitions. Product action entry points
intentionally block until their actual implementations exist.

## Context map
- `BUILD.md`, `PLANS.md`, `AGENTS.md`: execution, ownership and resume protocol.
- `docs/PRODUCT.md`, `ARCHITECTURE.md`, `PRIVACY.md`: scope, protocol hypotheses and invariants.
- `docs/requirements.json`: authoritative IDs/status/evidence; readable report is generated.
- `docs/TOOLCHAIN.md`, `SOURCES.md`, `RUNBOOK.md`: version evidence, commands and recovery.
- `docs/TESTING.md`, `EVIDENCE.md`: exact verification scope and sensitive-record boundaries.
- `docs/tasks/`: prerequisites, interfaces, role ownership, commands, recovery and evidence per milestone.

## Qualification and repository history
Level 6 uses Preprod and 70 total real participants. Plan conservatively for 30
meaningful owner commits pending source-conflict confirmation. Product eligibility,
public repository metadata, supplied product references, remote pipeline runs and
real participant evidence remain pending unless observed. No commits or history
rewrites are performed automatically; a numeric count alone proves little.
