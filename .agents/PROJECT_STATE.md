# LexiGo Project State

## Verification

- Last verified: 2026-08-13 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live repository `main`: `e3b5edf9a9a5ef6113ca40c94de18e238fc66e03` after Agent-Docs PR #499.
- Latest deployed runtime/Stage SHA: `7081eb7b2eb28dbc605d9c5d546edf5690226525`.
- Latest Issue #25 product merge contained in that runtime is Phase 4 squash `810fa59a748477f8723a19dee03e61517282df30`.
- Phase 4 exact-main CI #3415 / run `31718578667` and Deploy Stage #3257 / run `31719479827` completed `success` on `810fa59a748477f8723a19dee03e61517282df30`.
- Dependency-only PR #432 advanced the deployed runtime to `7081eb7b2eb28dbc605d9c5d546edf5690226525`; CI #3421 and Deploy Stage #3263 completed `success` on that SHA.
- Agent-Docs PR #499 squash-merged as `e3b5edf9a9a5ef6113ca40c94de18e238fc66e03`; lightweight exact-main CI #3423 completed `success`. A docs-only head does not require Stage deployment.
- Live GitHub and live source are authoritative for open work, delivery ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product/mixed changes require the repository-owned backend/frontend/browser/accessibility/performance/container gates selected by changed scope.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-main CI and exact-image Stage/public validation.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- A green workflow proves only tests actually collected by that workflow configuration.
- Physical-device or production-only gates must remain explicitly manual when the Issue requires them.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad deletion requires exact reachability/bundle/browser evidence.
- `frontend/lib/interface-copy.ts` owns repeated learning terminology and shared generic system copy introduced by Issue #66.
- `frontend/lib/feedback.ts` plus root `FeedbackCenter` own shared feedback state/presentation; `AccessibleDialog` remains the modal/focus/portal primitive.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries delivered by Issue #72.
- Lesson Result persisted outcome evidence and retention measurement remain durable boundaries delivered by Issue #73.
- Existing frontend speech playback remains the browser speech owner.

## Issue #25 delivered contracts

### Phase 1 — Issue #481: persisted listening semantics

- `listening` is a first-class backend/frontend answer mode and persists separately from typed `recall`.
- Listening uses the existing objective `ScheduleReview` path; scheduler formulas/ranking were not forked.
- Migration `000021_listening_answer_mode` broadens named answer/study-mode constraints only.
- Progress exposes `modes.listening` without double-counting totals.
- PR #482 plus remediation #483 delivered and validated the Phase 1 contract.

### Phase 2 — Issue #485: account-owned custom vocabulary

- Migration `000022_custom_words.up.sql` adds nullable `words.owner_user_id`; shared catalog rows keep `owner_user_id is null` and private rows use account-scoped uniqueness.
- `backend/internal/words/custom_word.go`, `custom_repository.go` and `custom_http.go` own bounded validation, authenticated account ownership, persistence, scheduler enrollment and deletion.
- `POST /api/v1/words/custom` creates the private `words` row plus exactly one `user_words` enrollment in one PostgreSQL transaction.
- Equivalent normalized content conflicts only within the same account; another account may own an equivalent term independently.
- Public list/detail/metadata exclude private rows. Authenticated reads expose only shared content or the current owner's private content.
- Owner-only deletion discards an active lesson containing the word before FK cascades remove dependent scheduler/review/lesson rows.
- Existing due queue, lesson creation and `review_events` are reused; there is no parallel custom-vocabulary scheduler.
- PostgreSQL/Redis integration coverage proves ownership isolation, public non-disclosure, duplicate handling, due/lesson/review participation and deletion safety.
- PR #486 final head `961af65b1236aae3a31903082ec83de915f20d6e` squash-merged as `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Phase 2 intentionally added no frontend/Figma custom-vocabulary UI and no custom phrases.

### Phase 3 — Issue #489: bounded authenticated glossary portability

- `backend/internal/words/custom_glossary.go`, `custom_glossary_repository.go` and `custom_glossary_http.go` own authenticated version-1 glossary export/import.
- Export is deterministic, owner-only, content-only and `Cache-Control: no-store`; scheduler identity/state/history are not exported.
- Import accepts a bounded JSON glossary, reuses Phase 2 normalization, rejects intra-payload/existing-owner duplicates and writes the complete batch in one PostgreSQL transaction.
- Any failure rolls back every imported word and scheduler enrollment.
- Export -> delete -> import preserves portable content but intentionally creates fresh IDs and fresh `user_words` scheduler defaults.
- Integration coverage proves ownership, deterministic export, scheduler enrollment, duplicate rollback, round trip, 100-item ceiling and 256 KiB body ceiling.
- OpenAPI `0.17.0` documents the authenticated portability endpoints and closed schemas.
- PR #494 final head `00d1ea6ea22194a1a0de23fdaa130690ec74a69a` squash-merged as `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Phase 3 intentionally added no frontend/Figma glossary controls, custom phrases or scheduler changes.

### Phase 4 — Issue #497: local pronunciation recorder platform

- `frontend/lib/pronunciation-recorder.ts` owns explicit permission-gated local recording.
- One bounded recorder lifecycle owns one in-memory clip with deterministic stop/cancel/error/dispose cleanup.
- Media tracks and owned object URLs are released deterministically, including late permission resolution after cancellation/disposal.
- Recording is local and ephemeral: no upload, backend provider, IndexedDB/localStorage persistence or other storage side channel was introduced.
- Existing speech playback remains a separate owner.
- Blocking Chromium/WebKit platform coverage executes the recorder source while faking only media-hardware boundaries.
- PR #498 final head `001ca1f275fa2ed0b2fbcdcfb445d4275cf75b06` squash-merged as `810fa59a748477f8723a19dee03e61517282df30`.
- Phase 4 intentionally added no microphone button, permission-education UI, recorded-clip playback UI, pronunciation scoring or cloud persistence.

## Issue #18 / #201 gate

- Server-owned adaptive ranking, persisted selection reasons and diagnostic onboarding backend states remain delivered foundations for Issue #18.
- Issue #18 remains open because the first-use product flow is not complete.
- Issue #201 owns the visual First Use/onboarding production slice and remains gated on complete canonical Figma node coverage for required mobile/desktop, Light/Dark and diagnostic/system states.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Parent #25 remains open after four delivered phases.
- Backend acceptance for custom-word ownership, validation/duplicates, scheduler participation, safe deletion and bounded glossary import/export is already implemented and integration-tested; future work must not recreate those owners.
- Listening persistence is implemented; the recorder lifecycle is implemented but remains headless from a product UI perspective.
- No completed frontend custom-vocabulary/glossary workflow is claimed.
- The remaining #25 work is user-facing presentation/integration of already-delivered capabilities, constrained by verified production design evidence and accessibility/browser acceptance.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are canonical reset templates after PR #499.
- No next product task is pre-owned by the Agent Harness.

## Remaining roadmap

- #25: audit canonical design/source evidence for pronunciation and custom-vocabulary presentation, then create one atomic child slice for the first verified reachable UI gap. Preserve existing backend scheduler/ownership and speech owners.
- #201/#18: complete missing canonical design states, then implement the approved First Use flow.
- #78: remaining CSP enforcement promotion is manual/authorized production work.
- #68: implementation can be a separate PWA slice; real-device install/cold-start acceptance remains manual.
- #65/#461: automated implementation evidence and physical-device sign-off remain separate.
- Open Dependabot PRs are maintenance work, not implicit ownership of the next product slice.

## Evidence correction

- Issue #485 / PR #486 delivered authenticated account-owned backend custom vocabulary, not browser-local custom vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary import/export, not browser-local JSON/CSV codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
- This correction is Agent-Docs-only; it changes repository memory, not runtime behavior.
