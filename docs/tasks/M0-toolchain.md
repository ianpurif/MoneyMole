# M0 — Resolve and validate the foundation

State: local setup and application verification passed. Exact Node/npm, locked dependencies, Compact, Docker/prover and browser access are ready. Requested Codex model/discovery and Midnight MCP gates remain blocked and do not prevent local app testing.

The work below specifies required behavior and acceptance. The current BUILD.md directive authorizes autonomous local setup and verification; complete all automatable work before requiring manual wallet actions.

**Lead:** architect; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
AGENTS.md, docs/STATUS.md, docs/TOOLCHAIN.md, docs/SOURCES.md, toolchain.lock.json

## Stack constraints
Use Next.js App Router, TypeScript and Tailwind CSS for the single frontend/backend
application. HTTP APIs: `src/app/api/**/route.ts`; server-only modules:
`src/lib/server/` with `import "server-only"`. Server Actions are limited to
appropriate non-secret UI mutations. No Express, NestJS, Fastify or separate
backend without a verified requirement and ADR. 1AM authorization, claim secrets,
private witnesses and private-state handling stay client-side and never enter
Next.js APIs or Server Actions. Follow `docs/ARCHITECTURE.md` for the trust boundary.

## Prerequisites
An owner-authorized Linux/WSL2 host with registry access. Project configuration may require one-time trust. Preserve existing files and do not edit global Codex settings.

## Owned files and interfaces
package.json, package-lock.json, toolchain.lock.json, .codex/, scripts/bootstrap.mjs, scripts/codex-doctor.mjs, scripts/install-compact.mjs, docs/TOOLCHAIN.md, docs/SOURCES.md

Assign explicit non-overlapping subsets before delegation; no worker may edit all paths merely because this task lists them.

## Concrete work
1. Inspect runtime, installed Codex version/help/schema and effective configuration. Run the read-only doctor; inspect the actual agent listing. Verify all three requested models AND reasoning levels for this account. Record unavailable combinations; do not substitute. Set project trust only through the owner's explicit client action. Reopen the session after configuration changes where needed.
2. Recheck official Preprod component compatibility and source dates. Map components to real package names/exports from the tagged 4.1.1 source, not main. Inspect connector 4.0.1 types, wallet APIs, qualification types and testing providers.
3. Resolve the exact manifest through npm. If a candidate pin is unavailable or incompatible, record the precise resolution evidence, select a supported compatible version, update manifest/toolchain/ADR together and regenerate the single genuine lockfile. Never use independent latest versions or a fabricated lock.
4. Obtain the exact Compact 0.5.1 release asset and checksum through the official release API, record them in toolchain.lock.json, and inspect the script before owner-authorized installation. Install compiler 0.31.1; verify both versions. Complete scripts/install-compact.mjs for pinned CI use without unreviewed curl-to-shell. Verify Docker image/digest, actual entrypoint and loopback port.
5. Inspect npm lifecycle requirements and installed types. Run lint, main typecheck, unit tests, shell browser test and build; fix genuine errors. Install the Playwright browser using its pinned local CLI. Compile the nonpayment probe as a syntax check only.
6. Check Midnight MCP from the trusted client and record its actual tool listing. Do not send source secrets. A published endpoint is not a working connection.

## Commands — repository root
Entry points are implemented. Run all local commands under the current owner authorization. Missing real wallet inputs remain blocked; complete independent checks.

```sh
npm run bootstrap
npm run doctor
npm run doctor:codex
npm run doctor:mcp
npm run compile:probe
npm exec -- playwright install chromium
npm run verify:boilerplate
```

## Acceptance
Expected: genuine lock and npm ci success; SDK mappings and compiler verified; application builds with explicitly authorized payment controls; requested agents discovered. Probe success is not asset transfer. Doctor commands can remain blocked until missing owner actions are completed.

## Failure and resume
If DNS/registry access fails, record the actual error and continue dependency-free work. After three equivalent failures stop retrying. If a package/schema differs, change one hypothesis and verify primary source plus installed types. Do not weaken permissions or claim model substitution.

## Evidence and requirement updates
reports/doctor.json, reports/codex-doctor.json, reports/mcp-doctor.json, reports/boilerplate.json, docs/evidence/M0-toolchain.json

Relevant IDs: PREP-LOCK, PREP-SHELL, PREP-CODEX, PREP-MCP, L1-NODE, L1-DOCKER. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.
