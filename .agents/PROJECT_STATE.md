# LexiGo Project State

## Verification

- Last verified: 2026-08-13 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product `main` before this Agent-Docs reconciliation: `1f5b152d6f904ff57f56f434c917a44f1923c6f1`.
- Latest deployed product SHA: `1f5b152d6f904ff57f56f434c917a44f1923c6f1`.
- Issue #73 / PR #477 final developer-authored head: `3b3d388f5c0c7db103c6bd895e37686aa59ad4f9`.
- PR #477 immutable-head CI #3348 / run `31646943996`: full required product matrix `success`.
- PR #477 squash product SHA: `1f5b152d6f904ff57f56f434c917a44f1923c6f1`.
- Exact-SHA `main` CI #3349 / run `31647787778`: `success`, including backend unit/race/integration/security, frontend core, both blocking UI shards, Lesson completion, accessibility, visual, PWA/service-worker, performance and immutable API/Web container publication.
- Deploy Stage #3191 / run `31648534167`: final attempt `success` for exact image SHA `1f5b152d6f904ff57f56f434c917a44f1923c6f1` after exact CI-scope artifact validation.
- Stage deploy, public frontend/API smoke and public browser validation are `success`; 12/12 public tests passed across desktop Chromium and iOS WebKit, including stale-build recovery.
- Deployment Issue #12 records image SHA `1f5b152d6f904ff57f56f434c917a44f1923c6f1`, run `31648534167`, deploy/public-smoke/public-browser all `success`, and healthy exact-SHA API/Web containers.
- Issue #73 is closed as `completed`; all seven acceptance criteria are checked with delivery evidence in the Issue.
- Issue #72 / PR #476 remains delivered as squash SHA `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`; exact-SHA `main` CI #3312 / run `31579070614` and Deploy Stage #3155 / run `31579844206` are `success`, including public desktop Chromium/iOS WebKit validation. Issue #72 is closed as `completed`.
- Issue #71 / PR #473 remains delivered as squash SHA `d480128eceba90bcb43c83ad7cd20fb74bef0391`; its immutable-head, exact-main and Stage evidence remain historical acceptance evidence.
- Issue #66 / PR #471, Issue #460 / PR #465, Issue #468 / PR #469, Issue #70 and Issue #74 remain completed historical foundations. Their detailed regression lessons remain in Git history and the dedicated `.agents/AGENTS*.md` documents.
- Issue #18 Phase 1 remains delivered as PR #462 / squash SHA `edcfd3dbee62a4dba253df07d984fa326350c984`; Phase 2 remains delivered as PR #463 / squash SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates according to changed scope.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-SHA `main` CI and exact-image Stage/public validation.
- A green workflow proves only tests actually selected by its effective command/configuration; uncollected source is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- One PR contains one atomic slice; product work must not continue through stale Agent Harness state.
- Classified external/transient infrastructure failures may be retried only after root-cause evidence is captured and only if the immutable product/workflow SHA is unchanged; final acceptance requires the affected gate to pass.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad compatibility deletion remains prohibited without exact reachability, fallback-exclusive bundle and browser evidence.
- `frontend/lib/interface-copy.ts` remains the shared owner for repeated learning terminology, source labels, generic system-state eyebrows and repeated generic recovery/navigation actions introduced by Issue #66.
- `frontend/lib/feedback.ts` plus the root `FeedbackCenter` remain the shared feedback state/presentation owner introduced by Issue #71; `AccessibleDialog` remains the sole modal/focus/portal primitive.
- Guest catalog content and authenticated scheduler/progress state remain separate security/ownership boundaries delivered by Issue #72.
- Lesson Result persisted outcome evidence, continuation policy and authenticated retention measurement are durable product boundaries delivered by Issue #73.

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
- OpenAPI `0.14.0` documents the strict authenticated result-action request contract.
- Three reviewed Linux Lesson Result baselines are canonical for the delivered states: compact next block, desktop due review and dark desktop daily goal. Normal non-update Visual Regression passes on both final PR head and squash `main` SHA.

## Issue #18 delivered foundation and remaining gate

- Server-owned adaptive ranking and persisted selection reasons from Phase 1 remain the canonical adaptive lesson foundation.
- Diagnostic onboarding backend states and deterministic bounded diagnostic selection from Phase 2 remain delivered.
- Issue #18 remains open because the first-use product flow is not complete.
- Visual First Use/onboarding implementation remains owned by Issue #201 and requires canonical Figma nodes for all required mobile/desktop, Light/Dark, loading/error/recovery and question/action states before implementation begins.
- No speculative First Use UI is permitted while that design-source gate remains unresolved.

## Current state

- Product runtime and Stage are validated on exact image SHA `1f5b152d6f904ff57f56f434c917a44f1923c6f1`.
- Issue #72 and Issue #73 are delivered and closed with immutable-head PR CI, exact-SHA `main` CI, Stage deployment, public frontend/API smoke and blocking public browser evidence.
- Issue #18 remains intentionally open behind the Issue #201 design-source gate.
- This reconciliation uses branch `docs/issue-73-post-merge-reconcile` and is Agent-Docs-only; its eventual merge may advance repository `main` but must not replace the latest deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset to canonical templates by this reconciliation before another product task starts.
- No next product issue is pre-owned by the Agent Harness after this reset; selection must use current GitHub state and respect dependency/design/manual-device gates.

## Remaining roadmap

- #201: supply all missing canonical Figma node IDs before First Use/onboarding UI implementation.
- #18: after #201 is unblocked, implement and validate the approved first-use UI and close only when the remaining acceptance criteria are evidenced.
- #78: security implementation/report-only Stage observation are delivered; the remaining enforcement promotion is explicitly manual/authorized production work and must not be synthesized by an autonomous repository workaround.
- Physical-device-only acceptance remains explicitly manual where an Issue requires real-device evidence; autonomous browser evidence must not be represented as a physical-device result.
- Production-only/manual deployment gates remain manual where repository policy requires authorized workflow dispatch.
- Open Dependabot PRs are maintenance work, not implicit ownership of the next product slice.
- After this docs reconciliation merges, the next product slice must be selected from live open GitHub Issues, be independently unblocked, remain atomic and avoid inventing Figma/design ownership.

## Reconciliation evidence

- Issue #72: PR #476 merged as `ca0a8a57628fdd36d5cc93c1bb59a4b4c099fbfa`; exact-main CI #3312 / run `31579070614` and Stage #3155 / run `31579844206` completed `success`; Issue #72 is closed.
- Issue #73: PR #477 final head `3b3d388f5c0c7db103c6bd895e37686aa59ad4f9` passed immutable-head CI #3348 / run `31646943996` completely.
- PR #477 was squash-merged as `1f5b152d6f904ff57f56f434c917a44f1923c6f1`.
- Exact-SHA `main` CI #3349 / run `31647787778` completed `success` and published immutable API/Web images for the same SHA.
- Deploy Stage #3191 / run `31648534167` completed final `success` for the same image after exact CI-scope validation; deployment, public smoke and public browser all passed.
- Deployment Issue #12 records 12/12 public Playwright tests across desktop Chromium and iOS WebKit and healthy exact-SHA services.
- Issue #73 has all seven acceptance criteria checked and is closed as `completed` with the above evidence.
- This follow-up is documentation-only: it records the verified Issue #72/#73 delivery state and resets stale current-task memory. Its merge must not be treated as a newly deployed product image.
