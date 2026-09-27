# Privacy and security boundary

Native NIGHT is unshielded. Transfer amounts, funding/payout addresses, contract
balances and on-chain timing are public. Do not claim anonymous, shielded or hidden
NIGHT transfers. Preprod NIGHT is testnet currency; DUST pays fees only.

The claim authority and nonce are private witnesses. The public note/nullifier
proves authorization and single use without revealing the bearer secret. A copied
proof is bound to its destination, but anyone holding the secret can prepare their
own claim. Secure link delivery is the user's responsibility; the sender also
knows the secret. There is no expiry or refund.

URL fragments are captured and scrubbed in the client. QR images are generated
locally. Neither fragments nor plaintext recovery enter Next.js endpoints, server
props, telemetry or logs. APIs expose only public artifacts/build metadata.
Encrypted IndexedDB uses authenticated, versioned wallet/contract namespaces;
passphrases and decryption keys are never persisted. Schema 2 isolates NIGHT from
legacy test assets. A recovery file is private even when encrypted: keep it outside
Git and tool output. Hidden tabs and five-minute timers lock private state.

Witnesses go directly from the browser to the trusted local prover at 127.0.0.1:6300.
That prover is inside the trust boundary and sees the inputs. Wallet extensions,
OS compromise, malicious browser extensions, clipboard interception, screenshots,
local backups and network metadata remain threats. CSP and encryption do not
protect an already compromised endpoint. Never paste seed phrases/private keys
into MoneyMole or supply them to an agent.

Read-only native verification checks exact public amounts/destinations and node
finality; it cannot establish independent people, wallet control or secret delivery.
Local mocks/proofs do not establish live acceptance. Old shielded-token evidence
is historical only. Real public-transcript inspection and two-wallet NIGHT tests
remain necessary before submission. See disclosure-audit.md and TESTING.md.
