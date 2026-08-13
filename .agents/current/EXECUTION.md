# Current Task Execution

## Task

- Issue: #481
- Parent: #25
- Branch: `feat/issue-481-listening-event-mode`
- Base SHA: `2b91949f42db36899a79bf2329b104f368127b14`
- PR: #482
- Pre-freeze product/test head: `1079aeb28360866b0f3e2e6260daef3ad6efb630`
- Final head: resolve from the live branch after this atomic Agent Docs reconciliation; no further writes are allowed before merge.

## GitHub repository workflow

Purpose:

Deliver a bounded backend/API foundation for listening exercises, preserve repository invariants, diagnose CI failures from evidence, and produce immutable merge/deploy provenance.

Instruction source:

Installed GitHub skill plus repository `AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, task-specific Agent instructions and `docs/agent-harness.md`.

Verification date:

2026-08-13, repository convention Europe/Moscow.

### Pre-flight

- Verified live roadmap and selected parent #25 because other major product directions were blocked by Figma/manual device/production gates.
- Verified closed Issue #51 already owns reliable speech playback.
- Created child Issue #481 instead of duplicating playback or attempting the entire XL parent scope.
- Created branch from exact `main` SHA `2b91949f42db36899a79bf2329b104f368127b14`.
- Inspected AnswerMode, HTTP validation, scheduler, lesson repository/composer, progress SQL, migrations, OpenAPI and frontend progress owners before product writes.

### Product/API implementation

- Added `AnswerModeListening` and made it objective through the shared `Objective()` contract.
- Routed listening through the existing `ScheduleReview` path without changing scheduler math.
- Extended review/lesson validation and exact error messages.
- Changed server-owned lesson due-only selection from a hardcoded recall/choice check to `studyMode.Objective()`, preserving candidate ranking.
- Added migration `000021` to broaden only existing check constraints; historical rows are untouched.
- Added isolated `populateListeningProgress` rather than rewriting the large legacy progress query. It fills only the listening bucket and objective/success counters that need extension.
- Kept weekly recall/retained-learning semantics explicitly typed recall.
- Expanded OpenAPI to 0.15.0 for review, moderation context, lesson modes and progress.
- Added frontend listening type with optional wire bucket and mandatory normalized bucket for rolling deployment compatibility.

### Controlled large-file rewrite

Purpose:

Apply exact, narrow replacements to large owners (`lesson_composer.go`, `lesson_http.go`, `api/openapi.yaml`) without replacing files from truncated connector output.

Procedure:

- Temporarily introduced `.github/workflows/apply-issue-481-contract.yml` only after documenting the exception in TASK.
- Used fail-closed exact source-match assertions.
- First helper run stopped before product commit because the ProgressModes OpenAPI snippet did not match the exact source shape. This was the intended safety behavior.
- Corrected assertions against the actual OpenAPI blob and reran.
- Verified the bot commit touched only the three intended large files and OpenAPI parsing succeeded.
- Deleted the helper workflow immediately afterward.
- Verified `.github/workflows/**` is absent from the final PR changed-file list.

Result:

No persistent CI/workflow change remains in #482.

### Test coverage

- Added listening objective/validation tests and preserved omitted-mode => recall compatibility.
- Added scheduler equivalence coverage proving listening matches the existing objective scheduler path.
- Added frontend normalization coverage including old payloads without a listening bucket.
- Added `backend/integration/listening_review_mode_test.go` using real migrations, Postgres, Redis and HTTP server.

### Integration diagnostics

Failure 1:

The initial integration test expected one candidate to be non-due even though both IDs came from `/words/due`.

Resolution:

Normalized candidate state explicitly. This exposed a second, more precise contract misunderstanding rather than a runtime defect.

Failure 2:

CI #3364/#3365 predecessor integration evidence showed two lesson items even after one control item was moved to a future due date.

Root cause:

`Repository.CreateLesson` intentionally treats non-nil `wordIds` as manual selection. The automatic `queryLessonCandidates`/composer path is entered only when `WordIDs == nil`, so the test was bypassing the exact behavior it claimed to verify.

Resolution:

Changed only the integration fixture: make the entire learner catalog non-due, make exactly one item due, and POST the listening lesson without `wordIds`. This exercises the server-owned composer contract directly.

Verification:

CI #3365 on `1079aeb28360866b0f3e2e6260daef3ad6efb630` completed the `Integration tests with race detector` step successfully. Frontend core and backend unit/security were also green. Previous #3364 evidence had already shown the complete browser matrix green; the final reconciled SHA will rerun the full matrix and is the only merge evidence.

### Read-only audits

- Verified `AssessReview` uses `request.AnswerMode.Objective()` and therefore needs no listening-specific correctness branch.
- Verified base Progress counts all events in `reviewsToday/reviewsTotal`, so the listening extension does not double-count those values.
- Verified retained and weekly recall evidence remain explicitly `answer_mode = 'recall'`.
- Verified migration 000007 constraint names and v2 semantics are compatible with new listening values.
- Verified `main` remained `2b91949f42db36899a79bf2329b104f368127b14` before final reconciliation.
- Verified parallel open PRs are Dependabot maintenance with no selected-path overlap.
- Verified PR #482 has no reviews or review threads at the pre-freeze audit.

### Safety / rollback

- No direct writes to `main` were made.
- No listening UI, microphone, speech provider, custom glossary or scheduler-formula changes are included.
- Rollback is the product PR revert; if deployed listening rows already exist, preserve broadened DB constraints until those rows are handled intentionally.

### Final procedure

1. Atomically commit TASK/PROGRESS/EXECUTION reconciliation.
2. Read back files and resolve exact final head.
3. Freeze branch; no further content writes.
4. Require full immutable-head PR CI and clean review/compare audit.
5. Ready PR #482 without head mutation and squash-merge with expected-head protection.
6. Require exact-merge main CI.
7. Require exact-image Stage deploy + public endpoint smoke + public browser acceptance.
8. Close child Issue #481 only after all delivery gates pass; keep parent #25 open.
9. Perform separate Agent Docs post-merge reconciliation/reset before starting the next product slice.
