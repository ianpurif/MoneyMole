# Local operating runbook

All commands below run from the repository root on Linux/WSL2 with Node 22 and npm
10.9.2. Stop servers with Ctrl-C or the exact service command; do not kill unrelated
processes. Exit 0 means the stated scope passed, 1 means failure, 2 means blocked.
No utility pass establishes payment or challenge completion.

## Initial path
```sh
npm run check:offline
npm run bootstrap
npm run doctor
npm run verify:boilerplate
npm run dev
```
These are sequential manual commands, not an instruction to ignore a failure.
Bootstrap currently needs target-host registry access. Review Compact installer
metadata before `node scripts/install-compact.mjs --approve-reviewed-installer`.
Use `npm exec playwright install chromium` after the pinned package is installed.
Do not run a local server in a fire-and-forget loop; retain its process/session
handle and shut it down deliberately when done.

## Command ledger

| npm run command | Exact script | Scope / readiness |
|---|---|---|
| `bootstrap` | `node scripts/bootstrap.mjs` | Creates a genuine lock if absent, then npm ci; requires registry access. |
| `deps:lock` | `node scripts/bootstrap.mjs --lock-only` | Only resolves the real graph; no fabricated dependency entries. |
| `doctor` | `node scripts/doctor.mjs` | Presence/version checks; Docker/Compact/Codex absence is blocked. |
| `doctor:codex` | `node scripts/codex-doctor.mjs` | Read-only client/model/config probe; custom-agent discovery remains a separate observed gate. |
| `doctor:mcp` | `node scripts/mcp-doctor.mjs` | Read-only installed-client MCP tool listing; blocks if the configured server exposes no tools. |
| `check:offline` | `node scripts/offline.mjs` | Source consistency and Node utility tests only; may pass with product blocked. |
| `test:boilerplate` | `node --experimental-strip-types --test tests/boilerplate/*.test.mjs` | Dependency-free utility assertions only, no payment acceptance. |
| `verify:boilerplate` | `node scripts/verify-boilerplate.mjs` | Full preparation gate; missing graph/tools/client validation produces nonzero. |
| `dev` | `next dev --webpack --hostname 127.0.0.1` | Starts the Next application after dependencies are resolved; Ctrl-C stops it. |
| `start` | `next start --hostname 127.0.0.1` | Serves an existing production build locally. |
| `lint` | `eslint . --max-warnings=0` | ESLint strict; warnings are failures. |
| `typecheck` | `tsc --noEmit` | Full project TypeScript, requires installed packages. |
| `build` | `next build --webpack` | Next production build with browser WebAssembly; no simulated product acceptance. |
| `test:unit` | `vitest run --project unit` | Installed Vitest deterministic suite; no empty test pass. |
| `compile:probe` | `node scripts/compile.mjs --probe` | Compiler-only nonpayment witness probe; no product qualification. |
| `compile:coin-probe` | `node scripts/compile.mjs --coin-probe` | M1 private shielded I/O compiler diagnostic; lacks authorization, never deploy/fund. |
| `compile:contracts` | `node scripts/compile.mjs --product` | Actual payment contract compilation; missing implementation blocks. |
| `compile:issuance` | `node scripts/compile.mjs --issuance` | Separate fixed-supply test issuer; no deployment or mint transaction. |
| `verify:artifacts` | `node scripts/product.mjs artifacts` | Checks all compiler output hashes, circuit keys/IR, source hashes and installed runtime compatibility. |
| `verify:issuer` | `node scripts/verify-issuer.mjs` | Read-only real Preprod issuer deployment/state/verifier checks against the preserved record; does not verify payment escrow or acceptance. |
| `verify:connectivity` | `node scripts/verify-browser-connectivity.mjs` | Fresh Chromium checks the running app at 127.0.0.1:3000, browser CORS access to local prover OPTIONS, and real read-only Preprod indexer/RPC fetches. No wallet or transaction. |
| `test:contracts` | `node scripts/product.mjs contracts` | 13 synthetic cases execute actual generated contracts; no ledger settlement. |
| `test:integration` | `node scripts/product.mjs integration` | Encrypted journal/storage integration with fake IndexedDB and synthetic submission callbacks; no live payment acceptance. |
| `test:proving` | `node scripts/product.mjs proving` | Real loopback constraint checks and proof generation for synthetic fund/claim/issue fixtures; no sealed transaction acceptance. |
| `test:preprod` | `node scripts/product.mjs preprod` | Read-only real chain checks; requires --manifest with observed funding/claim/spend IDs. See OWNER-TESTING.md. |
| `verify:product` | `node scripts/product.mjs acceptance` | Revalidates chain + hashed owner-reviewed matrix with --acceptance; missing observations block. |
| `test:browser` | `playwright test` | Playwright security/synthetic wallet UI checks. Does not prove extension operation. |
| `services:up` | `node scripts/services.mjs up` | Starts only the project proof-server Compose service. |
| `services:down` | `node scripts/services.mjs down` | Stops only that service; does not delete volumes or unrelated services. |
| `services:status` | `node scripts/services.mjs status` | Inspect project service through Docker Compose. |
| `services:check` | `node scripts/services.mjs check` | Bounded local TCP check; deliberately blocked for full proof readiness. |
| `deploy:preprod` | `node scripts/product.mjs deploy` | Writes a nonexecuting browser deployment plan and returns 2 for owner signing; never deploys from CLI. |
| `verify:deployment` | `node scripts/product.mjs deployment` | Read-only escrow identity/finality check with --record; missing records block. |
| `requirements:report` | `node scripts/requirements.mjs --write` | Derives Markdown from authoritative JSON. |
| `requirements:check` | `node scripts/requirements.mjs --check` | Checks graph, evidence digests and derived-report consistency. |
| `evidence:participants` | `node scripts/participants.mjs` | Signed attestation integrity; optional --chain-manifest checks public activity references. Neither establishes humans; see EVIDENCE.md. |
| `history:inspect` | `node scripts/history.mjs` | Read-only Git history; no automatic commits. |

## Recovery boundaries
Issuer verification preserves the original deployment record. If the app lockfile
has gained UI dependencies, it loads the original lockfile from immutable Git
commit `d4e89bd1589070549e50bb3ee14746708cfa4ead`, checks its recorded SHA-256, and
requires every original dependency version, integrity and graph entry to remain
identical (dev-only packages may be promoted to production). Contract source,
generated code, verifier and toolchain digests must still match exactly. Missing
history or changed dependencies fail closed. Both deployment and latest state
must be on the node's finalized canonical chain. No redeployment is performed.

All product entry points are present. Missing live inputs and incomplete acceptance
remain blocked; do not remove the gate to manufacture evidence. Keep private diagnostic data out of reports.
After three repeated failures, record a new hypothesis or the exact blocker.

For occupied prover ports, inspect the listener before configuring another port.
For stalled transactions, reconcile recorded identifiers before resubmission.
For deployment loss, verify durable records before any new deployment. For encrypted
store failure, preserve the original data and do not reset automatically.

## Client activation
Review the project, then use Codex's normal trust prompt and reopen the session as
needed. Inspect effective configuration, requested model efforts, discovered agent
names and Midnight MCP tool listing. Do not edit global settings to force trust or
route to an unrequested model. Record actual owner action/evidence in M0.

## Network-changing jobs
Current CI performs local engineering checks only. It has no wallet secrets or
permission to deploy. A future live job must be explicitly authorized, use a trusted
revision and protected execution environment, and preserve human wallet authorization
where required. Never run funded live operations from untrusted pull-request code.

## Stack contract

Next.js App Router serves frontend and backend with TypeScript and Tailwind CSS.
Use Route Handlers in `src/app/api/**/route.ts`, appropriate non-secret Server
Actions, and server-only modules in `src/lib/server/`. Follow
`docs/ARCHITECTURE.md`: no Express, NestJS, Fastify or separate backend without a
verified requirement; 1AM authorization, claim secrets, private witnesses and
private-state handling stay client-side and never enter Next.js API routes.

## This host
Windows NVM and the WSL project runtime both use Node 22.16.0 / npm 10.9.2.
Use WSL for dependency installation, builds and tests; do not mix Windows and
Linux native packages in one node_modules directory. `.env.local` contains the
public `PROOF_SERVER_PORT=6300` setting. `npm run services:*` resolves process env,
then `.env.local`, then `.env` and passes the same validated port to Compose.
The app pins Preprod endpoints in source; unused NEXT_PUBLIC variables do not
configure wallet authority or contract selection. Select the escrow in the browser.

In WSL, `bash .local/run.sh npm run <command>` selects the verified project-local runtime. The helper is ignored host state, not a portable installation. Windows Docker Compose is installed; Ubuntu's plugin is absent. Use `docker compose --file compose.yaml up -d proof-server` and `docker compose --file compose.yaml stop proof-server` from this repository in PowerShell. No wallet data is passed through these commands. Build before test:browser.

WSL service commands prefer native Compose, then reuse the installed Docker Desktop
CLI under /mnt/c when available. The Compose file path is translated with wslpath;
arguments are passed directly without a shell. services:up/down remain scoped to
the project proof-server service. No global plugin installation is required here.
