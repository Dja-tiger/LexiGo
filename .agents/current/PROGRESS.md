# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Security prerequisite #431 is fully delivered: merge `a2cb82b2415e0695120ec666b86690cbcd91f12d`, exact-SHA CI #3011 success, Stage #2852 success including public endpoints and browser UI.
- New product branch is based exactly on that verified `main` SHA.
- Canonical Active Lesson still had 44px-only controls with no pointer-dependent 48px effective-target owner.
- The standalone acceptance is explicitly registered in `test:e2e:lesson` so authoritative CI executes it.
- PR #433 full CI #3016 executed 124 lesson tests: 117 passed, 6 skipped, and only the new iOS WebKit Study target case failed; all other CI jobs were green apart from the aggregate job depending on that failure.
- The CI failure was deterministic on retry and isolated to the first confidence control `Не знал`: its 44px painted box was considered visible by Playwright while the 48px `::before` hit surface extended to `845.171875px` in an `844px` viewport.
- The retained Playwright trace/screenshot confirms this is test scrolling of the painted box, not target interception or a changed visual baseline.

### Finding

Active Lesson utility, recall text action, confidence ratings and compact header controls retained a residual Issue #74 coarse-pointer target gap.

### Root cause

The older Active Lesson presentation encoded 44px painted minimums before the later Issue #74 paint-inert effective-target pattern was introduced.

The first immutable-head CI additionally exposed a browser-harness edge case: `locator.scrollIntoViewIfNeeded()` only guarantees visibility of the element border box. It does not account for the paint-inert `::before` hit slop, so iOS WebKit could leave ~1.17 CSS px of the 48px effective target outside the viewport before the four-side hit test.

### Changed files

- `frontend/app/active-lesson-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `frontend/package.json` — lesson test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Exact-base branch creation after successful Stage delivery of #431.
- Production CSS and E2E acceptance replayed from the previously reviewed stale branch onto the current exact base.
- Security versions remain Next 16.2.11, PostCSS 8.5.23 and Sharp 0.35.3; lockfile untouched.
- CI #3016: backend, frontend core, backend security, UI shards, iOS PWA dictionary, content security, performance, accessibility, dictionary smoke, visual regression and controlled service-worker jobs all passed.
- CI artifact `frontend-playwright-report-lesson` inspected; failure reproduced exactly in original and retry traces.
- Test remediation keeps the 48x48 minimum, viewport containment and all four `elementFromPoint` perimeter assertions. It only scrolls the expanded pseudo hit surface into the viewport before measuring it.

### Checks failed

- CI #3016 `Frontend E2E (Lesson completion)` failed only on `ios-webkit` for the first Study confidence target because Playwright scrolled the 44px painted box, not the expanded 48px hit surface, into view.
- The aggregate `Frontend quality` job failed solely because that lesson job failed.

### Current branch head

- Resolve from live branch ref after Agent Harness records are committed; code remediation commit is `fc2b2ba679fb073031fede752d94838e52f7dad4`.

### Next action

Run full immutable-head CI on the recorded candidate. If green, reconcile repository memory against live `main` without mixing that docs-only change into the product diff, then bring PR #433 back to the resulting exact base, rerun full CI, Ready → expected-head squash merge → exact-SHA main CI → exact-image Stage/public validation. Continue residual whole-app Issue #74 inventory after delivery rather than stopping at this slice.
