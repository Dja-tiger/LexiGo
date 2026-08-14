# Current Task Execution

## Task

- Issue #518 / PR #520
- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Verified code SHA: `f3a3b551d718f7cadbdbf473afffb707da9bbfc6`

## Final implementation

The visual test now observes completion of `CalendarReminderRouteEntry` deferred hydration before content-addressed capture. A deterministic localStorage sentinel changes the summary's semantic `aria-label` after the component's existing `setTimeout(..., 0)` hydration. The test waits for that exact semantic change, then applies the existing layout/paint stabilization and raw-PNG SHA checks.

This is a synchronization fix, not a rendering workaround:

- production component/CSS unchanged;
- `frontend/playwright.visual.config.ts` unchanged from `main`;
- canonical screenshot options restored;
- approved Figma hashes unchanged;
- retries/tolerances/timeouts not weakened.

## Evidence

### Failed hypotheses

1. Focus normalization — CI #3491.
2. Global Skia runtime switch — CI #3496; collateral approved Phrases changes.
3. One raster thread — CI #3501; collateral approved Lessons change.
4. Double-rAF/layout proof alone — CI #3503; first lifecycle `dd2d...`, retry `e140...`, `1 flaky`.
5. Remove screenshot animation mutation — CI #3504; first run clean, mandatory same-head rerun flaky.
6. Preserve initial caret — CI #3512; first lifecycle `dd2d...`, retry `e140...`, `1 flaky`.

### Passing proof

- CI #3513 attempt 1 / Visual job `94891172103`: `57 passed`, `84 skipped`, zero flaky; Dictionary Empty passed once with no retry.
- CI #3513 attempt 2 / Visual job `94893140048`: independent hosted runner, same code SHA, `57 passed`, `84 skipped`, zero flaky; Dictionary Empty again passed once with no retry.
- Full CI #3513 attempt 1 passed.

## Root cause

The cross-lifecycle raster split was a capture race with the reminder's deferred state hydration. The reminder's fixed translucent/shadowed summary could receive a post-mount state commit/repaint after geometry was already stable. Waiting on a semantic signal from that exact state commit moves capture after the lifecycle boundary that previously selected `dd2d...` versus `e140...`.

## Design contract

- Figma node: `79:93`.
- Approved SHA: `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Rejected alternate: `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`.
- Live Figma MCP remains call-limit constrained, so no new canvas mutation/approval is claimed.

## Remaining release actions

Update PR metadata, run docs-only reconciliation checks, mark ready, merge with expected head SHA, then verify exact-main CI and Stage/public deployment before starting Issue #205.
