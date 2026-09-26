# Product specification

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


## Scope and direction
Working label: **Private Payments**. Category: payment application on Midnight.
People sending money, freelancers receiving client payments and small businesses
are the intended users. The single MVP direction is sender-funded value transfer.
A client funds a link and gives it to the freelancer. A freelancer-originated
request for a client to pay is a distinct, deferred feature.

Expected flow: connect wallet -> select one supported shielded asset and amount ->
authorize funding -> verify funding -> share bearer link/local QR -> independent
receiver connects and claims -> verify actual credit and spendability. There is
no implemented payment behavior in the preparation shell.

## Product invariants
A shareable payment represents funded, finalized value, never a promise to mint.
A claim transfers exactly the funded asset/amount, atomically prevents reuse and
cannot be redirected by someone who has only a copied proof. Anyone with the
secret itself can compete to claim. Claims must remain possible after the sender
closes the browser. Neither application hosting nor a central signing service
may be required to control the escrowed asset.

Use one verified shielded asset; the initial default is a separately issued,
explicitly non-redeemable Preprod test asset. Fee readiness is separate from
payment balance. No fiat backing, exchange rate or stable value is implied.

## Explicit exclusions and consequences
No fiat conversion, bridges, swaps, multiple chains, recurring payments, marketplace,
subscriptions, AI feature, central user account or request-to-pay in the MVP.
Expiry, refund and recipient restrictions are deferred unless a documented security
flaw requires a narrow change. There is no automatic recovery. A lost claim secret
can make value permanently inaccessible; an encrypted sender export can preserve
access but must not imply exclusive receiver ownership.

## Expected application states
Funding: editable draft -> encrypted recoverable draft -> wallet authorization ->
submitted/unknown -> included -> finalized -> sharing enabled. A submitted transaction
is not funded evidence. A synchronized wallet is not proof of another wallet's credit.
Claiming: strict local payload decode -> validate deployment/network -> local unlock
and wallet readiness -> claim proof and authorization -> finality -> wallet discovery
-> receiver spendability check -> chain-verified receipt. Imported records stay
marked local/unverified until reconciled.

Unknown outcomes expose a reconciliation action instead of another submit. Wallet
rejection preserves the draft. Insufficient asset or fees cannot show success.
Reload/reconnect uses the same encrypted namespace; switching wallets cannot silently
show another wallet's private records. Amount entry uses metadata precision and
integer atomic units; do not infer decimals from a token symbol.

## Definition of usefulness
The engineering result is a receiver-redeemable funded capability, not merely a
private note. Privacy is limited by the proven circuit behavior, client delivery,
proof provider trust and network metadata. Claims remain conditional until M1/M5
observations establish them. Requirement and external qualification states live in
`requirements.json`; product eligibility approval remains owner-pending.
