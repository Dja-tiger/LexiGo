# Current Task Progress

## 2026-08-24 Stage 6a

### Verified

- Live `main` before branching: `3c8f55987d659b5c0c53713b811a7f693c8228b3`.
- No open pull requests existed before creating this branch.
- Issue #651 still has an unmet observability/analytics requirement to separate Study / Review / Remediation.
- Existing `selection_reason` and queue priority contracts are already implemented and must not be duplicated.
- `review_events` previously persisted `answer_mode` but not lesson `session_kind` or item `selection_reason`.
- Lesson review endpoint is `POST /api/v1/lessons/{lessonID}/words/{wordID}/review`.

### Finding

Process analytics cannot safely reconstruct Study / Review / Remediation from `answer_mode`. Durable process attribution must be recorded on each lesson-generated review event before aggregate analytics are added.

### Root cause

`ReviewLessonWord` wrote judgement and answer-mode evidence to `review_events` but did not copy the already-durable `lesson_sessions.session_kind` and `lesson_session_items.selection_reason` from the locked lesson state.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `backend/internal/platform/migrate/migrations/000025_learning_process_attribution.up.sql`
- `backend/internal/learning/lesson_repository.go`
- `backend/integration/lesson_process_attribution_test.go`

### Checks passed

- Readback of migration, runtime change, and integration test from the exact feature branch.
- Compare against base is `behind_by=0` and contains only the planned runtime/test/harness paths so far.
- `main` remained unchanged after branch writes.

### Checks failed

- None yet; immutable-head CI has not run yet.

### Current branch head

Resolve from live branch ref after final harness update.

### Next action

Open a Draft PR, run immutable-head CI, fix any compile/integration failures, then perform final scope and review audit before Ready/merge.
