# M1 — Prove real funded independent claiming

State: candidate payment and separate issuer compile; 13 generated-runtime cases and three local circuit proof generations pass on synthetic fixtures. The owner will prepare two wallets and chose a separately issued non-redeemable Preprod test asset. Live wallet readiness, concrete deployment approval, qualification, sealed transactions and spendability remain pending. See disclosure-audit.md.

Remaining expected behavior below is not observed evidence.

**Lead:** architect; architect controls shared interfaces and state; verifier owns assigned acceptance evidence.

## Load context
docs/ARCHITECTURE.md, docs/PRIVACY.md, docs/PRODUCT.md, docs/SOURCES.md (S7–S15), .agents/skills/midnight-contracts/SKILL.md

## Stack constraints
Use Next.js App Router, TypeScript and Tailwind CSS for the single frontend/backend
application. HTTP APIs: `src/app/api/**/route.ts`; server-only modules:
`src/lib/server/` with `import "server-only"`. Server Actions are limited to
appropriate non-secret UI mutations. No Express, NestJS, Fastify or separate
backend without a verified requirement and ADR. 1AM authorization, claim secrets,
private witnesses and private-state handling stay client-side and never enter
Next.js APIs or Server Actions. Follow `docs/ARCHITECTURE.md` for the trust boundary.

## Prerequisites
Installed compatible compiler/SDK and local prover; owner-authorized independent wallets with a supported shielded asset and sufficient DUST. Create minimal issuance separately if no suitable asset exists. Never mint during claim.

## Owned files and interfaces
contracts/private-payments.compact, contracts/issuance/, src/lib/midnight/feasibility/, tests/contracts/, tests/proving/, tests/preprod/, scripts/product/{test-contracts,test-proving,test-preprod,verify-artifacts,deploy-preprod,verify-deployment}.mjs, docs/disclosure-audit.md, deployments/

Assign explicit non-overlapping subsets before delegation; no worker may edit all paths merely because this task lists them.

## Concrete work
1. Reproduce a documented shielded receipt and qualified spend with the installed types. Inspect fresh/qualified coin representations, actual Merkle lookup APIs and recipient discovery behavior. This probe must move existing value, not simply mint to the same wallet.
2. Implement the smallest one-asset, one-note funding/claim contract. Bind asset, amount, nonce, contract/network domain and bearer authority. Verify actual receipt, coin consumption and output; audit all public effects. Choose the commitment/nullifier/accumulator construction only after compiler-backed validation. Freeze exact encoding with browser/runtime vectors.
3. Keep the receiver the caller where required. Verify that destination is inseparable from the claim proof/output. A prover-claimed wallet public key alone must not serve as authentication. Make nullifier check/write and value transfer atomic.
4. Define receiver witness acquisition without the sender browser. Include only necessary private coin information in the protected payload; qualify against verified chain data. Public lookups may reveal timing/interest but must not transmit openings. Test stale paths and invalid qualification.
5. Implement bounded product action entry points that run actual suites and return reviewed evidence. Ask the owner only for required wallet/funding actions. A provisional authorized Preprod deployment is allowed here; record it durably for reuse, not automatic replacement in M4.
6. Fund with wallet A, disconnect A, claim with independent B, verify exact asset/amount credit and a controlled B-originated spend. Run wrong-secret, double-claim, competing-claim and copied-proof/destination tests. Inspect actual public transcripts and chain data. A successful proof alone fails this gate.

## Commands — repository root
Run only after implementing their missing entry points. Do not treat the current blocked gate as an executable product implementation.

```sh
npm run compile:contracts
npm run compile:issuance
npm run verify:artifacts
npm run test:contracts
npm run services:up
npm run test:proving
npm run deploy:preprod -- --authorize-network-change
npm run verify:deployment
npm run test:preprod -- --case independent-funded-claim
```

## Acceptance
Expected: A loses the funded asset amount, escrow receives/consumes that value, B receives a spendable coin, no claim mints, replay fails and public inspection supports the bounded privacy claim. Preserve separate fee accounting. No expectations may be marked verified without observations.

## Failure and resume
If cross-wallet qualification/discovery or privacy fails, save a minimal sanitized reproduction and mark CORE gates blocked. Do not replace with public transfers or simulations. Continue isolated persistence/domain work without freezing an invalid protocol. Never re-fund a transaction with unknown outcome.

## Evidence and requirement updates
docs/evidence/M1-feasibility.json, docs/disclosure-audit.md, reviewed deployments/preprod/*.json; private wallet material only in .local/

Relevant IDs: CORE-CONSERVATION, CORE-CLAIM, CORE-PRIVACY, CORE-AUTH, CORE-REPLAY, L1-CONTRACT, L1-MANAGED. Update actual outcomes in `docs/STATUS.md`, then update the authoritative JSON and regenerate the report. Evidence must include code/toolchain subjects and scope.
