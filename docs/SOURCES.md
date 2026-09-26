# Primary-source research ledger

Access date for the sources below: **2026-09-26**. These are documentation/source
observations, not installed-client or live-network validation. The current runtime
could browse sources but could not resolve registry/download hosts for installation.
No original team sample or full organizer document was separately supplied beyond
the user's consolidated engineering specification. That specification is the source
for the Level 1–6 criteria; external documentation does not establish eligibility.

## Codex

| ID | Exact reference | Applicable scope | Conclusion / limitation |
|---|---|---|---|
| S1 | https://learn.chatgpt.com/docs/agent-configuration/agents-md | Current instruction discovery | Use root and scoped AGENTS files; essential context must persist in the repo. |
| S2 | https://learn.chatgpt.com/docs/agent-configuration/subagents | Current published agent configuration | `.codex/agents/*.toml` supports named custom agents; `agents.max_concurrent_threads_per_session` bounds spawned workers. Installed discovery still unverified. |
| S3 | https://learn.chatgpt.com/docs/config-schema.json | Published schema, not installed schema | Reviewed model/effort, agents and MCP fields. An accepted reasoning string does not prove account/model support. |
| S4 | https://learn.chatgpt.com/docs/build-skills | Current Codex skill discovery | `.agents/skills` with name/description metadata and progressively loaded instructions. |
| S5 | https://learn.chatgpt.com/docs/extend/mcp | Current MCP configuration | Project TOML supports an HTTP endpoint; configuration alone is not a transport handshake. |
| S6 | https://developers.openai.com/cookbook/articles/codex_exec_plans | Execution-plan guidance | Adapt resumable, self-contained milestone records; these task cards are original product-specific instructions. |
| S20 | https://learn.chatgpt.com/docs/models | Current published model guidance | Requested Astra, Sol and Luna names are documented; Luna supports Max. Actual account availability remains unverified. |
| S21 | https://learn.chatgpt.com/docs/config-file/config-basic | Current project settings | Project configuration is loaded for trusted projects; do not alter global trust automatically. |
| S22 | https://learn.chatgpt.com/docs/app-server | Current read-only inspection protocol | `initialize`, `initialized`, `config/read`, `model/list` and `mcpServerStatus/list` support read-only capability/tool-list inspection. Script transport execution is not tested without the client. |

The supplied developer URL entry points redirect in some cases to the references
above. Recheck installed help/schema and effective configuration rather than
assuming the published website describes every existing client release.

## Midnight

| ID | Exact reference | Applicable scope | Conclusion / limitation |
|---|---|---|---|
| S7 | https://docs.midnight.network/relnotes/support-matrix | Preprod snapshot reviewed 2026-09-26 | Component set matches `toolchain.lock.json`; component versions are not npm package names. |
| S8 | https://docs.midnight.network/getting-started/installation | Compact devtools/compiler and local prover | Linux/WSL2 path, `compact` version checks, `~/.compact/bin`, proof image 8.1.0 and container port 6300. Local services not executed. |
| S9 | https://docs.midnight.network/tokens/overview | Asset/fee distinction | NIGHT transfers are public; DUST is a fee resource, not the shielded payment asset. |
| S10 | https://docs.midnight.network/tokens/shielded-token | Current tutorial; validate against pinned types | Distinguishes fresh and qualified coins; warns of recipient notification limits and prover-claimed ownPublicKey. Mint-and-send tutorial is insufficient to validate independent escrow claiming. |
| S11 | https://docs.midnight.network/compact/standard-library/exports | Current published standard library | `receiveShielded`, `sendShielded`, qualified coin structures and persistent commitment/hash primitives are candidate protocol building blocks. Generated transcripts and installed types remain authoritative. |
| S12 | https://docs.midnight.network/ai-integration/kapa-mcp-server | Documentation MCP | Endpoint is `https://midnight.mcp.kapa.ai`; not a wallet/proof endpoint. |
| S13 | https://docs.midnight.network/api-reference/dapp-connector | Connector interface, cross-check version 4.0.1 | Wallet discovery, network connect, configuration, balances and transaction methods need exact installed-type verification. Do not copy inconsistent snippets blindly. |
| S14 | https://docs.midnight.network/relnotes/network | Preprod public services | HTTP node and v4 GraphQL endpoints used in `.env.example`; no operational or WebSocket handshake observed. |
| S15 | https://github.com/midnightntwrk/midnight-js/blob/v4.1.1/packages/contracts/package.json | Tagged 4.1.1 source | Confirms contracts package/version and protocol-layer dependencies; main is a different beta line. |
| S15b | https://github.com/midnightntwrk/midnight-js/blob/v4.1.1/packages/types/package.json | Tagged 4.1.1 source | Confirms types package/version; runtime and provider package mappings still require installation inspection. |
| S23 | https://docs.midnight.network/relnotes/dapp-connector-api | Connector 4.0.1 | Release/source cross-check for the connector component; not proof of a connected wallet. |
| S24 | https://docs.midnight.network/ai-integration/midnight-expert | Tooling concepts | Adapt doctor, compiler validation and privacy review into native skills; do not assume another client's commands work. |
| S25 | https://github.com/midnightntwrk/compact/releases/tag/compact-v0.5.1 | Devtools release | Release exists; exact installer asset, checksum and invocation review remain pending. |

## Frontend and test tooling

| ID | Exact reference | Applicable scope | Conclusion / limitation |
|---|---|---|---|
| S16 | https://nextjs.org/blog/nextjs-security-update-september-22-2026 | Next 16.3.6 | Security release is the selected Next target, not an installed build result. |
| S17 | https://nextjs.org/docs/app/getting-started/installation | App Router installation | Single application, strict TS and Node-compatible toolchain; resolve exact package peers in M0. |
| S18 | https://github.com/react/react/releases/tag/v19.3.0 | React 19.3.0 | Selected released React target; pair compatibility not locally tested. |
| S19 | https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.3 | Tailwind 4.3.3 | Selected release; verify postcss plugin package mapping through registry resolution. |
| S26 | https://ui.shadcn.com/docs/installation/next | Source-owned components | Use a small local button and `components.json`, not a runtime shadcn dependency. |
| S27 | https://github.com/microsoft/TypeScript/releases/tag/v5.9.3 | TypeScript 5.9.3 | Pinned project compiler target. Environment-only checks may use a separately reported global compiler. |
| S28 | https://github.com/microsoft/playwright/releases/tag/v1.63.0 | Playwright 1.63.0 | Selected browser runner; real extension operation still requires separate evidence. |

Vitest 4.1.7 is selected from the tagged Midnight.js development dependency rather
than choosing the latest major independently. Remaining UI/type/lint/postcss pins
are **exact candidate versions**, not registry-verified selections. A genuine npm
lockfile and installed peer checks are outstanding. Correct a failed candidate
with documented metadata; do not present these pins as a tested graph.

## Unresolved research to perform once on the target host
1. Exact installed Codex schema, agent discovery, account model efforts and MCP status.
2. Real npm package graph, native install requirements and browser bundling of the
   4.1.1 protocol/provider stack; compatible testkit entry points.
3. Compact compiler outputs, actual coin qualification APIs, receiver discovery and
   exact contract/network identity primitives; end-to-end witness availability.
4. Full explicit/implicit disclosure behavior of the candidate funded-note protocol.
5. Proof service digest, supported browser/CORS behavior and actual proof execution.
6. Asset metadata, actual Preprod deployment and owner-supplied eligibility/evidence.

Record a conclusion with exact API/version and observed evidence when resolved.
Do not repeat completed research unless a version, source or relevant assumption changes.
