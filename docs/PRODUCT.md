# MoneyMole product specification

MoneyMole sends native NIGHT on Midnight Preprod through sender-funded bearer links
and locally generated QR codes. Wallet A deposits NIGHT; independent Wallet B
claims exactly that NIGHT. DUST pays transaction fees only. There is no application
mint, custom token, wrapping, conversion, fiat backing or mainnet payment.

Use Next.js App Router for frontend and backend, TypeScript and Tailwind CSS.
Backend HTTP APIs use src/app/api/**/route.ts; server-only modules live under
src/lib/server/ and import "server-only". Server Actions are appropriate only for
non-secret validated/authorized mutations. No Express/NestJS/Fastify or separate
application backend without a verified requirement and ADR. The local proof server
is a protocol tool. 1AM authorization, secrets, witnesses and encrypted private
state stay client-side; they never enter Next APIs, actions, props or logs.

## Asset and disclosure

NIGHT is unshielded: amounts, addresses and transfer relationships are public.
Only bearer authority, payment nonce and encrypted recovery remain private.
One NIGHT is 1,000,000 STAR. Accept positive decimal strings with up to six digits
after the decimal point; convert with integer arithmetic to Uint128 STAR.
Never reinterpret earlier zero-decimal issuer tokens as NIGHT.

## Required behavior

Connect 1AM on Preprod, select a verified NIGHT escrow, unlock local recovery,
save a draft, prepare a proof, approve funding, observe canonical finality, and
only then share the claim link/QR. The receiver verifies funding, saves the claim,
prepares a proof, approves, reconciles finality and checks the NIGHT balance delta.
A separately approved controlled spend to another wallet establishes spendability.
Record each wallet's initial NIGHT balance; B may already hold NIGHT for DUST
capacity. Keep unrelated transfers out of the controlled verification interval.

A claim must consume existing escrowed value without minting. Contract membership,
deployment/asset/amount/secret bindings and one-time nullifiers prevent forged or
repeated claims. The proof binds its public destination; possession of the bearer
secret itself allows choosing a recipient. The sender can also claim their link.
No recipient identity restriction, expiry or refund is implemented. Lost recovery
and lost bearer authority can make funds permanently inaccessible.

Persist intent before proving/signing and identifiers before submission. Unknown
or partial outcomes permit reconciliation only. Confirmed wholly failed claims
and spends can be reset after fresh chain checks; retain failed attempt history.
Imported/reloaded records are unverified until reconciled. Account/network changes
lock the session. Private state locks on hidden tabs and after five minutes.

## Migration and acceptance

Protocol v2 uses native NIGHT, mm3 fragments for 33-byte Preprod transaction IDs,
and schema-v2 encrypted namespaces. Existing mm2 fragments remain readable.
Old mm1 tokens, issuer assets and old escrow verifier keys fail closed. Preserve
legacy contracts, original deployment records and encrypted browser stores for
historical recovery; never deploy the old issuer as part of NIGHT setup.

Native engineering checks and real wallet acceptance are distinct. A real NIGHT
escrow deployment and fund/claim calls are finalized on Preprod; independent-wallet
credit/spend, optical QR, recovery and live privacy inspection remain pending until
observed. Organizer requirements are
preserved separately; a public NIGHT transfer does not satisfy hidden-amount claims.
