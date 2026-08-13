# Current Task Progress

## 2026-08-13 Europe/Moscow

### Verified

- Parent Issue #25 remains open; base speech playback was already delivered by closed Issue #51, so #481 does not duplicate playback work.
- Child Issue #481 and Draft PR #482 define the first atomic #25 phase: persist `listening` as a distinct objective review mode before any listening UI or microphone work.
- Branch `feat/issue-481-listening-event-mode` was created from exact repository `main` SHA `2b91949f42db36899a79bf2329b104f368127b14`.
- Live `main` is still `2b91949f42db36899a79bf2329b104f368127b14`; parallel open PRs are Dependabot maintenance and do not overlap this learning/OpenAPI/migration scope.
- Backend now has first-class `AnswerModeListening`; `AnswerMode.Objective()` returns true for recall, choice and listening while study remains non-objective.
- `ScheduleAttempt` routes listening through the existing `ScheduleReview` implementation with no formula or parameter changes.
- `AssessReview` already gates correctness through `AnswerMode.Objective()`, so listening receives the same server-side objective judgement contract without a separate hardcode.
- HTTP validation accepts listening while an omitted legacy `answerMode` still defaults to typed `recall`.
- Lesson configuration accepts `studyMode=listening`; server-owned candidate selection uses `studyMode.Objective()` and is therefore due-only for listening with unchanged ranking.
- Explicit `wordIds` remain the existing manual lesson-selection contract and intentionally bypass composer filtering.
- Migration `000021_listening_answer_mode.up.sql` broadens only the named `review_events` and `lesson_sessions` check constraints; it does not update historical rows.
- Progress exposes a dedicated listening mode bucket. The base progress query already counts all events in `reviewsToday/reviewsTotal`; the listening extension adds only listening objective/success counters, avoiding double-counting.
- Weekly recall trend and retained-learning queries remain explicitly typed `recall` and are intentionally unchanged.
- OpenAPI is bumped to 0.15.0 and includes listening in review, moderation-context and lesson study-mode enums plus ProgressModes.
- Frontend wire `ProgressModes.listening` is optional for rolling-deploy compatibility, while `normalizedProgressModes()` always returns a concrete zero/default listening bucket.
- Temporary large-file exact-rewrite workflow plumbing was removed; `.github/workflows/**` is absent from the net PR file list.
- PR #482 has no submitted reviews and no review threads as of the pre-freeze audit.

### Implementation

- `backend/internal/learning/model.go`: listening mode and progress bucket.
- `backend/internal/learning/http.go`: review validation plus listening progress extension in both Progress and SetDailyGoal responses.
- `backend/internal/learning/lesson_http.go`: listening lesson-mode validation.
- `backend/internal/learning/lesson_composer.go`: objective modes share the same due-only boundary.
- `backend/internal/learning/scheduler.go`: listening reuses `ScheduleReview` unchanged.
- `backend/internal/learning/listening_progress.go`: isolated timezone-aware listening aggregation.
- `backend/internal/platform/migrate/migrations/000021_listening_answer_mode.up.sql`: additive allowed-value constraint expansion.
- `api/openapi.yaml`: strict API contract expansion.
- `frontend/lib/progress.ts`: listening AnswerMode plus rolling-compatible progress normalization.
- Focused unit/frontend/integration tests cover validation, scheduler equivalence, progress normalization and real persistence/composer behavior.

### CI evidence before final freeze

- CI #3364 on `45f088cfe3545da30ca2b07105563a5037f5479a`: frontend core, backend unit/security and the complete browser matrix were green; backend integration failed only because the test supplied explicit `wordIds` and incorrectly expected the composer to filter that manual-selection path.
- Root cause from `lesson_repository.go`: `CreateLesson` invokes `queryLessonCandidates` only when `WordIDs == nil`; explicit IDs are validated as assigned and persisted directly by design.
- The integration fixture was corrected without runtime changes: all learner items are moved non-due, exactly one item is made due, and the listening lesson is created without `wordIds` so the server-owned composer is exercised.
- CI #3365 on pre-freeze product/test head `1079aeb28360866b0f3e2e6260daef3ad6efb630`: `Frontend core quality` success; `Backend unit and security` success; `Backend integration` race-test step success on real Postgres/Redis/migrations. Browser gates observed green include Dictionary smoke, Accessibility audit, Controlled service worker, Visual regression, iOS PWA dictionary, Content security and Performance budgets; remaining browser leaf jobs are not used as final evidence because the final Agent Docs commit will trigger a fresh immutable-head run.

### Integration contract proven by #3365

- `answerMode=listening` persists exactly with schema version 2 and objective correctness.
- Progress returns one listening attempt/success in `modes.listening` and includes it in objective-today counters without leaking it into typed weekly recall/choice evidence.
- With the full learner catalog made non-due except one item, a server-owned `studyMode=listening` lesson contains only that one due item.
- A mismatched `answerMode=recall` review against the listening lesson returns conflict; a matching listening review succeeds and persists as listening.

### Failures and resolutions

- First integration fixture failure: both selected IDs came from `/words/due`, so both were due. Fixing only one control row was insufficient because the test still used manual `wordIds`.
- Second integration fixture failure: explicit `wordIds` bypass the composer by repository contract. Resolution: exercise the automatic composer path with no `wordIds` and isolate due state across the entire learner catalog.
- Both failures were test-assumption errors; no product runtime rollback or scheduler change was required.

### Current branch state

- Pre-freeze product/test head: `1079aeb28360866b0f3e2e6260daef3ad6efb630`.
- This Agent Docs reconciliation is the last allowed branch write.
- After its atomic commit, resolve the new head, read back the three memory files, verify compare/reviews/main, and freeze the branch.

### Next action

Run one full immutable-head PR CI on the final reconciled SHA. If every required gate is green, mark PR #482 Ready without changing the head, squash-merge with expected-head protection, then require exact-merge main CI and exact-image Stage/public acceptance before closing #481. Parent #25 remains open for later listening UI, microphone/privacy and custom terminology phases.
