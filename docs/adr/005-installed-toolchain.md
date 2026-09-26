# Resolve the installed tooling graph without bypassing peer checks

Date: 2026-09-26. Status: accepted for local development.

npm 10.9.2 failed during Vitest peer resolution with an `edgesOut` null dereference.
The resolver was exploring Vite devtools and Vitest 5.0.2 despite the direct
Vitest 4.1.7 pin. Pin Vite 7.3.1 (within Vitest 4.1.7's declared range) and constrain
transitive Vite/Vitest with overrides referencing the direct pins. A direct Vite
pin alone did not solve the resolver failure; both overrides did. No legacy peer
mode or force flag is used. Registry resolution and genuine npm ci then passed.

Next 16.3.6, React 19.3.0, Tailwind 4.3.3 and Midnight.js 4.1.1 remain unchanged.
Add connector 4.0.1 for the inspected Lace API, Next's client/server boundary markers,
and fake-indexeddb 6.2.4 exclusively for deterministic storage tests.

The distro Node 22.22.1 lacks TypeScript stripping (`ERR_NO_TYPESCRIPT`). Local checks
use official Node 22.16.0/npm 10.9.2, downloaded to ignored `.local/node/` and verified
against Node's published SHA-256 list. Global Node selection remains unchanged.
Exact Compact devtools 0.5.1 was downloaded from its release archive, verified using
the GitHub release digest and extracted under `.local/compact-devtools/`. It reads
the existing installed compiler 0.31.1; no global compiler default was changed.

The proof image is pinned by its observed registry digest. Compose uses its original
entrypoint and PORT=6300 command, with only a loopback port binding. Windows Docker
Compose is available; Ubuntu's Docker CLI lacks the Compose plugin. Keep that host
distinction explicit. Service startup does not establish real proof readiness.
