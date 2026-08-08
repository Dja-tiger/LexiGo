# Current Task Execution

## Task

- Branch: `fix/issue-74-active-lesson-live-targets-v3`
- Base SHA: `c73011f423a5d46afa433bbdff49b9223b0552c0`
- Head SHA: resolve from live branch ref after these records are committed
- PR: #435

## Skills used

### GitHub repository harness / connector-first production delivery

Purpose:

Continue Issue #74 from live GitHub state through the Active Lesson target slice with exact-base writes and full CI/merge/stage evidence, without carrying stale branch ancestry across repository-memory reconciliation.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialized instructions
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/*`
- `docs/agent-harness.md`
- GitHub plugin workflow guidance

Version or verification date:

2026-08-08 Europe/Moscow; security runtime/dependency SHA `a2cb82b2415e0695120ec666b86690cbcd91f12d` passed exact-SHA CI and Stage #2852, then docs-only reconciliation #434 passed CI #3020 and advanced exact product-delivery base to `c73011f423a5d46afa433bbdff49b9223b0552c0`.

Inputs:

- Live Issue #74 acceptance criteria and comments.
- Canonical Active Lesson presentation/CSS.
- Established Issue #74 paint-inert hit-slop pattern.
- Previously reviewed PR #433 content, replayed onto exact post-reconciliation base without its history.
- CI #3016 lesson-completion logs and retained Playwright report/trace for the deterministic iOS WebKit failure.
- Docs-only reconciliation #434 exact diff and CI evidence.

Files inspected:

- `frontend/components/active-lesson-presentation.tsx`
- `frontend/app/active-lesson.css`
- `frontend/app/layout.tsx`
- `frontend/package.json`
- existing Issue #74 touch-target CSS/E2E owners
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- CI #3016 `Frontend E2E (Lesson completion)` log
- CI #3016 `frontend-playwright-report-lesson` screenshot, error context and trace
- `.agents/PROJECT_STATE.md` before and after reconciliation #434

Actions performed:

- Delivered prerequisite security remediation #431 through merge, exact-SHA CI and Stage/public validation.
- Detected material repository-memory drift before product merge and delivered the required separate docs-only reconciliation #434; its exact one-file diff passed CI #3020 and merged as `c73011f423a5d46afa433bbdff49b9223b0552c0`.
- Recreated the product branch from that exact reconciled `main` instead of merging or rebasing stale PR #433 history.
- Replayed only the bounded production/test content: route-scoped paint-inert target expansion, root CSS import, explicit lesson test collection entry and fail-closed browser acceptance.
- Preserved dependency versions/lockfile and approved visual baselines.
- Investigated CI #3016 instead of rerunning it as infrastructure noise: 117 lesson tests passed, 6 skipped, and the new Study target case failed only on iOS WebKit, identically on retry.
- Used the retained trace to identify the exact failing control as `Не знал` and confirm `locator.scrollIntoViewIfNeeded()` had made only the 44px painted border box visible while the 48px pseudo hit surface still extended ~1.17 CSS px below the viewport.
- Adjusted only browser-harness preparation: after Playwright scrolls the element border box, the test scrolls any residual vertical overflow of the expanded target into the viewport, then runs the unchanged 48x48, viewport-bound and four-perimeter-hit assertions.
- Opened replacement Draft PR #435 on exact post-reconciliation base.

Commands or procedures:

GitHub connector exact-ref reads/writes, branch creation, Git blob/tree/commit construction for atomic replay, PR creation, CI/deployment inspection, workflow artifact download, and local read-only inspection of the retained Playwright ZIP/trace. Repository changes are made only on explicit branch refs.

Artifacts produced:

- `frontend/app/active-lesson-touch-targets.css`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- root CSS import
- authoritative lesson-gate collection entry
- current Agent Harness records
- inspected CI artifact `frontend-playwright-report-lesson` from run #3016
- docs-only reconciliation PR #434 / merge `c73011f423a5d46afa433bbdff49b9223b0552c0`
- replacement product PR #435

Result:

PR #435 is the exact-base replacement for #433 and contains the bounded Active Lesson product/test slice plus current task records. Its final developer-authored head requires a fresh full immutable-head CI run before Ready/merge.

Failures:

- The earlier stale product PR was initially blocked by a newly published dependency advisory; #431 remediated that prerequisite independently.
- CI #3016 on #433 failed the lesson-completion job only on iOS WebKit because Playwright's element visibility scroll does not include pseudo-element hit slop. The aggregate quality job failed only as a consequence.
- PR #433 cannot be used as final merge evidence after reconciliation #434 advanced `main`; its subsequent CI is diagnostic only.

Root cause:

Product root cause: Active Lesson controls had painted 44px minimums but no coarse-pointer 48px effective-target overlay.

CI root cause: the acceptance test initially relied on `scrollIntoViewIfNeeded()` to make the full effective target measurable, but that API only considers the DOM element border box, not the expanded `::before` pointer surface.

Fallback:

If fresh #435 browser acceptance still finds interception/containment problems, inspect the exact trace and adjust only bounded test setup or hit-slop selector/geometry based on evidence; do not weaken perimeter assertions, reduce the 48px coarse-pointer minimum, enlarge painted UI solely to satisfy tests, or update snapshots to hide a regression.

Limitations:

Automated browser and Stage validation cannot substitute for the final real physical-device acceptance required to close Issue #74.

Reusable lesson:

Standalone Playwright specs must be registered in the repository's explicit authoritative npm test lists; file presence alone does not guarantee CI execution. When acceptance measures a pseudo-element pointer surface larger than the painted border box, test scrolling must account for that expanded surface before `elementFromPoint` perimeter checks; otherwise a browser can legitimately consider the painted element visible while part of the effective target remains outside the viewport. Material Agent Harness drift must be reconciled independently before product delivery, and product work should be replayed onto the exact reconciled base rather than inheriting stale branch history.
