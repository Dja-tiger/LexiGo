# Current Task Progress

## 2026-08-11 10:15 Europe/Moscow

### Verified

- Live repository `main`: `c675cde343c582349b78c74cb86dc2bd07237fc0`.
- Issue #66 is open; no competing open PR owns #66.
- PRs #157/#159 already delivered glossary/topic/status terminology; remaining issue comment explicitly requires final empty/error/success and CTA review.
- Existing async-state browser coverage already proves slow/error/offline/timeout/empty/retry semantics; this slice preserves those behaviors and changes copy ownership only.
- Compatibility/Learn/Active Lesson already use `Для путешествий` and `Технические фразы`; Home was the primary-route drift using `Путешествия` and `Фразы`.

### Finding

- Generic system-state eyebrows and repeated `Повторить` / `Продолжить урок` / `На главную` actions lacked one canonical copy owner.
- 404 used `Открыть главную` while root recovery used `На главную` for the same destination.
- Home had a local `sourceLabel` function that conflicted with Learn/Active Lesson for `travel` and `phrases`.
- `Academic Technical English` is intentional course-facing content with Russian explanation and remains unchanged.

### Root cause

The original interface-copy contract centralized glossary/topic/catalog terms but did not own lesson-source names or generic state/action labels. Later route-island extraction left local copy literals that could drift independently.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/interface-copy.ts`
- `frontend/lib/interface-copy.test.ts`
- `frontend/components/async-state.tsx`
- `frontend/components/lexigo-home-app.tsx`
- `frontend/components/interface-copy-ownership-source.test.ts`
- `frontend/app/error.tsx`
- `frontend/app/global-error.tsx`
- `frontend/app/not-found.tsx`
- `frontend/e2e/interface-copy.spec.ts`
- `frontend/e2e/app-router-routes.spec.ts`

### Implementation

- Added canonical lesson-source labels, system-state eyebrows and generic recovery/action labels to `interface-copy`.
- `AsyncStatePanel` now consumes canonical state/action labels while preserving roles, focus, retry and resume semantics.
- Route and root error boundaries reuse canonical retry/home labels; 404 now uses the same `На главную` copy as root recovery.
- Home removed its local source-label function and resolves active lesson source copy through `lessonSourceLabel`.
- Home reuses the canonical `Продолжить урок` label so producer and resume-intent consumer share one value.
- Added unit coverage for all lesson-source/state/action mappings.
- Added fail-closed source ownership tests for state labels, Home source ownership and known Learn/Active/fallback label consistency.
- Added blocking Playwright coverage for a real `travel` active lesson, Learn source labels and 404 home CTA.

## 2026-08-11 — immutable-head CI diagnosis and repair

### CI evidence

- Draft PR #471 first immutable product head: `bc2b05c1a958aeac8e9fd53b4678c5ede33f1d66`.
- Actions run: `31469006656`.
- Core/unit/build/security gates passed; only the two blocking Playwright UI shards failed.
- Downloaded and inspected `frontend-playwright-report-ui-1` and `frontend-playwright-report-ui-2` artifacts rather than treating the failures as flaky retries.

### Exact failures

1. `e2e/app-router-routes.spec.ts` still expected the superseded 404 link name `Открыть главную`. The rendered not-found boundary correctly exposed `На главную`, so the regression consumer was stale after the intentional CTA contract change.
2. `e2e/interface-copy.spec.ts` installed a page-level `/api/v1/lessons/active` response for the Home source-label assertion and leaked that active lesson into the later `/learn` step. Learn therefore correctly rendered the unfinished-lesson recovery UI instead of composer radios. The test violated the project rule that adaptive/progressive state and mocks must be normalized before interacting with hidden composer controls.

### Repair

- Expanded task scope only for the directly affected existing route regression consumer `frontend/e2e/app-router-routes.spec.ts`; no unrelated runtime path was added.
- Updated the route not-found assertion to the intentional `На главную` contract.
- Scoped the page-level active-lesson fixture to the Home assertion and calls `page.unroute("**/api/v1/lessons/active")` before `/learn`, restoring the shared quality-gate API canonical 404/no-active state for composer assertions.
- No timeout increase, `.first()` masking, browser skip, production UX change, workflow change or snapshot update was used.
- Each written path was read back from `feat/issue-66-system-copy-review`; `main` remained `c675cde343c582349b78c74cb86dc2bd07237fc0` before the repair writes.

### Checks passed

- Agent Harness pre-flight completed.
- Product base branch created from exact verified `main` SHA.
- First immutable-head CI proved lint/type/unit/build/security scope healthy.
- Failure artifacts reproduced deterministic stale-test/mock causes across desktop/mobile Chromium/WebKit projects.
- Repair paths were read back after each write.

### Checks pending

- New immutable-head full CI after the CI repair commits.
- Final review/thread audit on the exact green head.
- Ready/merge gate and exact-SHA post-merge delivery validation.

### Current branch head

Resolve from live `feat/issue-66-system-copy-review` after the final task-local harness write.

### Next action

Verify the new immutable-head CI for PR #471. If the full required matrix is green, audit reviews/threads and diff, mark Ready, then merge only if all repository gates permit it; otherwise diagnose the exact new failing artifact without weakening the product contract.
