# Current Task Progress

## 2026-08-22 — Issue #651 Stage 2

### Verified before writes

- Repository: `Dja-tiger/LexiGo`.
- Active parent task: Issue #651.
- Stage 1 was already delivered by PR #656; it added nullable `sessionKind` persistence/API vocabulary but intentionally left candidate selection unchanged.
- Live base/main at Stage-2 start: `02001d365eb557efa48fa0ecb5f4289b7cb61456`.
- Open PR audit before branch creation: none.
- Stage status at slice start was healthy on the same exact main SHA after the preceding capacity-recovery work.
- Branch: `feat/issue-651-session-queue-selectors` from exact live main.
- Draft PR: #662.

### Implemented

- Added a dedicated explicit-session candidate owner in `lesson_session_queues.go`.
- Omitted `sessionKind` continues to call the pre-existing legacy composer path unchanged.
- Explicit `study` filters automatic candidates to `user_words.status = 'new'` only.
- Explicit `review` requires non-new `due_at <= now()` candidates; future scheduled items cannot fill a requested block.
- Explicit `remediation` requires a persisted weak/error signal and can deliberately pull a not-due item only because remediation was explicitly requested.
- Repeated self-assessment signals count persisted `review_events.rating` values so `Не знаю/Почти` remain independent from objective correctness.
- Objective/recent failure continues to use the separate persisted `correct` / scheduler-effective evidence.
- Primary durable reasons include `new`, `due`, `overdue`, `relearning_due`, `recent_failure`, `repeated_again`, `repeated_almost`, `weak_topic` and the existing `manual` path.
- Explicit recent-completed exclusion is scoped to the same `session_kind`; omitted legacy intent retains the previous cross-kind behavior.
- Existing source/topic filtering, mixed word/phrase alternation and deterministic diversification remain in the composer.
- Scheduler state transition, easiness, interval and repetition mutation code was not changed.
- External lesson-preview/OpenAPI behavior was intentionally not widened in this atomic slice; process-aware recommendation/preview belongs to the next #651 stage.

### Regression protection

Unit coverage verifies:

- Study cannot contain previously learned items;
- Review cannot contain scheduled-not-due items even when the requested block is larger than the due backlog;
- Review primary reason precedence for relearning, repeated failure, recent failure, overdue and ordinary due;
- Remediation excludes ordinary due/new/scheduled candidates without a weakness/error signal;
- legacy reason behavior remains unchanged when no explicit selector override exists.

Real PostgreSQL integration coverage prepares independent new/due/overdue/relearning/future-remediation/future-ordinary states and verifies:

- explicit Study returns new items only;
- explicit Review returns the exact due backlog without future fill;
- explicit Remediation pulls only future items carrying repeated learner-signal evidence;
- `lesson_session_items.selection_reason` persists the process-specific primary reason;
- omitted `sessionKind` still creates through the legacy path.

### Pre-final validation observed

- change-scope classification: green;
- Go formatting: green after the initial formatting-only failure was corrected;
- static analysis: green;
- backend unit tests with race detector: green;
- coverage summary: green;
- vulnerability scan: green;
- frontend lint/type/unit/build/dependency audit: green;
- multiple repository browser/PWA/security/accessibility jobs on the same code head were green while the remaining full matrix was still completing.

The final evidence owner is the immutable CI run on the final documentation/code head; transient intermediate run IDs remain in PR history rather than durable project memory.

### Current changed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_progression.go`
- `backend/internal/learning/lesson_session_queues.go`
- `backend/internal/learning/lesson_session_queues_test.go`
- `backend/integration/lesson_session_queues_test.go`

### Remaining for this atomic PR

- full required CI on the final immutable PR head, including real PostgreSQL integration and the complete repository browser matrix;
- re-verify live main has not moved incompatibly;
- re-audit PR reviews, inline threads and conversation comments;
- mark #662 Ready only if all required gates are green on the unchanged head;
- squash merge with expected-head guard;
- exact-main CI and Stage validation after merge;
- promote durable Stage-2 outcome into `PROJECT_STATE.md` and reset `.agents/current/**` through the normal follow-up flow.

### Remaining in parent Issue #651 after Stage 2

- process-aware recommendation/count API and Home CTAs for Study/Review/Remediation;
- bounded workload UX and review-backlog display without misleading progress semantics;
- explicit caller wiring so frontend lesson creation sends the intended `sessionKind`;
- result/continuation UX aligned to the three independent processes;
- process-aware analytics/telemetry;
- scheduler architecture ADR and benchmark/adaptive-scheduler decision required by the parent issue;
- final end-to-end acceptance across guest/auth/PWA/mobile/desktop states.
