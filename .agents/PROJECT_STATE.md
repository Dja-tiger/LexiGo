# LexiGo Project State

## Verification

- Last verified: 2026-08-13 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live repository `main` before this Agent-Docs reconciliation: `7081eb7b2eb28dbc605d9c5d546edf5690226525`.
- Current `main` is the Issue #25 Phase 4 product merge plus a dependency-only `js-yaml` maintenance commit: Phase 4 squash `810fa59a748477f8723a19dee03e61517282df30`, then PR #432 -> `7081eb7b2eb28dbc605d9c5d546edf5690226525`.
- Exact product-merge CI #3415 / run `31718578667` completed `success` on `810fa59a748477f8723a19dee03e61517282df30`.
- Deploy Stage #3257 / run `31719479827` completed `success` for exact product image SHA `810fa59a748477f8723a19dee03e61517282df30`.
- Current-live-main CI #3421 completed `success` on `7081eb7b2eb28dbc605d9c5d546edf5690226525`.
- Current-live-main Deploy Stage #3263 completed `success` on exact SHA `7081eb7b2eb28dbc605d9c5d546edf5690226525`.
- Parent Issue #25 remains open. Delivered child foundations are Issue #481 / PR #482 + remediation #483, Issue #485 / PR #486, Issue #489 / PR #494 and Issue #497 / PR #498.
- Issue #485, #489 and #497 are closed as `completed`; PR #486, #494 and #498 are merged.
- No visible custom-vocabulary, glossary-export or microphone UI is implied by those headless platform deliveries. Any user-facing binding still requires a separately scoped, design-approved slice.
- Live GitHub is authoritative for open Issues, PRs, review state and CI; do not persist a stale open-work queue here.

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
- Lesson Result persisted outcome evidence, continuation policy and authenticated retention measurement remain durable product boundaries delivered by Issue #73.
- Listening is a first-class persisted objective learning mode delivered by Issue #481; future listening UI must build on that contract rather than reusing typed `recall` or inventing UI-only semantics.
- `frontend/src/controllers/audioInteractionPlatform.ts` remains the browser owner for speech playback integration and private local listening-event state.
- `frontend/src/controllers/customVocabularyPlatform.ts` is the browser-private owner for custom vocabulary CRUD plus deterministic glossary import/export projections delivered by Issues #485 and #489.
- The pronunciation recorder platform delivered by Issue #497 is the sole local microphone/recording lifecycle owner for that capability. It owns explicit acquisition, one bounded in-memory clip and deterministic track/object-URL cleanup; it introduces no upload or persistence path.

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
- Scheduler timing is server-owned: `nextDueAt` is consumed as an absolute timestamp and formatted in the browser locale/timezone; fixed-duration due approximation is prohibited.
- Daily-goal and streak values are displayed from refreshed server progress; the client may detect a before/after goal crossing but cannot increment authoritative counters locally.
- Continuation policy keeps exactly one useful primary next action according to current persisted evidence.
- Authenticated `POST /api/v1/lessons/{lessonID}/result-action` records only the first selected Result action for a completed lesson owned by that user; duplicate submissions are idempotent and cannot rewrite the first action.
- Migration `000020_lesson_result_retention` owns durable `lesson_result_actions` persistence and the `lesson_result_retention` SQL view.
- Retention metrics derive authenticated completion/action/return timing from lesson/session timestamps rather than anonymous route telemetry.

## Issue #25 delivered learning/audio foundations

### Phase 1 — Issue #481: persisted listening semantics

- `listening` is a first-class backend/frontend answer mode and is persisted exactly as `listening`; typed recall continues to persist as `recall`.
- `AnswerMode.Objective()` owns the objective/non-objective boundary: study remains non-objective, while recall, choice and listening are objective.
- Listening reuses the existing objective `ScheduleReview` path without scheduler formula, interval, easiness or ranking changes.
- Omitted legacy `answerMode` continues to normalize to typed `recall` for compatibility.
- Server-owned listening lesson composition is due-only through the common objective-mode boundary and preserves existing ranking. Explicit `wordIds` remain the intentional manual-selection path.
- Migration `000021_listening_answer_mode` broadens the named `review_events.answer_mode` and `lesson_sessions.study_mode` constraints only; it does not rewrite historical review events.
- Progress exposes `modes.listening`; listening contributes to objective/successful-today evidence without double-counting all-event totals.
- OpenAPI `0.15.0` documents listening across review, moderation context, lesson mode and progress contracts.
- PR #482 delivered the product foundation; PR #483 delivered the narrow Stage-acceptance remediation. Final Phase 1 Stage evidence remains accepted historical evidence.

### Phase 2 — Issue #485: private custom vocabulary foundation

- Browser-private custom vocabulary state uses the versioned local key `lexigo.learning.customVocabulary.v1`.
- CRUD semantics are deterministic: add, same-normalized-term update, remove and alphabetical ordering survive reload.
- Malformed private storage recovers safely rather than corrupting the catalog runtime.
- The platform exposes a stable structured projection for later presentation/export consumers.
- Existing listening-event storage, speech playback and study/learn behavior remain separate owners and are not repurposed.
- PR #486 final head `f2f5ee4beeeb9602fe369438752d9adf9e9e7026` squash-merged as `e3cbc843e089586284ede16259957220689a239b`.
- Phase 2 intentionally added no visible custom-vocabulary UI and no backend persistence API.

### Phase 3 — Issue #489: private glossary import/export foundation

- Glossary JSON/CSV export is generated from the deterministic in-memory custom-vocabulary projection rather than re-reading local storage.
- JSON export is versioned and owns a `words` payload; CSV uses deterministic `word,definition` headers, LF line endings and RFC4180-compatible escaping.
- Import is an exact-replacement transaction after validation; malformed input rejects without mutating existing state.
- Duplicate normalized terms collapse deterministically with the last valid row winning; unsafe prototype-pollution keys are rejected.
- PR #494 final head `9425360fde7c12a5dad8dc5f3643f24c5e07fc33` squash-merged as `d32ea777c7db59a73b704b54d2eee29e82ea927d`.
- Phase 3 intentionally added no visible download/import control and no new backend owner.

### Phase 4 — Issue #497: local pronunciation recorder platform foundation

- Local pronunciation capture is permission-gated and user-triggered; capture is not constructed before explicit acquisition.
- One bounded recorder lifecycle owns one in-memory local clip at a time, with concurrency protection and deterministic stop/cancel/error/dispose cleanup.
- Media tracks and owned object URLs are released deterministically, including late permission resolution after cancel/dispose.
- Audio remains local and ephemeral: no upload, backend/provider integration, IndexedDB/localStorage persistence or other storage side channel was introduced.
- Speech playback remains owned by the pre-existing speech player; the recorder does not become a second TTS/playback owner.
- Blocking Chromium/WebKit platform coverage executes the actual recorder source while faking only media hardware boundaries.
- PR #498 final head `001ca1f275fa2ed0b2fbcdcfb445d4275cf75b06` squash-merged as `810fa59a748477f8723a19dee03e61517282df30`.
- Exact-main CI #3415 and Deploy Stage #3257 both completed `success` on that product SHA.
- Phase 4 intentionally added no microphone button, permission-education UI, recorded-clip playback UI, pronunciation scoring or cloud persistence.

## Issue #18 delivered foundation and remaining gate

- Server-owned adaptive ranking and persisted selection reasons from Phase 1 remain the canonical adaptive lesson foundation.
- Diagnostic onboarding backend states and deterministic bounded diagnostic selection from Phase 2 remain delivered.
- Issue #18 remains open because the first-use product flow is not complete.
- Visual First Use/onboarding implementation remains owned by Issue #201 and requires canonical Figma nodes for all required mobile/desktop, Light/Dark, loading/error/recovery and question/action states before implementation begins.
- No speculative First Use UI is permitted while that design-source gate remains unresolved.

## Current state

- Current live `main` and Stage are validated on exact SHA `7081eb7b2eb28dbc605d9c5d546edf5690226525`; the latest #25 feature merge contained in that head is `810fa59a748477f8723a19dee03e61517282df30`.
- Parent #25 remains open after four delivered foundation phases. Persisted listening semantics, private vocabulary state, deterministic glossary codecs and the local recorder lifecycle are implemented.
- The remaining #25 product surface is not permission to invent UI. Visible custom-vocabulary/export/recorder integration must be a new atomic child Issue with approved design evidence and explicit accessibility/browser acceptance.
- Speech playback/Web Speech fallback remains an existing owner and must be preserved by future #25 work.
- Issue #72 and Issue #73 remain delivered and closed.
- Issue #18 remains intentionally open behind the Issue #201 design-source gate.
- This reconciliation uses branch `docs/reset-issue-497-current-task` and is Agent-Docs-only; its eventual merge may advance repository `main` but must not be represented as a newly shipped product feature.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` must be canonical reset templates before another product task starts.
- No next product issue is pre-owned by the Agent Harness after this reset; selection must use current live GitHub state and respect dependency, design and manual-device gates.

## Remaining roadmap

- #25: select the next atomic child slice from live GitHub. The delivered headless vocabulary/export/recorder owners may be bound to presentation only when the required Figma/design state is verified; no speculative visual surface is permitted.
- #201: supply all missing canonical Figma node IDs before First Use/onboarding UI implementation.
- #18: after #201 is unblocked, implement and validate the approved first-use UI and close only when the remaining acceptance criteria are evidenced.
- #78: security implementation/report-only Stage observation are delivered; remaining enforcement promotion is explicitly manual/authorized production work and must not be synthesized by an autonomous repository workaround.
- Physical-device-only acceptance remains explicitly manual where an Issue requires real-device evidence; autonomous browser evidence must not be represented as a physical-device result.
- Production-only/manual deployment gates remain manual where repository policy requires authorized workflow dispatch.
- Open Dependabot PRs are maintenance work, not implicit ownership of the next product slice.
- After this docs reconciliation merges, the next product slice must be selected from live open GitHub Issues, be independently unblocked, remain atomic and avoid inventing Figma/design ownership.

## Reconciliation evidence

- Issue #485 is closed as completed; PR #486 merged private custom-vocabulary state as `e3cbc843e089586284ede16259957220689a239b`.
- Issue #489 is closed as completed; PR #494 merged deterministic private glossary import/export as `d32ea777c7db59a73b704b54d2eee29e82ea927d`.
- Issue #497 is closed as completed; PR #498 final immutable head `001ca1f275fa2ed0b2fbcdcfb445d4275cf75b06` merged the local pronunciation recorder platform as `810fa59a748477f8723a19dee03e61517282df30`.
- Product exact-main CI #3415 / run `31718578667` and Deploy Stage #3257 / run `31719479827` completed `success` on `810fa59a748477f8723a19dee03e61517282df30`.
- Dependency-only PR #432 then advanced live `main` to `7081eb7b2eb28dbc605d9c5d546edf5690226525`; exact-live-main CI #3421 and Deploy Stage #3263 completed `success` on that SHA.
- Parent Issue #25 remains open because the delivered capabilities are foundations and do not by themselves complete the design-approved visible custom-vocabulary/pronunciation product surface.
- This follow-up is documentation-only: it reconciles durable product state and resets stale current-task memory. Its merge must not be treated as a newly deployed product image.
