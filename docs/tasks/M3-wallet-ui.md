# M3 — Integrate Lace and the actual link/QR flow

State: not_started. Expected behavior below is not observed evidence.

**Lead:** engineer; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
docs/PRODUCT.md, docs/PRIVACY.md, docs/ARCHITECTURE.md, .agents/skills/midnight-wallet/SKILL.md, installed connector types

## Prerequisites
M1 verified contract/coin semantics and M2 private-state interfaces; actual Lace available for extension acceptance. Do not substitute another wallet without explicit scope approval.

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
7. Run separate browser contexts with actual extension authorization. A mocked extension may test UI errors but never satisfy real Lace acceptance. Document exact owner action when the browser runner cannot control the extension.

## Commands — repository root
Run only after implementing their missing entry points. Do not treat the current blocked gate as an executable product implementation.

```sh
npm run dev
npm run test:integration
npm run test:browser
npm run test:preprod -- --case lace-two-contexts
npm run lint
npm run typecheck
npm run build
```

## Acceptance
Expected: actual Lace connect/disconnect and circuit execution; funded link displayed only after finality; B claims with A unavailable; scrubbed fragment and no secret-bearing requests; reloaded encrypted records remain recoverable.

## Failure and resume
On authorization rejection, preserve intent. On wallet/prover API mismatch, inspect installed types and wallet configuration. Do not disable security or send witnesses elsewhere. On browser-runner limitations, record owner action and leave the live acceptance blocked.

## Evidence and requirement updates
docs/evidence/M3-wallet-ui.json and sanitized browser/network assertions; never raw secret-bearing traffic

Relevant IDs: CORE-LINK, CORE-FEES, L2-WALLET, L2-CIRCUIT, L2-PRIVACY, L3-APP. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.
