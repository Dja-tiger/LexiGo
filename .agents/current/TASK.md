# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-session-queue-selectors`
- Base SHA: `02001d365eb557efa48fa0ecb5f4289b7cb61456`
- PR: pending Draft PR creation
- Delivery stage: Stage 2 — independent backend candidate selectors for explicit lesson session intent

## Objective

Use the Stage-1 `sessionKind = study | review | remediation` contract to select independent automatic queues without changing legacy requests that omit `sessionKind`.

## Scope

- add optional `sessionKind` to lesson preview so preview and create use the same explicit queue contract;
- preserve legacy preview/create candidate behavior when `sessionKind` is omitted;
- explicit `study` automatically selects only `status = 'new'` items;
- explicit `review` automatically selects only non-new items whose `due_at <= now()`; future scheduled items are never used to fill the block;
- classify due review items with explainable primary reasons including `relearning_due`, `overdue`, `recent_failure`, `repeated_again` and `due`;
- explicit `remediation` selects only weak/error candidates (`recent_failure`, `repeated_again`, `repeated_almost`, `weak_topic`) and may include not-due items because the session itself is an explicit remediation action;
- derive repeated `again` / `almost` signals from persisted review events instead of a client-side heuristic;
- keep queue ordering deterministic and retain word/phrase/topic diversification;
- make recent-completed-block exclusion session-aware for explicit sessions while preserving the old cross-kind legacy behavior for omitted intent;
- synchronize OpenAPI and add unit/integration regression coverage for strict queues and legacy compatibility;
- keep scheduler state transitions and interval/easiness formulas unchanged.

## Non-goals

- no Home/Learn/Active Lesson redesign or new CTA wiring;
- no change of lesson-size vocabulary (15/30/60 remains unchanged in this slice; bounded 15/30/50 UX is a later workload/UI stage);
- no default removal of legacy mixed composition until frontend callers explicitly send `sessionKind`;
- no scheduler algorithm rewrite, FSRS/SM-2 replacement, mastery redesign or interval tuning;
- no new persisted score column or ML recommendation engine;
- no analytics/dashboard redesign;
- no OpenPencil/visual/CSS changes;
- no database migration unless source evidence proves the existing review-event data is insufficient.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_composer_test.go`
- `backend/internal/learning/lesson_progression.go`
- `backend/internal/learning/lesson_repository.go` only if an existing direct repository path must honor the same explicit contract
- `backend/internal/learning/openapi_session_kind_contract_test.go`
- `backend/integration/mixed_lesson_composer_test.go`
- a focused new `backend/integration/*session*queue*_test.go` if isolating the acceptance matrix is clearer
- `api/openapi.yaml`
- frontend shared API/runtime contract files only if compiler/runtime validation proves they are direct downstream consumers of the changed preview contract

## Prohibited paths

- frontend presentation/CSS/visual snapshots;
- scheduler interval/easiness/repetition implementation;
- database migrations and schema constraints unrelated to a proven missing persistence contract;
- deployment/workflow/dependency files;
- unrelated route ownership or compatibility cleanup.

## Production owners

- `backend/internal/learning/lesson_composer.go` — candidate query, queue filtering, ranking, composition and preview.
- `backend/internal/learning/lesson_progression.go` — progressive lesson creation and persisted selection reasons.
- `backend/internal/learning/lesson_http.go` — request validation.
- `backend/internal/learning/lesson.go` — shared request/response/session-kind domain contracts.
- `review_events` — authoritative persisted objective/self-rating history already used by the composer.
- `user_words` — scheduler-owned status/easiness/repetitions/due state; read-only from the selector.

## Contract matrix

- Omitted `sessionKind`: exact legacy queue semantics remain available during staged rollout.
- `study`: automatic candidates are `new` only; scheduled/review/learning items cannot fill shortages.
- `review`: automatic candidates are due/relearning-due/overdue only; scheduled-not-due cannot enter regardless of review ratio or weakness score.
- `remediation`: automatic candidates require an explicit weak/error signal and are never plain catalog/new fill.
- Manual `wordIds`: continue to be accepted with durable `manual` selection reason; explicit intent does not silently rewrite the caller-selected list.
- Preview and create: same explicit session selector and reason semantics.
- Source/topic filters, mixed word/phrase alternation and deterministic ordering remain.
- Recent-completed exclusion: explicit process excludes the immediately preceding block of the same process; omitted legacy intent retains prior behavior.
- Scheduler mutations: unchanged; selector only reads existing `user_words` and `review_events` state.

## Selection semantics for this slice

- repeated `again`: at least two `again` effective ratings in the existing recent-failure window;
- repeated `almost`: at least three `almost` effective ratings in the existing recent-failure window;
- overdue: due for at least 24 hours; ordinary due remains `due`;
- relearning due: `status = 'learning'` and due now;
- remediation precedence: `repeated_again` → `recent_failure` → `repeated_almost` → `weak_topic`;
- review precedence: relearning/repeated failure due → overdue → ordinary due, with due time/easiness/id providing deterministic tie-breaking.

These thresholds are deterministic Stage-2 policy, not a new scheduler interval model. Later recommendation/analytics stages may evolve score weights while preserving the strict queue boundaries.

## Invariants

- `scheduled-not-due` never enters an explicit Review queue.
- Explicit Study cannot be padded with previously learned items.
- Explicit Remediation cannot be padded with ordinary new/scheduled items lacking a remediation signal.
- Objective correctness and self-rating remain separate persisted review-event fields; no selector may fabricate correctness from rating.
- Omitted session intent remains distinguishable from explicit `study`.
- No existing scheduler mutation is changed to make the selector tests pass.
- Selection reasons stored on lesson items describe the primary reason used by the explicit queue.

## Targeted validation

- unit tests for session-kind filtering, reason precedence, repeated signals, strict no-fill behavior and legacy compatibility;
- backend HTTP validation for preview/create optional session kinds;
- real PostgreSQL integration proving explicit Study/Review/Remediation selection and persisted reasons;
- regression proving future scheduled items do not enter explicit Review even when the requested lesson block is larger than the due backlog;
- full-file OpenAPI YAML parse/contract validation after schema change;
- backend formatting/static/unit/race/integration/security gates;
- full required repository CI on immutable final PR head.

## Rollback

Revert the Stage-2 selector slice. Stage-1 nullable `session_kind` and expanded selection-reason vocabulary remain valid, and omitted requests continue to provide the pre-Stage-2 legacy path.
