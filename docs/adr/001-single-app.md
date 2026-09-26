# Single application and local trust boundary

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


Date: 2026-09-26. Status: Accepted for preparation.

Use one Next.js App Router application and browser-side wallet/private-state adapters. Start without a database, custodial signer or separate backend service. This minimizes components with access to secrets. A separate backend service requires evidence of necessity and a privacy review; it cannot receive plaintext openings.

Revisit only with new observed evidence; record the affected interfaces, tests and requirement states.
