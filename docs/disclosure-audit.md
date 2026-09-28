# Native NIGHT disclosure review — 2026-09-27

contracts/night-payments.compact uses nativeToken(), receiveUnshielded and
sendUnshielded. The public effects explicitly disclose native amounts. Funding
inputs and claim outputs expose unshielded addresses; timing and relationships
can be correlated. NIGHT is not a shielded asset. This changes the prior product
privacy premise under the owner's explicit directive (ADR 007).

Public ledger: supportedAsset, append-only note tree and spent nullifiers.
Private witness: amount before its required disclosure, nonce, bearer authority
and membership path. The commitment binds domain, network domain, deployment,
asset, amount, nonce and authority. The public claim argument is UserAddress;
changing it changes the proof transcript. A claimant must possess the bearer
secret; no wallet identity restriction is implied. There is no mint call.

Generated contract tests check exact native input/output effects, no mints,
destination transcript binding, replay, changed secret/amount/nonce/deployment,
zero, insufficient balance, stale paths and refreshed membership. SDK transaction
tests construct/prove/deserialize fund and claim using the actual local prover
and inspect native effects plus claim output. These use synthetic public state,
not wallet-funded ledger inputs. They do not prove live consensus acceptance.

The tree's current root changes on funding; reprepare stale claims. Capacity is
65,536 deposits, with old addresses retained for claims. The Preprod string is
domain separation, not network authentication: wallet and transaction network
checks remain required. Public state is authenticated against native serialization,
indexer identity and canonical finalized node blocks.

The NIGHT escrow deployment is finalized and read-only checks observed two `fund`
calls and one `claim` call on Preprod. Their public effects do not establish the
frontend or wallet identities. Remaining live review: owner-observed two-wallet
fund/claim/spend, real output amounts/addresses, failed replay/concurrent claim behavior,
recovery after reload/import, fragment/QR leakage and installed-wallet behavior.
No hidden-amount or unlinkability claim may be inferred from those results.

Historical shielded contract/probe reviews remain available in Git at 16aa745.
Their contracts/artifacts and original issuer record are preserved. They are not
current NIGHT evidence and must never be counted as new NIGHT deployment/payment.
