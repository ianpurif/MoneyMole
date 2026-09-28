# Preparation report — historical checkpoint

This report captures its original preparation date. Deployment, wallet and CI
statements below are historical; see [STATUS](STATUS.md) and the
[current Level audit](LEVEL-AUDIT.md) for native NIGHT evidence.

Historical initial snapshot. Follow `STATUS.md` and `docs/evidence/M0-toolchain.json`
for subsequent installation and execution results; statements below describe the
original preparation run and are retained as historical evidence.

Prepared 2026-09-26. **Overall preparation: BLOCKED.**

Source files have been created. Full dependency installation, application runtime,
installed Codex validation, Compact compilation and real payment acceptance were
not completed. This package is not a finished or live-tested payment application.

## Checks actually observed

| Check | Result | Scope |
|---|---|---|
| `npm run check:offline` | Passed | Source consistency and dependency-free utilities only |
| Utility tests | 45 passed; 0 failed; 0 skipped | Amount parsing, requirements graph/report integrity, signed-attestation integrity and command boundaries |
| JavaScript syntax | 21 modules passed | Parser checks, not dependency resolution |
| Domain-only TypeScript | Passed | `tsc -p tsconfig.domain.json`, environment TypeScript 5.8.3 |
| TypeScript/TSX syntax | 13 files passed | Global TypeScript 5.8.3 transpile syntax checks, not full application type resolution |
| Configuration formats | 7 primary JSON, 4 TOML and 2 YAML files parsed; 4 skill metadata headers checked | Format checks, not installed Codex/Compose schema execution |
| `npm run requirements:check` | Passed | IDs, states, dependency graph, evidence digests and generated report consistency |
| `npm run verify:boilerplate` | Exit 2 — blocked | Genuine dependency graph and required installed tools/client observations missing |
| Product compilation / probe / acceptance commands | Exit 2 — blocked | Missing payment contract, compiler and product acceptance implementation correctly rejected |
| Unapproved Compact installer | Exit 2 — blocked | No unreviewed installer executed |
| Bounded npm registry lookup | Exit 1, EAI_AGAIN | Runtime DNS resolution failed; package existence was not established by this call |

The project target compiler is TypeScript 5.9.3. The existing global 5.8.3 compiler
was used only for explicitly scoped source checks; it is not a silently substituted
installed project dependency.

## Created vs planned vs observed
**Created:** application shell source, exact candidate dependency manifest, three
project agent definitions, four focused skills, technical context, six executable
milestone specifications, structured Level 1–6 requirements, private-payment threat
model, command/tooling source, isolated tests and a fail-closed CI definition.

**Implemented and tested in the narrow utility scope:** integer amount helpers,
requirements validation/report generation, owner-attestation integrity verification
and command failure boundaries. This supports PREP-TOOLS only, not payment requirements.

**Not implemented:** real payment contract, shielded escrow/claim adapter, wallet
integration, encrypted private-state implementation, claim-link/QR operation, real
product suites or deployed payment operations. The compile-only Compact probe is
source-grounded candidate syntax, not compiled evidence.

**Not observed:** npm ci, main application lint/typecheck/build/runtime, Playwright
execution, compiled managed circuits/keys, local Docker/prover operation, actual
Codex model routing/delegation, Midnight MCP tools, Lace authorization, deployment,
receiver asset credit/spendability, real participation or remote CI execution.

## Dependency lockfile exception
A genuine `package-lock.json` is intentionally absent. Runtime registry lookup
returned `getaddrinfo EAI_AGAIN registry.npmjs.org`. No root-only or fabricated
lockfile is presented as a resolved graph. On a connected authorized host,
`npm run bootstrap` resolves it from the exact candidates and runs npm ci. M0
requires correcting any evidenced incompatible candidates before acceptance.
This is an unmet preparation requirement, not a completed setup step.

## Model and MCP status
Requested model IDs/efforts are preserved exactly in TOML: architect gpt-6-astra /
medium; engineer gpt-6-sol / high; verifier gpt-6-luna / max. The TOML files parse
and follow reviewed published fields, but no installed client/schema or account
model list was available here. No substitution or delegation occurred.

Midnight MCP is project-configured at its documented endpoint. The read-only
doctors inspect actual account/config/tool-list data when Codex exists; those
operations were blocked here. Project trust and observed custom-agent discovery
remain owner/target-client actions. No global Codex settings were changed.

## Architecture and pending security gates
The single-app, sender-funded bearer flow is preserved. One existing shielded coin
must fund each note; claiming must consume it, not mint. Receiver-initiated claiming,
independent witness qualification, commitment/nullifier privacy and destination
binding remain M1 gates. A commitment/proof is never counted as a payment. Encrypted
persistence, fragment handling, CSP and local QR behavior are defined but not falsely
reported implemented. No central custody or arbitrary remote prover is introduced.

## Evidence files
`docs/evidence/utility-acceptance.json` contains current utility/guard observations.
`docs/evidence/preparation-gate.json` contains the actual full preparation result.
`docs/evidence/source-syntax.json` scopes the TS/TSX parser check.
`docs/evidence/preparation-commands.json` preserves earlier environment observations;
its original utility run had fewer tests before additional checks were added.

## Next exact action
Open the extracted directory as the repository root in the installed Codex client,
review normal project trust, then instruct:

> Read and execute BUILD.md.
