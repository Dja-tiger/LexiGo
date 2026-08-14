# Current Task Progress

## 2026-08-14 23:51 Europe/Moscow

### Completed diagnosis

Issue #518 has a reproducible lifecycle boundary. The alternate Dictionary Empty raw PNG `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` was not caused by focus, screenshot animation/caret handling, global Skia mode, raster-thread count, font readiness or adjacent screenshot timing.

The fixed route reminder performs deferred settings hydration after mount. Capturing before that state commit could repaint its fixed translucent/shadowed summary after geometry had already become stable. That explains why each lifecycle produced two internally identical PNGs, yet independent lifecycles switched between rejected `dd2d...` and approved `e140...`.

### Accepted candidate

Code SHA: `f3a3b551d718f7cadbdbf473afffb707da9bbfc6`.

`frontend/e2e/system-states-visual.spec.ts` now:

- seeds deterministic reminder settings before navigation;
- waits for the summary `aria-label` to prove deferred reminder hydration committed;
- then runs the existing font/scroll/double-rAF stabilization;
- retains pairwise exact SHA equality;
- retains canonical screenshot options;
- retains approved Figma SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.

No product UI/CSS, Chromium visual config, workflow, snapshot or approved hash changed.

### Verification

- CI #3513 attempt 1: full workflow success.
- Visual job `94891172103`: Dictionary `79:93` passed on its first attempt; `57 passed`, `84 skipped`, no retry/flaky.
- Mandatory same-code-SHA rerun used a different hosted runner.
- Visual job `94893140048`: Dictionary `79:93` again passed on its first attempt; `57 passed`, `84 skipped`, no retry/flaky.
- PR #520 has zero review threads and zero submitted reviews.

### Rejected candidates retained as evidence

- #3491 focus-only;
- #3496 disable Skia runtime opts;
- #3501 single raster thread;
- #3503 layout/paint barrier alone;
- #3504 screenshot animation mutation removal (failed mandatory rerun);
- #3512 `caret: "initial"`.

### Current status

Root cause and deterministic test-side synchronization are verified. Agent Harness and PR description are being reconciled, after which the PR can leave draft and proceed through final docs-only CI, merge, exact-main CI and Stage/public checks.

### Next Figma work after merge

Proceed to Issue #205 route-by-route visual parity audit using the canonical route → Figma node map already on `main`. `/onboarding` remains explicitly blocked by Issue #201 because its desktop/diagnostic/recovery/complete Light-Dark canonical node set is not yet approved; do not invent those frames in code.
