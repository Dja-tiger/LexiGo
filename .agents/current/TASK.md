# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-session-queue-selectors`
- Base SHA: `02001d365eb557efa48fa0ecb5f4289b7cb61456`
- PR: #662 (Draft)
- Delivery stage: Stage 2 — independent backend candidate selectors for explicit lesson session intent

## Objective

Use the Stage-1 `sessionKind = study | review | remediation` contract on actual lesson creation so each explicit process owns an independent automatic queue, while preserving omitted intent as the legacy staged-rollout path.

## Scope

- preserve legacy create/preview behavior when `sessionKind` is omitted;
- explicit `study` creation automatically selects only `status = 'new'` items;
- explicit `review` creation automatically selects only non-new items whose `due_at <= now()`; future scheduled items are never used to fill the block;
- classify due review items with explainable primary reasons including `relearning_due`, `overdue`, `recent_failure`, `repeated_again` and `due`;
- explicit `remediation` creation selects only weak/error candidates (`recent_failure`, `repeated_again`, `repeated_almost`, `weak_topic`) and may include not-due items because the session itself is an explicit remediation action;
- derive repeated `again` / `almost` signals from persisted review events instead of a client-side heuristic;
- keep queue ordering deterministic and retain word/phrase/topic diversification;
- make recent-completed-block exclusion session-aware for explicit sessions while preserving the old cross-kind legacy behavior for omitted intent;
- add unit and real-PostgreSQL integration regression coverage for strict queues, persisted reasons and legacy compatibility;
- keep scheduler state transitions and interval/easiness formulas unchanged.

## Explicitly deferred from this atomic slice

- `POST /api/v1/lessons/preview` remains on its existing documented legacy contract; explicit process-aware preview/recommendation will be delivered together with the next Home/recommendation stage so OpenAPI and callers change atomically;
- no Home/Learn/Active Lesson redesign or new CTA wiring;
- no change of lesson-size vocabulary (15/30/60 remains unchanged in this slice; bounded 15/30/50 UX is a later workload/UI stage);
- no default removal of legacy mixed composition until frontend callers explicitly send `sessionKind`;
- no scheduler algorithm rewrite, FSRS/SM-2 replacement, mastery redesign or interval tuning;
- no new persisted score column or ML recommendation engine;
- no analytics/dashboard redesign;
- no OpenPencil/visual/CSS changes;
- no database migration unless source evidence proves existing persisted review evidence is insufficient.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_progression.go`
- focused unit/integration tests under `backend/internal/learning/**` and `backend/integration/**`

## Prohibited paths

- `api/openapi.yaml` in this slice because the external preview contract is intentionally unchanged;
- frontend presentation/CSS/visual snapshots;
- scheduler interval/easiness/repetition implementation;
- database migrations and schema constraints unrelated to a proven missing persistence contract;
- deployment/workflow/dependency files;
- unrelated route ownership or compatibility cleanup.

## Production owners

- `backend/internal/learning/lesson_session_queues.go` — explicit queue candidate query, persisted-signal derivation, process filtering and reason precedence.
- `backend/internal/learning/lesson_composer.go` — deterministic ordering/diversification and legacy composer compatibility.
- `backend/internal/learning/lesson_progression.go` — progressive lesson creation and persisted selection reasons.
- `review_events` — authoritative persisted objective/self-rating history already used by the composer.
- `user_words` — scheduler-owned status/easiness/repetitions/due state; read-only from the selector.

## Contract matrix

- Omitted `sessionKind`: exact legacy queue semantics remain available during staged rollout.
- `study`: automatic candidates are `new` only; scheduled/review/learning items cannot fill shortages.
- `review`: automatic candidates are due/relearning-due/overdue only; scheduled-not-due cannot enter regardless of review ratio or weakness score.
- `remediation`: automatic candidates require an explicit weak/error signal and are never plain catalog/new fill.
- Manual `wordIds`: continue to be accepted with durable `manual` selection reason; explicit intent does not silently rewrite the caller-selected list.
- Source/topic filters, mixed word/phrase alternation and deterministic ordering remain.
- Recent-completed exclusion: explicit process excludes the immediately preceding block of the same process; omitted legacy intent retains prior behavior.
- Scheduler mutations: unchanged; selector only reads existing `user_words` and `review_events` state.
- Preview: unchanged external legacy contract in Stage 2.

## Selection semantics for this slice

- repeated `again`: at least two `again` effective ratings in the existing 14-day recent-failure window;
- repeated `almost`: at least three `almost` effective ratings in the existing 14-day recent-failure window;
- overdue: due for at least 24 hours; ordinary due remains `due`;
- relearning due: `status = 'learning'` and due now;
- remediation precedence: `repeated_again` → `recent_failure` → `repeated_almost` → `weak_topic`;
- review precedence: relearning/repeated failure due → overdue → ordinary due, with due time/easiness/id providing deterministic tie-breaking.

These thresholds are deterministic Stage-2 selection policy, not a new scheduler interval model. Later recommendation/analytics stages may evolve score weights while preserving the strict queue boundaries.

## Invariants

- `scheduled-not-due` never enters an explicit Review queue.
- Explicit Study cannot be padded with previously learned items.
- Explicit Remediation cannot be padded with ordinary new/scheduled items lacking a remediation signal.
- Objective correctness and self-rating remain separate persisted review-event fields; no selector may fabricate correctness from rating.
- Omitted session intent remains distinguishable from explicit `study`.
- No existing scheduler mutation is changed to make selector tests pass.
- Selection reasons stored on lesson items describe the primary reason used by the explicit queue.

## Targeted validation

- unit tests for session-kind filtering, reason precedence, repeated signals, strict no-fill behavior and legacy compatibility;
- real PostgreSQL integration proving explicit Study/Review/Remediation selection and persisted reasons;
- regression proving future scheduled items do not enter explicit Review even when the requested lesson block is larger than the due backlog;
- regression proving explicit Remediation may pull only signalled not-due items and excludes ordinary scheduled items;
- backend formatting/static/unit/race/integration/security gates;
- full required repository CI on immutable final PR head;
- review/comment/thread audit before Ready.

## Rollback

Revert the Stage-2 selector slice. Stage-1 nullable `session_kind` and expanded selection-reason vocabulary remain valid, and omitted requests continue to provide the pre-Stage-2 legacy path.
