# Client-only encrypted recovery storage

Date: 2026-09-26. Status: implemented utilities; product integration and real funded recovery pending M1.

Use browser Web Crypto AES-256-GCM, random 96-bit IVs per write, 128-bit tags and
PBKDF2-HMAC-SHA256 at 600,000 iterations with a random 128-bit salt. This uses native
browser primitives without a remote KDF service. OWASP prefers memory-hard Argon2id;
its documented PBKDF2 work factor is the baseline here, not a claim of FIPS compliance.
Desktop timing is recorded in M2 evidence; mobile usability remains to be measured.
Passwords require 16–1024 UTF-8 bytes, which is an input bound, not an entropy guarantee.

The authenticated associated data binds protocol, network, contract, wallet, schema
and record key. Envelope parameters and lengths are strictly bounded. Keys are
non-extractable, retained only in memory, and cleared on explicit lock, tab hiding
or five minutes after unlock. JavaScript cannot guarantee erasure of strings or
garbage-collected memory. A compromised client can read unlocked data.

IndexedDB stores only envelopes and revision counters. A checked encrypted marker
rejects wrong passwords before writes. Creation is explicit; corruption is preserved.
Revision compare-and-swap inside a single durable transaction prevents concurrent
tabs silently replacing each other's records. Encrypt before starting the transaction.
Future schemas fail closed; version 1 is the initial schema and does not destructively
migrate older unknown records. Future migrations require an atomic, tested adapter.

Encrypted export carries salt/IV/ciphertext only. Import authenticates the same
namespace and record key with a separately supplied password, then writes only an
absent record. It cannot overwrite funded intent. Imported application records must
remain unverified until the SDK adapter reconciles them against the chain.

Neither module is reachable from a Next.js Route Handler or Server Action.
The `client-only` import makes accidental server inclusion a build error.
The store is not wired to payment actions until M1 protocol and recovery review pass.
