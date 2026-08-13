# LexiGo Project State

## Verification

- Last verified: 2026-08-13 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository `main` before this Agent-Docs reconciliation: `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`.
- Latest deployed product SHA: `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`.
- Issue #481 product PR #482 final head `b7eb33fd0e7da8b877217b1ec8f2af93b491f8e9` passed immutable-head CI #3366 / run `31675107869` completely and squash-merged as `b62470b0051ca60e2bea177ab08945887107822c`.
- Product exact-main CI #3367 / run `31675946620` completed `success` and published immutable API/Web images for `b62470b0051ca60e2bea177ab08945887107822c`.
- Initial Stage #3208 / run `31676641895` deployed that exact product SHA and passed public frontend/API smoke; public iOS WebKit stale-build recovery exposed a deterministic diagnostic-normalization incompatibility in the acceptance classifier.
- Remediation PR #483 final head `97270de0de8eb7682c8aa0532d7252ef4578264b` passed immutable-head CI #3369 / run `31678681171` completely and squash-merged as `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`.
- Exact-main CI #3370 / run `31679586052` completed `success` and published immutable API/Web images for `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`.
- Deploy Stage #3212 / run `31680424987` completed `success` for exact image SHA `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`: exact CI-scope validation, deploy, public frontend/API smoke and public browser validation all passed, including Chromium and iOS WebKit stale-build recovery.
- Issue #481 is closed as `completed`; all seven acceptance criteria are checked with full product/remediation delivery evidence. Parent Issue #25 remains open.
- Issue #73 / PR #477 remains delivered as squash SHA `1f5b152d6f904ff57f56f434c917a44f1923c6f1`; immutable-head CI #3348, exact-main CI #3349 and Stage #3191 remain accepted historical evidence.
- Issue #72 / PR #476 remains delivered as squash SHA `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`; exact-main CI #3312 / run `31579070614` and Deploy Stage #3155 / run `31579844206` remain accepted historical evidence.
- Issue #71 / PR #473, Issue #66 / PR #471, Issue #460 / PR #465, Issue #468 / PR #469, Issue #70 and Issue #74 remain completed historical foundations.
- Issue #18 Phase 1 remains delivered as PR #462 / squash SHA `edcfd3dbee62a4dba253df07d984fa326350c984`; Phase 2 remains delivered as PR #463 / squash SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates according to changed scope.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-SHA `main` CI and exact-image Stage/public validation.
- A green workflow proves only tests actually selected by its effective command/configuration; uncollected source is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- One PR contains one atomic slice; product work must not continue through stale Agent Harness state.
- Classified external/transient infrastructure failures may be retried only after root-cause evidence is captured and only if the immutable product/workflow SHA is unchanged; final acceptance requires the affected gate to pass.
- If a blocking acceptance failure is deterministic, remediate the root cause with a narrow follow-up PR and repeat exact-main/Stage evidence rather than accepting a rerun as delivery proof.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad compatibility deletion remains prohibited without exact reachability, fallback-exclusive bundle and browser evidence.
- `frontend/lib/interface-copy.ts` remains the shared owner for repeated learning terminology, source labels, generic system-state eyebrows and repeated generic recovery/navigation actions introduced by Issue #66.
- `frontend/lib/feedback.ts` plus the root `FeedbackCenter` remain the shared feedback state/presentation owner introduced by Issue #71; `AccessibleDialog` remains the sole modal/focus/portal primitive.
- Guest catalog content and authenticated scheduler/progress state remain separate security/ownership boundaries delivered by Issue #72.
- Lesson Result persisted outcome evidence, continuation policy and authenticated retention measurement are durable product boundaries delivered by Issue #73.
- Listening is now a first-class persisted objective learning mode delivered by Issue #481; future listening UI must build on that contract rather than reusing typed `recall` or inventing UI-only semantics.

## Issue #72 delivered guest catalog contract

- Public Words list/detail endpoints expose content-only catalog projections and cannot expose personalized SRS/status fields.
- Authenticated `/api/v1/words*`, due, progress, lessons and review persistence remain the only owners of personalized scheduler state.
- Dictionary guest mode consumes the public Words projection; guest Word Detail exposes content without scheduler/status presentation.
- Phrases preserves its content-only guest/demo path with matching non-persistence guidance.
- Persistent practice remains authentication-gated before lesson creation.
- Canonical internal `return_to` preserves search/filter/sort/page/detail context, rejects malformed/external destinations and uses replace semantics after login/registration.
- Dictionary submit reads the live named form control through `FormData`, preventing the confirmed WebKit immediate-submit stale-state race.
- Blocking browser coverage proves guest Word Detail -> login -> exact return and guest Phrases -> registration -> exact return across desktop Chromium and iOS WebKit.

## Issue #73 delivered Lesson Result retention contract

- `frontend/lib/lesson-result.ts` owns a versioned persisted completion snapshot built only after the final review is successfully saved and refreshed server progress is available.
- Objective evidence keeps `attempted`, `correct` and `unavailable` separate; restored `correct=null` activity is never fabricated as objective success/failure.
- Self-rating (`known` / `almost` / `again`) remains confidence/activity context and is never converted to objective correctness.
- Honest result states include complete, partial, study-only, skipped and empty evidence without invented mastery.
- Scheduler timing is server-owned: `nextDueAt` is consumed as an absolute timestamp and formatted in the browser locale/timezone; fixed-duration due approximation is prohibited.
- Daily-goal and streak values are displayed from refreshed server progress; the client may detect a before/after goal crossing but cannot increment authoritative counters locally.
- Continuation policy keeps exactly one useful primary next action and prioritizes sync safety/goal milestone, immediately due review, distinct next work and return/home according to current evidence.
- Compact/mobile presentation keeps required objective evidence, review timing and goal/streak context visible while preserving the canonical one-primary-CTA composition.
- Authenticated `POST /api/v1/lessons/{lessonID}/result-action` records only the first selected Result action for a completed lesson owned by that user; duplicate submissions are idempotent and cannot rewrite the first action.
- Migration `000020_lesson_result_retention` owns the durable `lesson_result_actions` persistence boundary and the `lesson_result_retention` SQL view.
- Retention metrics derive `completion_to_action_seconds`, `return_to_next_session_seconds` and whether the selected action matched the recommendation from authenticated lesson/session timestamps; anonymous route telemetry is not used as cross-session identity.
- Three reviewed Linux Lesson Result baselines remain canonical for the delivered states; normal non-update Visual Regression passed on final PR and squash `main` delivery heads.

## Issue #481 delivered listening event contract

- `listening` is a first-class backend/frontend answer mode and is persisted exactly as `listening`; typed recall continues to persist as `recall`.
- `AnswerMode.Objective()` owns the objective/non-objective boundary: study remains non-objective, while recall, choice and listening are objective.
- Listening reuses the existing objective `ScheduleReview` path without scheduler formula, interval, easiness or ranking changes.
- Server-side answer judgement already routes objective correctness through `AnswerMode.Objective()`; no listening-specific correctness fork is required.
- Omitted legacy `answerMode` continues to normalize to typed `recall` for compatibility.
- Server-owned listening lesson composition is due-only through the common objective-mode boundary and preserves existing ranking. Explicit `wordIds` remain the intentional manual-selection path and bypass automatic composer filtering.
- Migration `000021_listening_answer_mode` broadens the named `review_events.answer_mode` and `lesson_sessions.study_mode` constraints only; it does not rewrite historical review events.
- Progress exposes `modes.listening`; listening contributes to objective/successful-today evidence without double-counting all-event totals. Weekly typed-recall and retained-learning semantics remain unchanged.
- OpenAPI `0.15.0` documents listening across review, moderation context, lesson mode and progress contracts.
- Frontend rolling-deploy compatibility permits an older progress payload to omit the listening wire bucket while normalization materializes a zero listening bucket for consumers.
- The public-runtime WebKit guard-cancellation normalizer accepts the one- or two-slash split-protocol forms only before the existing exact WebKit/current-build guard URL equality check; real service-worker failures remain visible.

## Issue #18 delivered foundation and remaining gate

- Server-owned adaptive ranking and persisted selection reasons from Phase 1 remain the canonical adaptive lesson foundation.
- Diagnostic onboarding backend states and deterministic bounded diagnostic selection from Phase 2 remain delivered.
- Issue #18 remains open because the first-use product flow is not complete.
- Visual First Use/onboarding implementation remains owned by Issue #201 and requires canonical Figma nodes for all required mobile/desktop, Light/Dark, loading/error/recovery and question/action states before implementation begins.
- No speculative First Use UI is permitted while that design-source gate remains unresolved.

## Current state

- Product runtime and Stage are validated on exact image SHA `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`.
- Issue #481 is delivered and closed after PR #482 product delivery plus narrowly scoped PR #483 Stage-acceptance remediation, with immutable-head CI, exact-main CI and final public Chromium/iOS WebKit evidence.
- Parent #25 remains open; Phase 1 event/persistence semantics are complete, while listening-first UI, microphone/privacy and custom terminology remain future separately scoped work.
- Issue #72 and Issue #73 remain delivered and closed.
- Issue #18 remains intentionally open behind the Issue #201 design-source gate.
- This reconciliation uses branch `docs/issue-481-post-merge-reconcile` and is Agent-Docs-only; its eventual merge may advance repository `main` but must not replace the latest deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset to canonical templates by this reconciliation before another product task starts.
- No next product issue is pre-owned by the Agent Harness after this reset; selection must use current GitHub state and respect dependency/design/manual-device gates.

## Remaining roadmap

- #25: Phase 1 persisted listening-event semantics are delivered by #481. Any next phase must be a new atomic child Issue; likely domains include listening-first UX, microphone/privacy/pronunciation and custom terminology, but selection must be based on live repository dependencies and design readiness rather than implicit ownership.
- #201: supply all missing canonical Figma node IDs before First Use/onboarding UI implementation.
- #18: after #201 is unblocked, implement and validate the approved first-use UI and close only when the remaining acceptance criteria are evidenced.
- #78: security implementation/report-only Stage observation are delivered; the remaining enforcement promotion is explicitly manual/authorized production work and must not be synthesized by an autonomous repository workaround.
- Physical-device-only acceptance remains explicitly manual where an Issue requires real-device evidence; autonomous browser evidence must not be represented as a physical-device result.
- Production-only/manual deployment gates remain manual where repository policy requires authorized workflow dispatch.
- Open Dependabot PRs are maintenance work, not implicit ownership of the next product slice.
- After this docs reconciliation merges, the next product slice must be selected from live open GitHub Issues, be independently unblocked, remain atomic and avoid inventing Figma/design ownership.

## Reconciliation evidence

- Issue #481 product PR #482 final head `b7eb33fd0e7da8b877217b1ec8f2af93b491f8e9` passed immutable-head CI #3366 / run `31675107869`; squash merge `b62470b0051ca60e2bea177ab08945887107822c` passed exact-main CI #3367 / run `31675946620`.
- Initial Stage #3208 / run `31676641895` successfully deployed `b62470b0...` and passed public endpoint smoke, then exposed a deterministic WebKit diagnostic-normalization acceptance blocker.
- Remediation PR #483 final head `97270de0de8eb7682c8aa0532d7252ef4578264b` passed immutable-head CI #3369 / run `31678681171`; squash merge `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa` passed exact-main CI #3370 / run `31679586052`.
- Final Deploy Stage #3212 / run `31680424987` completed `success` for exact image SHA `d365aab1bec2c5be8ab076a0dd8f9b98f5c109aa`: deploy, public frontend/API smoke and public Chromium/iOS WebKit UI/stale-build recovery all passed.
- Issue #481 has all seven acceptance criteria checked and is closed as `completed` with the above evidence; parent #25 remains open.
- This follow-up is documentation-only: it records the durable #481 delivery state and resets stale current-task memory. Its merge must not be treated as a newly deployed product image.
