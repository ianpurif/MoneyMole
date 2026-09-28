# Frontend revision — historical checkpoint

This records the local-only state on 2026-09-27. Its no-push statement below was
true for that checkpoint, not for current `main`: later non-sensitive work was
committed and published. For the current UI and evidence, use
[STATUS](STATUS.md), [USAGE](USAGE.md) and the [README](../README.md).

Scope: REVISION.md, 2026-09-27. Local-only redesign; no push, deployment,
issuance or live wallet approval.

## Interaction decisions

- Home opens on the payment surface. Send, Receive and Activity change the
  current view; the page below explains the same fund/share/claim flow.
- Connection is explicit. The amount entered before connection carries into
  Send after unlock. A claim URL opens Receive and retains client-only capture.
- Workspace unlock is an inline prerequisite. Saved drafts move into Activity.
  Proof preparation, wallet authorization and reconciliation keep their original
  controller calls. Sharing still requires verified finalized funding.
- Transaction identifiers, recovery exports and controlled spend checks expand
  only when relevant. Issuer administration uses a native dialog sheet with
  focus containment, Escape dismissal and focus restoration.
- The supplied logo anchors ink, periwinkle and warm neutral surfaces. No external
  images or fonts. The story uses the owner's artwork without modifying it.
- Short CSS fades and sheet transitions respect reduced motion. CSS is sufficient
  for these interactions; the evaluated Motion dependency was removed.
- Sonner handles brief connection/clipboard feedback. Long-running payment
  feedback stays inline and persistent. Toast text never contains claim material.
  Sonner's exported CSS goes through Next; its duplicate runtime style injection
  is removed by a narrowly scoped loader. The Toaster mounts client-side to
  avoid SSR inline styles under the unchanged CSP. Optimized logo URLs come from
  Next getImageProps with its unnecessary inline color style omitted.

## Visual review and regressions

Local screenshots live under ignored reports/revision/. They show only empty
or synthetic sessions, never owner wallet state or bearer links. The first
render was reviewed at desktop, 390px and 320px widths; the follow-up corrects
small-height spacing, redundant receive controls, sheet focus restoration,
claim entry context and CSP-compatible feedback.

The production browser suite checks responsive actions at 320/390/768/1440px,
explicit authorization/cancellation/rejection, real encrypted synthetic draft
save/reopen, invalid amounts, restricted transaction/share controls, dialog focus,
toasts under CSP, existing issuer preparation/recovery, and claim-fragment privacy.
Synthetic browser checks do not establish real wallet settlement.

See docs/evidence/revision-verification.json for final observed outcomes and
bound source hashes. Existing live payment acceptance remains owner-pending.
Old remote CI observations cover their recorded revisions only; the new local
revision is intentionally not pushed.
