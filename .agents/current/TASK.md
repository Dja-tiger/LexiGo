# Current Task

## Identity

- Issue: #651
- Branch: feat/issue-651-process-attribution
- Base SHA: 3c8f55987d659b5c0c53713b811a7f693c8228b3
- Head SHA: resolve from live branch ref
- PR: #671

## Objective

Persist immutable Study / Review / Remediation process attribution on lesson-generated review events so analytics can distinguish learning process from answer mode without inference.

## Scope

- Add nullable `session_kind` and `selection_reason` attribution columns to `review_events` with strict constraints.
- Copy the locked lesson `session_kind` and locked lesson-item `selection_reason` into the exact review event created by `ReviewLessonWord`.
- Preserve SQL NULL for legacy/unspecified session kind and for non-lesson review paths.
- Add integration coverage proving process attribution is orthogonal to `answer_mode` and legacy/direct reviews remain unattributed where appropriate.

## Non-goals

- No scheduler algorithm or interval/easiness changes.
- No Study / Review / Remediation queue-selection changes.
- No Home recommendation changes.
- No Progress API aggregate fields yet.
- No frontend or OpenAPI changes.
- No workflow changes.

## Allowed paths

- backend/internal/platform/migrate/migrations/000025_learning_process_attribution.up.sql
- backend/internal/learning/lesson_repository.go
- backend/integration/lesson_process_attribution_test.go
- .agents/current/TASK.md
- .agents/current/PROGRESS.md
- .agents/current/EXECUTION.md

## Prohibited paths

- .github/workflows/**
- frontend/**
- api/openapi.yaml
- backend/internal/learning/scheduler.go
- backend/internal/learning/lesson_session_queues.go
- backend/internal/learning/lesson_composer.go
- backend/internal/learning/model.go
- backend/internal/learning/http.go

## Runtime owners

- `backend/internal/learning/lesson_repository.go` owns the transactional lesson review event write.
- `review_events` owns durable immutable learning-event evidence.
- `lesson_sessions.session_kind` and `lesson_session_items.selection_reason` remain the source attribution recorded at lesson composition time.

## Documentation owners

- `.agents/current/**` records task execution only; durable delivery evidence is reconciled after runtime merge.

## Invariants

- `session_kind` remains independent of `answer_mode`; never infer one from the other.
- Legacy/unspecified lesson session kind stays NULL in event attribution.
- Direct word review and unrelated review-event writers remain valid and store NULL process attribution.
- `selection_reason` remains server-owned and copied from the exact locked lesson item.
- Existing review idempotency, optimistic concurrency, scheduler state, and review-event schema-v2 judgement semantics remain unchanged.

## Acceptance criteria

- Lesson-generated events persist the exact optional `session_kind` from the locked lesson.
- Lesson-generated events persist the exact optional `selection_reason` from the locked lesson item.
- Database rejects unknown process attribution values.
- A Review session can persist `answer_mode=choice` (or another objective mode) while `session_kind=review`, proving orthogonality.
- Legacy lesson session kind is not fabricated from study mode.
- Direct `/words/{id}/review` events continue to work with NULL process attribution.
- Integration tests cover explicit attribution, legacy attribution, direct review compatibility, and DB constraints.

## Required checks

- `gofmt` for changed Go files.
- Backend unit/security checks via repository CI.
- Backend integration suite with migrations.
- Full immutable-head CI before Ready/merge.
- Review comments/reviews/threads audit before merge.
- Exact-main CI and exact-SHA Stage/public validation after merge.

## Risks

- Accidentally deriving process from `answer_mode` would corrupt analytics semantics.
- Reading attribution outside the locked lesson/item rows could make event attribution race with concurrent state changes.
- New constraints must remain compatible with legacy/direct event inserts.

## Rollback

Revert the runtime commit. The new columns are additive and nullable; existing readers and legacy/direct writers remain compatible.
