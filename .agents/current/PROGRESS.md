# Current Task Progress

## 2026-08-22 11:55 +03:00

### Verified

- Issue #651 remains the parent architecture task; PR #656 intentionally delivers only Stage 1: the additive lesson session-intent contract and durable selection-reason vocabulary.
- PR #656 is open, mergeable, and Draft before delivery finalization.
- Base/main SHA is still `0873e31e26522d5a855f0ec95925a4fa4d2497e3`; no main drift occurred during implementation.
- Implementation head before delivery-docs finalization is `db60dab559cb1672fd9ee26b8b740c54be76fe52`.
- CI #3978 / run `32543320872` completed successfully on `db60dab559cb1672fd9ee26b8b740c54be76fe52`.
- PR review-thread audit returned zero unresolved threads.
- Changed production/contract paths remain inside the Stage-1 scope captured by `TASK.md`.

### Finding

Stage 1 needed a cross-layer contract rather than a type-only change. `sessionKind` has to remain a separate axis from `studyMode`/`answerMode`, persist explicitly when supplied, remain absent for legacy sessions, participate in active-session dedupe identity, and be accepted consistently by PostgreSQL, backend serialization, OpenAPI, frontend types/runtime validation, and human-readable selection-reason labels.

### Root cause

The existing model had no explicit durable lesson intent. Selection reasons also used a smaller vocabulary. During CI #3977, TypeScript correctly exposed one missed exhaustive downstream consumer: `frontend/lib/interface-copy.ts` still implemented `Record<LessonSelectionReason, string>` with only the legacy reason keys.

### Changed files

Implementation and contract changes in PR #656 include:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `api/openapi.yaml`
- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_progression.go`
- `backend/internal/learning/lesson_reasons.go`
- `backend/internal/learning/lesson_session_kind_test.go`
- `backend/internal/learning/openapi_session_kind_contract_test.go`
- `backend/integration/lesson_session_kind_test.go`
- `backend/internal/platform/migrate/migrations/000024_learning_session_kinds.up.sql`
- `frontend/lib/learning.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/account-resources.test.ts`
- `frontend/lib/interface-copy.ts`

### Checks passed

CI #3978 / run `32543320872` on immutable implementation head `db60dab559cb1672fd9ee26b8b740c54be76fe52`:

- change-scope classification and Agent Docs routing contract;
- backend dependency verification, formatting, static analysis, unit tests with race detector, coverage summary, vulnerability scan;
- backend integration tests with race detector, including migration/session-kind round-trip coverage;
- frontend lint, TypeScript typecheck, unit tests, production build, production dependency audit;
- frontend E2E UI shards 1/2 and 2/2;
- dictionary smoke;
- accessibility audit;
- visual regression;
- content security;
- iOS PWA dictionary;
- lesson completion;
- performance budgets;
- controlled service worker;
- aggregate frontend quality gate;
- API and web container builds.

### Checks failed

CI #3977 / run `32543187188` failed frontend typecheck before the final implementation head:

- failure: `frontend/lib/interface-copy.ts` did not contain labels for `overdue`, `relearning_due`, `repeated_again`, and `repeated_almost` after `LessonSelectionReason` became exhaustive;
- fix: add all four labels and explicitly include `frontend/lib/interface-copy.ts` in the allowed/runtime-owner scope;
- verification: CI #3978 typecheck and the complete workflow passed.

Earlier runs cancelled by subsequent pushes are not treated as product failures.

### Current branch head

Implementation head validated by full CI: `db60dab559cb1672fd9ee26b8b740c54be76fe52`.

The delivery-docs commit containing this progress record is a docs-only descendant of that validated implementation head; its exact SHA must be resolved from the live PR branch after the write.

### Next action

1. Commit `PROGRESS.md` and `EXECUTION.md` as one docs-only fast-forward update.
2. Verify the new branch head, unchanged main, changed-file scope, reviews/threads, and CI for the docs-only descendant.
3. Update PR #656 validation evidence to the final live head.
4. If the final required CI is green, mark PR #656 Ready for Review. Do not merge as part of this Stage-1 finalization unless explicitly requested.
