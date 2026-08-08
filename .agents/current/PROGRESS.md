# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Security prerequisite #431 is fully delivered on runtime/dependency SHA `a2cb82b2415e0695120ec666b86690cbcd91f12d`: exact-SHA main CI run `31222428133` succeeded and Stage #2852 / run `31223081467` succeeded including public validation.
- Required repository-memory reconciliation #434 passed docs-only CI #3020 / run `31232770284` and merged expected-head squash as `c73011f423a5d46afa433bbdff49b9223b0552c0`.
- Replacement product branch `fix/issue-74-active-lesson-live-targets-v3` is based exactly on that reconciled `main` SHA; no merge/rebase history from stale #433 was carried forward.
- Canonical Active Lesson still had 44px-only controls with no pointer-dependent 48px effective-target owner before this slice.
- The standalone acceptance is explicitly registered in `test:e2e:lesson` so authoritative CI executes it.
- Prior PR #433 full CI #3016 executed 124 lesson tests: 117 passed, 6 skipped, and only the new iOS WebKit Study target case failed; all other CI jobs were green apart from the aggregate job depending on that failure.
- The CI #3016 failure was deterministic on retry and isolated to the first confidence control `Не знал`: its 44px painted box was considered visible by Playwright while the 48px `::before` hit surface extended to `845.171875px` in an `844px` viewport.
- The retained Playwright trace/screenshot confirmed this was test scrolling of the painted box, not target interception or a changed visual baseline.
- Replacement PR #435 is open as Draft on exact reconciled base `c73011f423a5d46afa433bbdff49b9223b0552c0`.

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

- Exact-base branch creation after successful docs-only reconciliation #434.
- Production CSS and E2E acceptance replayed by content from the reviewed #433 candidate rather than carrying stale branch ancestry.
- Security versions remain Next 16.2.11, PostCSS 8.5.23 and Sharp 0.35.3; lockfile untouched.
- CI #3016 on the prior branch: backend, frontend core, backend security, UI shards, iOS PWA dictionary, content security, performance, accessibility, dictionary smoke, visual regression and controlled service-worker jobs all passed.
- CI artifact `frontend-playwright-report-lesson` inspected; failure reproduced exactly in original and retry traces.
- Test remediation keeps the 48x48 minimum, viewport containment and all four `elementFromPoint` perimeter assertions. It only scrolls the expanded pseudo hit surface into the viewport before measuring it.
- Reconciliation #434 diff was exactly one Agent Docs file and its CI correctly skipped product jobs.

### Checks failed / non-final evidence

- Prior CI #3016 `Frontend E2E (Lesson completion)` failed only on `ios-webkit` for the first Study confidence target because Playwright scrolled the 44px painted box, not the expanded 48px hit surface, into view; the aggregate `Frontend quality` job failed solely as a consequence.
- PR #433 remediation CI #3019 is not merge evidence for #435 because repository-memory reconciliation advanced `main`; regardless of its eventual result, #435 requires a fresh full immutable-head run on the exact reconciled base.

### Current branch head

- Product replay commit before current Agent Harness records: `7352f15c49c45c9d0b1b57e1d8641ca8846a6b5a`.
- Final candidate head must be resolved from the live branch after these records are committed.

### Next action

Audit the exact seven-file PR #435 diff, run full immutable-head CI, investigate any deterministic failure from retained artifacts without weakening assertions, then clean review/thread audit → Ready → expected-head squash merge → exact-SHA main CI → exact-image Stage/public validation. After this bounded slice is fully delivered, reconcile Project State and continue the residual whole-application Issue #74 live-control inventory rather than stopping at this PR.
