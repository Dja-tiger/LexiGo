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

The original interface-copy contract centralized glossary/topic/catalog terms but did not own lesson-source names or generic system-state/action labels. Later route-island extraction left local copy literals that could drift independently.

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

### Implementation

- Added canonical lesson-source labels, system-state eyebrows and generic recovery/action labels to `interface-copy`.
- `AsyncStatePanel` now consumes canonical state/action labels while preserving roles, focus, retry and resume semantics.
- Route and root error boundaries reuse canonical retry/home labels; 404 now uses the same `На главную` copy as root recovery.
- Home removed its local source-label function and resolves active lesson source copy through `lessonSourceLabel`.
- Home reuses the canonical `Продолжить урок` label so producer and resume-intent consumer share one value.
- Added unit coverage for all lesson-source/state/action mappings.
- Added fail-closed source ownership tests for state labels, Home source ownership and known Learn/Active/fallback label consistency.
- Added blocking Playwright coverage for a real `travel` active lesson, Learn source labels and 404 home CTA.

### Checks passed

- Agent Harness pre-flight completed.
- Product base branch created from exact verified `main` SHA.
- Branch compare before final harness update was `behind_by=0` and contained only task-scoped paths.
- All repository writes were read back or branch-ref verified; `main` remained unchanged during implementation.

### Checks failed

- None yet. Authoritative frontend/product checks have not run on the final head yet.

### Current branch head

Resolve from live `feat/issue-66-system-copy-review` branch ref after this write.

### Next action

Publish Draft PR for Issue #66 and run immutable-head CI. Diagnose any exact failing job without weakening the copy/behavior contracts; merge only after the full required matrix and review/thread gate are clean.
