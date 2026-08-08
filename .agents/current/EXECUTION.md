# Current Task Execution

## Task

- Branch: `fix/issue-74-active-lesson-live-targets-v2`
- Base SHA: `a2cb82b2415e0695120ec666b86690cbcd91f12d`
- Head SHA: resolve from live branch ref
- PR: #433

## Skills used

### GitHub repository harness / connector-first production delivery

Purpose:

Continue Issue #74 from live GitHub state after removing the production dependency-audit blocker, with exact-base writes and full CI/merge/stage evidence.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialized instructions
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/*`
- `docs/agent-harness.md`
- GitHub plugin workflow guidance

Version or verification date:

2026-08-08 Europe/Moscow; verified base `a2cb82b2415e0695120ec666b86690cbcd91f12d` after CI #3011 and Stage #2852 succeeded.

Inputs:

- Live Issue #74 acceptance criteria and comments.
- Canonical Active Lesson presentation/CSS.
- Established Issue #74 paint-inert hit-slop pattern.
- Previously reviewed but stale Active Lesson branch, replayed only after exact-base security delivery.
- CI #3016 lesson-completion logs and retained Playwright report/trace for the deterministic iOS WebKit failure.

Files inspected:

- `frontend/components/active-lesson-presentation.tsx`
- `frontend/app/active-lesson.css`
- `frontend/app/layout.tsx`
- `frontend/package.json`
- existing Issue #74 touch-target CSS/E2E owners
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- CI #3016 `Frontend E2E (Lesson completion)` log
- CI #3016 `frontend-playwright-report-lesson` screenshot, error context and trace

Actions performed:

- Delivered prerequisite security remediation #431 through merge, exact-SHA CI and Stage/public validation.
- Created a new exact-base product branch instead of rebasing/merging the stale product PR.
- Added route-scoped paint-inert target expansion.
- Added fail-closed browser acceptance with four-side perimeter hit tests and containment checks.
- Registered the spec in the authoritative lesson browser command.
- Preserved dependency versions/lockfile and approved visual baselines.
- Investigated CI #3016 instead of rerunning it as infrastructure noise: 117 lesson tests passed, 6 skipped, and the new Study target case failed only on iOS WebKit, identically on retry.
- Used the retained trace to identify the exact failing control as `Не знал` and confirm `locator.scrollIntoViewIfNeeded()` had made only the 44px painted border box visible while the 48px pseudo hit surface still extended ~1.17 CSS px below the viewport.
- Adjusted only the browser-harness preparation: after Playwright scrolls the element border box, the test scrolls any residual vertical overflow of the expanded target into the viewport, then re-runs the unchanged 48x48, viewport-bound and four-perimeter-hit assertions.

Commands or procedures:

GitHub connector exact-ref reads/writes, branch creation, CI/deployment inspection, workflow artifact download, and local read-only inspection of the retained Playwright ZIP/trace. Repository changes were made through explicit GitHub contents API refs.

Artifacts produced:

- `frontend/app/active-lesson-touch-targets.css`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- root CSS import
- authoritative lesson-gate collection entry
- current Agent Harness records
- inspected CI artifact `frontend-playwright-report-lesson` from run #3016

Result:

The deterministic first-CI failure has a bounded test-setup remediation that preserves all acceptance assertions. The final recorded branch head now requires a fresh full immutable-head CI run before Ready/merge.

Failures:

- The earlier stale PR was blocked by a newly published dependency advisory; that prerequisite is now remediated independently and fully delivered.
- CI #3016 failed the lesson-completion job only on iOS WebKit because Playwright's element visibility scroll does not include pseudo-element hit slop. The aggregate quality job failed only as a consequence.

Root cause:

Product root cause: Active Lesson controls had painted 44px minimums but no coarse-pointer 48px effective-target overlay.

CI root cause: the acceptance test initially relied on `scrollIntoViewIfNeeded()` to make the full effective target measurable, but that API only considers the DOM element border box, not the expanded `::before` pointer surface.

Fallback:

If fresh browser acceptance still finds interception/containment problems, inspect the exact trace and adjust only bounded test setup or hit-slop selector/geometry based on evidence; do not weaken perimeter assertions, reduce the 48px coarse-pointer minimum, or enlarge painted UI solely to satisfy tests.

Limitations:

Automated browser and Stage validation cannot substitute for the final real physical-device acceptance required to close Issue #74.

Reusable lesson:

Standalone Playwright specs must be registered in the repository's explicit authoritative npm test lists; file presence alone does not guarantee CI execution. When acceptance measures a pseudo-element pointer surface larger than the painted border box, test scrolling must account for that expanded surface before `elementFromPoint` perimeter checks; otherwise a browser can legitimately consider the painted element visible while part of the effective target remains outside the viewport.
