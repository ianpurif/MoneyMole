# M3 — Integrate 1AM and the actual link/QR flow

## Current native NIGHT milestone (2026-09-27)

1AM native balances/transfers, six-decimal amount UI, mm2 links and local QR implemented; real extension/optical QA pending.

Execute BUILD.md, ADR 007, STATUS.md and OWNER-TESTING.md. Use native Preprod
NIGHT (six decimals) and DUST only for fees; no custom asset issuance. Preserve
legacy records. Commit logical engineering changes and keep wallet approvals
manual. Local checks never establish live finality or independent wallet control.

## Historical pre-NIGHT plan (superseded asset details)

State: implementation complete; seven production-browser security and synthetic-wallet tests passed, plus real browser prover/API connectivity. Actual 1AM signing and independent-wallet payment acceptance remain owner-pending.

The work below specifies required behavior and acceptance. The current BUILD.md directive authorizes autonomous local setup and verification; complete all automatable work before requiring manual wallet actions.

**Lead:** engineer; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
docs/PRODUCT.md, docs/PRIVACY.md, docs/ARCHITECTURE.md, .agents/skills/midnight-wallet/SKILL.md, installed connector types

## Stack constraints
Use Next.js App Router, TypeScript and Tailwind CSS for the single frontend/backend
application. HTTP APIs: `src/app/api/**/route.ts`; server-only modules:
`src/lib/server/` with `import "server-only"`. Server Actions are limited to
appropriate non-secret UI mutations. No Express, NestJS, Fastify or separate
backend without a verified requirement and ADR. 1AM authorization, claim secrets,
private witnesses and private-state handling stay client-side and never enter
Next.js APIs or Server Actions. Follow `docs/ARCHITECTURE.md` for the trust boundary.

## Prerequisites
M2 private-state and candidate contract/coin interfaces are implemented; actual 1AM is required for owner acceptance. Do not substitute another wallet without explicit scope approval.

## Owned files and interfaces
src/app/, src/components/, src/lib/midnight/, src/lib/private-state/, tests/browser/, tests/integration/, next.config.ts, src/proxy.ts if needed, docs/USAGE.md

Assign explicit non-overlapping subsets before delegation; no worker may edit all paths merely because this task lists them.

## Concrete work
1. Implement documented wallet discovery and explicit user-gesture connect to Preprod, permission rejection, disconnect and account/network change behavior. Read exact installed API types before implementing balance/submit methods. Use local wallet identification assets, not remote icons.
2. Implement wallet readiness separating shielded asset, unshielded NIGHT and DUST. Display integer atomic balances with verified decimals. The app cannot fabricate a token balance or infer spendability from a public counter.
3. Implement the real sender funding flow with durable encrypted intent before authorization. Enable sharing only after verified funding. Keep outcome_unknown distinct and reconcile before retry.
4. Implement client-only fragment capture, strict decode, safe address-bar scrub after protected capture and local QR generation. Measure payload length and QR readability; optimize codec before proposing encrypted blob storage. No secret in path/query, server props, logs, browser test traces or remote calls.
5. Implement receiver readiness, claim authorization, finality, wallet discovery and verified receipt states. Preserve receipt history across reload without conflating local imports with chain observation.
6. Add nonce-based production CSP, referrer protections, no third-party resources and explicit prover connections. Verify browser CORS/secure-context behavior without insecure flags. Finish responsive, accessible UI; keep all action statuses truthful.
7. Run separate browser contexts with actual extension authorization. A mocked extension may test UI errors but never satisfy real 1AM acceptance. Document exact owner action when the browser runner cannot control the extension.

## Commands — repository root
Entry points are implemented. Run all local commands under the current owner authorization. Missing real wallet inputs remain blocked; complete independent checks.

```sh
npm run dev
npm run test:integration
npm run test:browser
npm run test:preprod -- --manifest reports/preprod-manifest.json
npm run lint
npm run typecheck
npm run build
```

## Acceptance
Expected: actual 1AM connect/disconnect and circuit execution; funded link displayed only after finality; B claims with A unavailable; scrubbed fragment and no secret-bearing requests; reloaded encrypted records remain recoverable.

## Failure and resume
On authorization rejection, preserve intent. On wallet/prover API mismatch, inspect installed types and wallet configuration. Do not disable security or send witnesses elsewhere. On browser-runner limitations, record owner action and leave the live acceptance blocked.

## Evidence and requirement updates
docs/evidence/M3-wallet-ui.json and sanitized browser/network assertions; never raw secret-bearing traffic

Relevant IDs: CORE-LINK, CORE-FEES, L2-WALLET, L2-CIRCUIT, L2-PRIVACY, L3-APP. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.
