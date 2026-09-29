# Level audit sources and owner-supplied checklist — 2026-09-29

The detailed Level 1–6 checklist below was supplied by the owner in the pasted
team prompt. It is reproduced for traceability, not treated as a command to
scaffold sample apps, install a separate MCP, redeploy, submit transactions or
fabricate checklist artifacts. [Rise In's public program page](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)
confirms the six stages but does not publish all the granular checklist fields
below. In particular, the owner-supplied Level 6 text says **70 total Preprod
users**, whereas the public page says **Mainnet launch and 20 real users**. The
owner-supplied text itself also has a 20-commit requirement and a stricter
30-commit submission checklist. The [current audit](LEVEL-AUDIT.md) shows both
interpretations and uses 30 for the commit threshold without claiming an
organizer decision on the network/user conflict.

The owner has now supplied a hosted link, X profile, video page, three local
screenshots and a local 70-response CSV. Reachable URLs, images and submitted
wallet strings are recorded at their actual scope in the [audit](LEVEL-AUDIT.md);
none by itself proves a working hosted payment, a complete demo, 50/70 users or
consent to publish personal data. 1AM is the primary wallet, and the owner reports
judge acceptance in place of Lace. Actual extension acceptance still needs
observation. Published history
and real Preprod contract activity are checked separately from synthetic tests.
Non-sensitive commits and pushes are owner-authorized; wallet approvals, issuance
and new live transactions remain owner actions.

## Owner-provided requirements

LEVEL REQUIREMENTS: [LEVEL1
Requirements to Pass
Toolchain installed and a contract that compiles via compact compile,
Passing test suite,
Generated managed/ directory present (circuits + keys),
Contract deployed to Preview or Preprod with a visible contract address,
An initial product idea (1 short paragraph) drafted in the README,
Minimum 5 meaningful commits.

Submission Checklist
Public GitHub repository with a README.md,
Setup instructions (how to run locally),
Screenshot: successful compile output (circuits listed),
Screenshot: contract deployed with address shown,
README section explaining public state vs private witness,
Initial product idea paragraph,
Minimum 5 meaningful commits.

---

LEVEL2
Requirements to Pass
Lace wallet connect / disconnect implemented,
Circuit called successfully from the frontend,
An observable privacy behavior (something proven without being shown),
Contract deployed to Preprod with a verifiable address,
Minimum 8 meaningful commits.

Submission Checklist
Public GitHub repository with README,
Live demo link (Vercel, Netlify, or similar),
Deployed Preprod contract address (verifiable on-chain),
Demo video: wallet connect + a successful circuit call,
README documenting the privacy claim,
Minimum 8 meaningful commits.

---

LEVEL3
Requirements to Pass
Fully functional dApp that meaningfully uses Midnight’s privacy model,
Minimum 3 tests passing,
CI/CD pipeline running (workflow file + passing runs),
Approved idea submitted from the provided idea list,
Minimum 10 meaningful commits.

Submission Checklist
Public GitHub repository with complete README,
Live demo link,
Screenshot: test output (3+ tests passing),
CI/CD badge or workflow file with passing runs,
Demo video (1 minute) showing full functionality,
README “privacy model” section: what an observer can and cannot learn,
Product proposal (from the idea list) submitted for approval,
Minimum 10 meaningful commits.

---

LEVEL4
Requirements to Pass 
Working MVP live on Preprod (verifiable address), 
Documentation (README + setup + usage), 
CI/CD pipeline running on the product repo, 
Product X profile created, linked in the README, 
Minimum 15 meaningful commits.
﻿
Submission Checklist 
Public GitHub repository with full documentation, 
Live Preprod demo link + contract address, 
CI/CD badge or workflow file with passing runs, 
Link to the product X profile, 
Demo video of the MVP, 
Minimum 15 meaningful commits.

---

LEVEL5
Requirements to Pass 
Same MVP from Level 4, extended, 
50 Preprod users (verifiable wallet addresses), 
Feedback loop documented, 
Updated documentation, 
Minimum 20 meaningful commits.

Submission Checklist 
Public GitHub repository with updated documentation, 
Live demo link, 
List of 50 Preprod user wallet addresses (verifiable on-chain), 
Feedback documentation or link to feedback document, 
Demo video showing full MVP functionality, 
Minimum 20 meaningful commits.

---

LEVEL6
Requirements to Pass 
Same MVP from Level 4, extended, 
70 Preprod users (verifiable wallet addresses), 
Feedback loop documented, 
Updated documentation, 
Minimum 20 meaningful commits.

Submission Checklist 
Public GitHub repository with updated documentation, 
Live demo link, 
List of 70 Preprod user wallet addresses (verifiable on-chain), 
Feedback documentation or link to feedback document, 
Demo video showing full MVP functionality, Minimum 30 meaningful commits.]
﻿


## Reading this checklist

The current NIGHT escrow is deployed and has successful fund/claim calls; see
[the deployment record](../deployments/preprod/night-payment-escrow.json). The
historical issuer is a different contract. The present [README evidence map](../README.md#level-1-evidence)
and [audit](LEVEL-AUDIT.md) map these criteria without promoting contract activity
to a proven two-wallet frontend journey. New deployment, issuance and transfers
still require explicit wallet approval. Never publish a live bearer link, seed,
private key, witness or encrypted recovery material as submission evidence.
