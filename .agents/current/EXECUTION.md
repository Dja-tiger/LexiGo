# Current Task Execution

## Task

- Issue: #651
- Branch: `feat/issue-651-process-aware-home`
- Base SHA: `6d8c8dbc3b25f5fd428c18cb18b151402984ec72`
- Head SHA: resolve from live branch ref after this reconciliation commit
- PR: #664
- Delivery state: Draft until final exact-head CI, review audit and Ready/merge gates pass

## Skills used

### Repository Agent Harness

Purpose:

Keep Stage 3 execution inside the repository-owned task boundary and preserve immutable evidence for runtime, test, visual, merge and Stage gates.

Instruction source:

- `AGENTS.md`
- `.agents/**`
- `docs/agent-harness.md`
- `.agents/current/TASK.md`

Version or verification date:

2026-08-23.

Inputs:

- live `main`, PR #664, Issue #651 and workflow state;
- exact allowed/prohibited paths from `.agents/current/TASK.md`;
- immutable CI failures and Playwright artifacts.

Files inspected:

- backend selector/preview/create owners;
- Home runtime/CSS and process-aware browser tests;
- downstream account/navigation/PWA/accessibility fixtures;
- consolidated 320/768/1440 route parity, true-200%-zoom, system-state and critical visual suites.

Actions performed:

- verified `main` before and after writes;
- read back every changed file after GitHub writes;
- extended Task scope only for downstream test owners first discovered by immutable CI;
- kept production connectivity/session/PWA/history owners out of the downstream test synchronization;
- kept parent Issue #651 open.

Result:

Stage 3 implementation is bounded to the declared process-aware Home/preview contract plus test-only downstream synchronization and reviewed Home-only visual evidence.

Failures:

Early immutable runs exposed stale downstream preview mocks, account hydration request-count assumptions, an ambiguous global connectivity locator and expected Home visual drift.

Root cause:

The Stage 3 runtime made `sessionKind` explicit and added visible Home process controls. Existing tests encoded the prior implicit preview response, single-action Home presentation or global copy uniqueness.

Fallback:

No broad fixture reset, production compatibility bypass or blind visual update was used. Each failing owner was traced to its original responsibility and repaired there.

Limitations:

This PR intentionally does not implement remaining #651 slices such as manual 15/30/50 sizing, scheduler replacement, FSRS or long-term scoring.

Reusable lesson:

When a route gains explicit process intent, downstream mocks must echo that intent rather than infer legacy behavior. Visual evidence should distinguish true product-state changes from renderer-equivalent raster changes.

### Immutable CI failure isolation

Purpose:

Separate runtime regressions from stale downstream contracts using exact-head GitHub Actions evidence.

Instruction source:

Repository CI workflows and Agent Harness delivery gates.

Version or verification date:

2026-08-23.

Inputs:

- CI #4032 / run `32635302334`, source head `77ca1ea56e23b058eeb2786524617797aaa18d47`;
- CI #4035 on `bf0e82f653ed56df08c372664d6b5469ce7466bd`;
- later exact-head runs triggered by each bounded correction.

Files inspected:

- Playwright UI shard reports;
- Linux visual report/artifacts;
- failing test owners and their production landmarks.

Actions performed:

- synchronized explicit Home preview fixtures across session-resume, navigation, route, a11y, ownership, result and account suites;
- changed `account-hydration.spec.ts` to assert resource ownership instead of a redundant `/progress` request count;
- scoped `connectivity-touch-targets.spec.ts` to the existing complementary connectivity landmark.

Result:

By CI #4035 the remaining non-visual failures were reduced to the two stale test assumptions above; both have since been corrected without runtime behavior changes.

Failures:

No final CI conclusion is recorded here yet; the final docs-reconciled head must still pass the complete immutable matrix.

Root cause:

Downstream tests assumed pre-Stage-3 route hydration/copy behavior.

Fallback:

None required beyond owner-correct test synchronization.

Limitations:

Final merge readiness depends on the newest exact-head run, not earlier green subsets.

Reusable lesson:

Treat request counts as ownership evidence, not arbitrary constants; scope UI locators to semantic landmarks when product copy can legitimately repeat.

### Playwright visual evidence review

Purpose:

Approve only visual changes that are necessary for Issue #651 and distinguish them from accidental renderer drift.

Instruction source:

`.agents/current/TASK.md` visual invariants and existing content-addressed visual contracts.

Version or verification date:

2026-08-23.

Inputs:

Exact Linux artifact #9492248013 / CI #4032 at source head `77ca1ea56e23b058eeb2786524617797aaa18d47`.

Files inspected:

- Home at 320×700 Light/Dark;
- Home compact 390;
- Home 768×1024 Light/Dark;
- Home 1440×1024 Light/Dark;
- Home true 200% browser zoom Light/Dark;
- desktop offline dark system state.

Actions performed:

- manually reviewed the process controls for clipping, overlap, contrast and expected reflow;
- promoted only Home fingerprints in `home-tablet-progress-visual.spec.ts`, `route-tablet-parity.spec.ts` and `route-browser-zoom-parity.spec.ts`;
- converted the Home portion of `visual-regression.spec.ts` to strict content-addressed 390/768/1440 evidence instead of blindly replacing binary snapshots;
- retained the primary OpenPencil/system-state SHA and renderer-equivalent list, adding the #651 offline Home raster as an explicitly separate `reviewedProductStateSha256`.

Artifacts produced:

Repository-owned exact SHA/size/provenance entries referencing CI `32635302334` and head `77ca1ea56e23b058eeb2786524617797aaa18d47`.

Result:

The approved drift is limited to the Home surface required by visible Review / Remediation / Study controls. Consolidated route-parity PR patch changes exactly six Home Light/Dark entries across 320/768/1440 and leaves non-Home states untouched.

Failures:

Earlier visual runs failed because authoritative fingerprints encoded the previous single-action Home state.

Root cause:

Expected product UI change from Issue #651, not random renderer drift.

Fallback:

No global screenshot update and no tolerance-based pixel acceptance.

Limitations:

The final exact-head visual job must reproduce all approved fingerprints byte-for-byte.

Reusable lesson:

Product-state evidence and renderer-equivalent evidence should be modeled separately; this prevents intentional UX changes from being mislabeled as rendering noise.
