# Current Task

## Identity

- Issue: #651
- Branch: feat/issue-651-process-analytics
- Base SHA: 4412209b771edab470223d6dd683be5fc73b05f4
- Head SHA: resolve from live branch ref
- PR:

## Objective

Expose process-aware learning analytics from the durable Stage 6a review-event attribution without inferring Study / Review / Remediation from answer mode, and prevent explicit Study events from inflating retention evidence.

## Scope

- Add a process analytics contract to Progress for current-week Study/Review/Remediation evidence plus current Review backlog.
- Count newly learned items from explicit Study + `selection_reason=new` evidence, not passive activity alone.
- Count Review and Remediation work from immutable `session_kind` attribution.
- Count Review lapses from explicit Review events rather than Study failures.
- Compute process retention only from explicit Review retrieval evidence; Study sessions must not increase it.
- Keep legacy/null-attribution events visible in existing legacy/global metrics but out of process-specific aggregates.
- Protect the existing retained-items metric from explicit Study sessions while retaining pre-Stage-6a null-attribution compatibility.
- Update backend producer, OpenAPI, frontend runtime validator/types/normalization and regression tests together.

## Non-goals

- No scheduler interval/easiness/repetition changes.
- No queue-selection or recommendation-priority changes.
- No new database migration; Stage 6a already added event attribution.
- No Home or lesson composer changes.
- No visual Progress layout change without OpenPencil evidence; user-facing process analytics presentation is a separate design-backed slice if still required.
- No workflow changes in the final diff.

## Allowed paths

- backend/internal/learning/model.go
- backend/internal/learning/repository.go
- backend/integration/process_progress_analytics_test.go
- api/openapi.yaml
- frontend/lib/progress.ts
- frontend/lib/account-resources.ts
- frontend/lib/account-resources.test.ts
- frontend/lib/progress-evidence.test.ts
- .agents/current/TASK.md
- .agents/current/PROGRESS.md
- .agents/current/EXECUTION.md

## Prohibited paths

- backend/internal/learning/scheduler.go
- backend/internal/learning/lesson_session_queues.go
- backend/internal/learning/lesson_composer.go
- backend/internal/platform/migrate/migrations/**
- frontend/components/**
- frontend/app/**
- .github/workflows/** in the final PR diff

## Runtime owners

- `review_events.session_kind` / `selection_reason` are the immutable process evidence produced by Stage 6a.
- `Repository.Progress` owns authenticated progress aggregation.
- `ProgressSummary` + OpenAPI own the public API contract.
- `account-resources.ts` owns frontend runtime validation; `progress.ts` owns normalization/types.

## Documentation owners

- `.agents/current/**` records this atomic execution and is reconciled only after runtime delivery.

## Invariants

- Never infer `session_kind` from `answer_mode`.
- Legacy/null process attribution is not retroactively fabricated in process-specific metrics.
- Explicit Study activity cannot increase Review retention or Review lapse metrics.
- Recognition/choice activity remains distinct from stronger retrieval evidence.
- Review backlog counts only non-new items with `due_at <= now()`; scheduled-not-due items stay out.
- Existing legacy/global Progress fields remain backward compatible; retained-item compatibility may include null-attribution historical recall but must exclude explicit Study.

## Acceptance criteria

- Progress exposes distinct `newLearned`, `dueReviewed`, `remediationReviewed`, `reviewBacklog`, `lapses` and `retention` evidence in a process analytics object.
- Event metrics are based on explicit immutable Stage 6a attribution.
- `newLearned` requires explicit Study + `selection_reason=new` + effective `known` evidence and does not count `again`/passive activity.
- A Study recall event does not increase process retention or explicit retained-items evidence.
- A Review retrieval event can increase retention; a Review effective `again` contributes a lapse.
- Future-due non-new items do not increase Review backlog.
- Frontend rejects malformed process analytics and safely normalizes absence for rolling compatibility.
- OpenAPI remains structurally valid and documents the exact contract.

## Required checks

- gofmt on changed Go files.
- Backend unit/security and integration suite.
- Frontend lint/typecheck/unit/build.
- OpenAPI full YAML parse/contract checks.
- Immutable-head full CI, clean review audit, expected-head squash merge.
- Exact-main CI and exact-SHA Stage/public validation after merge.

## Risks

- Counting answer mode instead of process would recreate the semantic bug Stage 6a was introduced to prevent.
- Ambiguous `newLearned` semantics could count passive Study activity as learning; require explicit `selection_reason=new` plus effective `known` evidence.
- Tightening retained-item semantics must not erase historical pre-attribution evidence; explicit Study is excluded while null legacy evidence remains readable.

## Rollback

Revert the runtime commit. The API addition is additive and frontend normalization keeps compatibility with responses that omit the new process object.
