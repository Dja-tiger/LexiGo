# Current Task Execution

## Task

- Issue: #651
- Branch: `feat/issue-651-session-queue-selectors`
- Base SHA: `02001d365eb557efa48fa0ecb5f4289b7cb61456`
- PR: #662 (Draft until final gates pass)
- Atomic delivery stage: Stage 2 — independent backend automatic queues for explicit `sessionKind`

## Sources and prerequisites

Instruction sources read before writes:

- root `AGENTS.md` and `.agents/AGENTS.md`;
- all mandatory `.agents/AGENTS.*.md` documents referenced by the repository index;
- `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, current task files and `docs/agent-harness.md`;
- live Issue #651 and its comments;
- live PR #656/Stage-1 repository state;
- backend learning domain, lesson composer/progression/repository/scheduler contracts;
- current migrations for review-event self-rating, objective correctness and judgement semantics;
- current CI workflow and integration-test ownership.

Live preflight proved there was no open PR to continue and that Stage 1 had already delivered nullable `sessionKind` plus expanded selection-reason vocabulary. Stage 2 therefore began from exact live main rather than duplicating #656.

## Engineering decisions

### Compatibility boundary

Omitted `sessionKind` remains the rollout-safe legacy path. The existing `queryLessonCandidates` implementation is preserved and explicit intent is routed through a new selector owner instead of rewriting the legacy SQL in-place.

This keeps current frontend callers stable until a later #651 PR explicitly opts them into `study`, `review` or `remediation`.

### Study queue

Automatic explicit Study accepts only `user_words.status = 'new'`. Composer review-ratio logic cannot introduce learned items because the upstream candidate set is already new-only.

### Review queue

Automatic explicit Review accepts only non-new rows with `due_at <= now()`. The requested lesson size is an upper bound over the real due backlog, not a target that can be padded with future scheduled items.

Primary reason precedence is process-aware: relearning due, repeated learner failure, recent objective/scheduler failure, overdue, then ordinary due. Existing deterministic due-time ordering/diversification remains after the strict boundary.

### Remediation queue

Automatic explicit Remediation requires persisted weakness/error evidence. Supported signals are repeated `again`, recent failure, repeated `almost` and weak topic. A future-scheduled item may enter this queue only because an explicit remediation process is being started; an ordinary scheduled item without a signal is excluded.

### Self-rating vs objective correctness

The repository already persists separate fields for learner self-assessment and objective/scheduler judgement. Repeated `Не знаю` / `Почти` therefore counts `review_events.rating`, not `effective_rating`.

`recent_failure` remains a separate signal based on the latest recent event's objective `correct = false` or scheduler-effective `again`. This avoids fabricating the user's self-rating from an objective answer failure.

### Persisted explanation

Selected explicit candidates carry a primary `LessonSelectionReason` override into the existing lesson-item persistence path. Manual `wordIds` continue to persist `manual`. No scheduler state was mutated to manufacture a selector result.

### Immediate continuation exclusion

Explicit sessions exclude the immediately preceding completed block only when source, answer mode and `session_kind` match. Omitted legacy sessions retain the prior exclusion behavior to avoid rollout regression.

### Preview boundary

The documented external `POST /api/v1/lessons/preview` contract is not widened in Stage 2. Process-aware preview/recommendation should be delivered with the Home recommendation/count layer so backend API, OpenAPI and frontend caller move atomically.

## Production code changed

- `backend/internal/learning/lesson_session_queues.go`
  - explicit candidate SQL;
  - recent self-rating counts;
  - weak-topic/recent-failure/overdue derivation;
  - Study/Review/Remediation filters and primary-reason precedence;
  - session-kind-scoped recent-completed exclusion.
- `backend/internal/learning/lesson_composer.go`
  - candidate metadata/reason override support;
  - explicit-session routing hook;
  - reason-aware scheduled composition count;
  - deterministic easiness tie-break and process-aware priority tiers.
- `backend/internal/learning/lesson_progression.go`
  - automatic create path now routes explicit `sessionKind` through the independent selector owner while manual creation stays unchanged.
- `backend/internal/learning/lesson.go`
  - internal non-serialized preview staging field used by the shared composer hook; no external preview/OpenAPI surface change in this stage.

No database migration, scheduler interval/easiness/repetition mutation, frontend presentation, CSS, deployment or dependency file is changed.

## Regression tests added

- `backend/internal/learning/lesson_session_queues_test.go`
  - strict Study new-only filtering;
  - Review future-scheduled exclusion and exact backlog behavior;
  - Review/Remediation reason precedence;
  - Remediation signal-only filtering;
  - legacy reason compatibility.
- `backend/integration/lesson_session_queues_test.go`
  - real migrations/catalog/PostgreSQL/Redis server path;
  - deterministic new, due, overdue, relearning-due, repeated-again future, repeated-almost future and ordinary future states;
  - HTTP lesson creation for all three explicit session kinds;
  - database read-back of durable `selection_reason`;
  - omitted-intent legacy creation regression.

## Validation process

The first CI attempt classified the only backend failure as formatting: the new Go files were reported by `gofmt -l`. They were reformatted without changing selector semantics.

On the subsequent code head the following gates were observed green before final documentation was committed:

- change-scope classification;
- Go formatting;
- static analysis;
- backend unit tests under the race detector;
- coverage summary;
- vulnerability scan;
- frontend lint, typecheck, unit tests, production build and production dependency audit;
- several browser/PWA/security/accessibility jobs.

The authoritative merge gate is the fresh complete CI run on the final head containing these execution records; no intermediate run ID is promoted as durable state.

## Review and safety audit

Before final docs, PR #662 had no submitted reviews, no inline review threads and no conversation comments. This audit must be repeated on the final unchanged head before Ready.

Safety/compatibility restrictions preserved:

- no direct `main` write;
- no parallel product PR while #662 is active;
- no `scheduled-not-due` fill in explicit Review;
- no learned-item fill in explicit Study;
- no ordinary-item fill in explicit Remediation;
- no conflation of self-rating with objective correctness;
- no scheduler formula mutation;
- no OpenAPI/frontend rollout ahead of explicit caller wiring;
- no destructive data or deployment operation.

## Rollback

Revert the Stage-2 selector PR. Stage-1 nullable `session_kind` and reason vocabulary remain backward compatible, and callers that omit `sessionKind` continue using the pre-Stage-2 legacy composer path.

## Handoff

Do not start the next #651 product slice until #662 has full required CI on its final immutable head, a clean review/thread audit, Ready state, expected-head squash merge, exact-main CI and Stage validation. After that, update durable project state/reset current context and begin the process-aware recommendation/Home slice from the new live main.
