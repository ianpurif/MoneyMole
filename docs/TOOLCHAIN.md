# Toolchain and environment

## Application stack and privacy boundary

Use **Next.js App Router for both frontend and backend**, **TypeScript**, and
**Tailwind CSS**. Backend HTTP APIs belong in `src/app/api/**/route.ts` using Next.js
Route Handlers. Use Server Actions only for appropriate non-secret UI mutations,
with validated inputs and authorization. Put server-only modules in
`src/lib/server/` and mark them with `import "server-only"`.

No Express, NestJS, Fastify or separate backend service unless a verified technical
requirement is recorded in an ADR. The trusted local proof service is a protocol
tool, not a separate application backend. Add endpoints only for an actual need.
1AM wallet authorization, claim secrets, private witnesses and private-state
handling remain client-side. Never pass these secrets to Next.js API routes,
Server Actions, server components, server-rendered props, logs or telemetry.
Browser-to-trusted-local-prover traffic stays outside the Next.js backend.


## Reviewed Preprod component set
Primary source S7, checked 2026-09-26:

| Component | Version |
|---|---|
| Compact devtools / compiler | 0.5.1 / 0.31.1 |
| Compact runtime / Compact.js | 0.16.0 / 2.5.1 |
| Platform JS / on-chain runtime | 2.2.4 / 3.0.0 |
| Wallet SDK / connector API | 1.2.0 / 4.0.1 |
| Midnight.js / testkit | 4.1.1 / 4.1.1 |
| Indexer / proof server | 4.3.302 / 8.1.0 |
| Midnight network node | 1.0.3 |
| Host Node.js / npm target | 22.16.0 / 10.9.2 |

`toolchain.lock.json` is a reviewed component manifest, **not** an npm lockfile or
proof that packages were installed. Only contracts/types npm mappings were checked
against tagged 4.1.1 package source. Map remaining providers through installed
exports and exact registry metadata before adding dependencies. Avoid the main
branch's different beta protocol line.

## Historical preparation environment
Linux x86_64, Node 22.16.0 and npm 10.9.2 were available. Codex, Docker and Compact
executables were absent. Registry lookup timed out; direct runtime HTTP failed DNS
resolution. Consequently no genuine `package-lock.json` could be generated, no
npm dependencies were installed, and no Next build, browser shell run, circuit
compilation, wallet or live chain operation was observed. See the preparation report
for actual offline checks and their separately stated compiler version.

## Target-host setup
Use Linux or WSL2 and a directory whose source files are under the owner's control.
Prefer the Linux filesystem for the compiler. Use `.nvmrc` and npm 10.9.2. Run
`npm run bootstrap` with registry access; it preserves an existing lockfile, otherwise
resolves a genuine one without running lifecycle scripts, then installs through
`npm ci`. It does not invent a dependency graph. Candidate versions may need a
source-supported correction during M0.

Compact installation requires a reviewed exact official release asset, its SHA-256
and explicit execution authorization. Fill only verified metadata in
`toolchain.lock.json`; `scripts/install-compact.mjs` refuses missing or unreviewed
metadata. The reviewed wrapper installs to `.local/compact/bin` without editing shell
profiles, and uses `COMPACT_DIRECTORY=.local/compact/artifacts`. Set both paths for
subsequent commands. Verify `compact --version` and `compact compile --version`.
Do not silently install a different compiler or update global Codex settings. [S8, S25]

## Local proof service
`compose.yaml` binds image `midnightntwrk/proof-server:8.1.0` only to loopback, default
host/container port 6300. The digest and image entrypoint were inspected locally;
Windows Compose startup and TCP reachability passed, then the service was stopped.
Synthetic local circuit proof generation passed; sealed transactions and browser-to-prover access remain unverified. Start only this project's service. When occupied,
inspect the existing listener and set an explicit alternate host port; do not kill
another process. Update the public prover URL and check the wallet's supported local
prover configuration separately. S8 describes Lace's historical local-prover
configuration, not verified 1AM behavior. 1AM advertises Connector v4 and multiple
proving options; migration does not authorize hosted proving or witness disclosure.
Verify actual 1AM behavior before enabling payment actions. [S8, S36]

`services:check` checks TCP reachability only and returns blocked for full proving
readiness. No unverified HTTP health route is invented. Actual readiness requires
service identity, browser access/CORS and a real proof. Serialize proving/compilation
using the shared local lock; don't run both merely because two workers are available.

## Codex trust, routing and MCP
The project config and three agent files follow the current published format, not
an installed schema validation. Project trust is an owner decision. Open this
repository in Codex, accept its normal trust prompt only after reviewing it, then
restart/reopen the session if required for discovery. Do not edit the owner's global
configuration to force loading. [S2, S3, S21]

`doctor:codex` starts a bounded read-only app-server session to inspect model efforts
and effective settings. It never starts a model turn or delegates. It still reports
blocked until custom-agent discovery is observed. Use the client's actual agent
listing and MCP status; do not guess unsupported slash commands. `doctor:mcp` uses the documented read-only `mcpServerStatus/list` to require a
Midnight tool listing from the installed client. It does not invoke tools or expose
authentication metadata; unsupported client protocols remain blocked.

## Recording actual custom-agent discovery
After an owner or the running Codex client actually inspects the installed schema
and discovers all three custom agents, write `docs/evidence/codex-session.json` with
kind `owner_observed_codex_session`, the exact observed clientVersion, observedAt,
installedSchemaValidated=true, projectConfigLoaded=true, agents containing each
role/model/effort/discovered=true, and subjects with SHA-256 digests of all four
`.codex` configuration files. Do not create this record from file existence alone.
The doctor checks the current account and effective config afresh and accepts this
scoped observation only while client version and subject hashes still match. This
is explicitly observed session evidence, not proof that delegation occurred.

## Installed follow-up (2026-09-26)
Registry access now works. Official Node 22.16.0/npm 10.9.2 is available under
`.local/node/node-v22.16.0-linux-x64/`. The distro's Node build lacks TypeScript
stripping. Exact Compact 0.5.1 was checksum-verified and extracted under
`.local/compact-devtools/compact-x86_64-unknown-linux-musl/`; compiler 0.31.1 is
already installed. `.local/run.sh` selects these paths for this host only.
The real npm graph installs; ADR 005 records the necessary Vite/Vitest resolution.
Installed protocol 4.1.1 exports ledger-v8 8.1.0, compact-runtime 0.16.0,
compact-js 2.5.1, onchain-runtime-v3 3.0.0 and platform-js 2.2.4.

Windows Codex 0.149.1 loads the project settings after config/read receives cwd.
Its account model listing does not expose the requested GPT-6 combinations, even
with hidden models included. This session exposes the three named roles, but the
CLI account/discovery gate is not fully satisfied. No delegation or substitution
occurred. The configured Midnight MCP returned no observable tool listing.

Browser ledger execution uses Next.js webpack async WebAssembly (ADR 006). Both

pm run dev and 
pm run build select webpack explicitly; no separate backend
is introduced. Validate generated contracts before serving public compiler artifacts.

