# LexiGo Project State

## Verification

- Last verified: 2026-08-21 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live GitHub and live source are authoritative for branch heads, open work, ownership, review state, CI and deployment state.
- This file is the current operational snapshot. Detailed historical delivery evidence remains preserved in Git history and the linked Issues/PRs.

## Latest completed runtime delivery

- Issue #638 / PR #639 delivered owner-scoped private custom phrases as Phase 5 of parent #25.
- Final developer-authored PR head: `89cff7136c467d6644b3e2168ca47fe78fbc5971`.
- Immutable-head PR CI #3942 / run `32458596329`: **success** across backend unit/security, PostgreSQL integration with race detector, frontend core, both UI shards, Lesson completion, Visual regression, accessibility, performance, CSP/service-worker checks and API/web container builds.
- Review audit before merge: no review submissions, no unresolved review threads and no PR comments; PR was mergeable and branch was not behind `main`.
- PR #639 squash merge: `1235d45235aa81d34fccf084c52676b509a60794`; Issue #638 closed completed automatically.
- Exact-main CI run `32459891269`: **success** on `1235d45235aa81d34fccf084c52676b509a60794`, including backend integration/unit/security, frontend/browser/visual/accessibility/performance gates and API/web image publication.
- Deploy Stage run `32460782804`: **success** on exact image SHA `1235d45235aa81d34fccf084c52676b509a60794`.
- Stage deployment, public frontend/API smoke and public browser verification all passed; public Chromium + iOS WebKit runtime suite passed 12/12.

## Issue #638 runtime contract now delivered

- Private phrases remain the existing `words(kind='phrase')` entity and reuse the existing `user_words`, lesson and review scheduler path; no second SRS exists.
- Owner-scoped private vocabulary is restricted to `source='user-custom-v1'` and supports both custom words and custom phrases.
- Custom phrase creation normalizes and bounds learner-owned fields, while `kind`, `partOfSpeech`, owner identity and slug remain server-owned.
- Private phrase slugs are generated from cryptographic randomness and remain globally unique so they cannot shadow shared or another account's phrase detail route.
- Phrase creation and exactly one scheduler enrollment are atomic.
- Same-owner normalized duplicates are rejected; equivalent content across different accounts remains legal and isolated.
- Public catalog projections exclude owner content; another authenticated account cannot resolve or delete another owner's private phrase.
- Owner-safe deletion discards a containing active lesson before existing FK cascade cleanup of scheduler/review/lesson references.
- Existing custom-word create/delete and `lexigo-custom-glossary-v1` word import/export behavior remain compatible.
- OpenAPI is now `0.18.0` and documents the additive custom-phrase endpoints and phrase fields.

## Delivery lessons retained from #638

- Full OpenAPI edits must preserve the complete YAML document and be followed by structural parsing plus dependent contract audit.
- A shared OpenAPI consumer test was correctly updated only for the additive API version and the newly valid `cloze` / `clozeAnswer` validation fields; glossary runtime semantics were not generalized.
- First PR CI exposed only one `gofmt` failure in `integration/custom_phrases_test.go`; it was fixed without behavior changes.
- The next integration failure was a test-fixture assumption (`select shared phrase: no rows in result set`), not a production defect. The test now creates its own explicit shared owner-null phrase fixture before proving custom-delete isolation.
- Real PostgreSQL integration is the authority for migration, owner isolation, duplicate semantics, scheduler participation and deletion boundaries.

## Design source of truth

- Active production design/handoff source: repository-owned OpenPencil.
- Active document: `design/openpencil/LexiGo Design System.op`.
- Active tokens: `design/openpencil/LexiGo Design Tokens.json`.
- Route/state mapping: `docs/figma/openpencil-screen-map.json` plus `docs/figma/openpencil-production-handoff.json`.
- Issue #203 / PR #636 is closed completed; PR #636 merge SHA is `96e4f99f853a6ae4124fb6367fd4e968e941447e`.
- PR #636 made OpenPencil the explicit active production handoff source and retained Figma identifiers only as archival provenance.
- Figma Cloud/MCP/fileKey access is not a prerequisite for new production work.

## Production ownership foundations

- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route-entry selection.
- Guest `/` is owned by `LexigoGuestHomeApp`; authenticated `/` is owned by `LexigoHomeApp`.
- `LexigoOnboardingApp` owns `/onboarding`.
- `LexigoLearnApp` owns `/learn`; `LexigoActiveLessonApp` owns `/lesson/active`.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`.
- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `LexigoProgressApp` owns `/progress`; `LexigoProfileApp` owns authenticated Profile.
- `LexigoScenarioCatalogApp` / `LexigoScenarioApp` own scenario routes.
- `RouteChrome` owns ordinary primary route navigation outside focused routes.
- `ReviewOutboxRuntime` owns durable review queue/connectivity behavior.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.

## Issue #25 — delivered foundations and remaining gap

Delivered child foundations:

- #481 / #482: `listening` persists as a distinct objective answer/study mode; typed recall remains `recall`.
- #485 / #486: private custom words with owner isolation and existing scheduler enrollment.
- #489 / #493 / #494 / #495: bounded, verifiable custom-word glossary import/export.
- #497 / #498: optional local pronunciation recorder platform foundation; microphone access is explicit and recordings are not uploaded/persisted.
- #638 / #639: private custom phrases with owner isolation and existing scheduler enrollment.

Parent #25 remains open. Current source audit proves the remaining product gap is user-facing presentation/integration rather than another backend scheduler:

- backend/OpenAPI/integration support `studyMode=listening`, but the frontend does not currently select a listening study mode;
- the pronunciation recorder exists as a platform library/tests/privacy contract but is not mounted by a product screen;
- custom vocabulary create/import/export APIs are not currently exposed through a verified user-facing custom-vocabulary surface;
- do not invent these UI surfaces without canonical OpenPencil evidence.

## Visual parity / route evidence

Delivered major route/parity foundations include:

- route-specific parity for Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Profile and First Use;
- consolidated tablet `768×1024` Light/Dark audit (#568/#570);
- compact transition/runtime ownership repair (#577/#579);
- consolidated desktop `1440×1024` Light/Dark audit (#581/#582);
- exact renderer stabilization for Dictionary Empty (#584/#585);
- direct-entry/reload/real Back-Forward matrix across canonical routes (#617/#618).

Umbrella #205 remains open. Do not repeat already delivered tablet/desktop/transition/history work. Remaining acceptance must be selected from genuinely unproven dimensions such as minimum supported mobile width, missing 200% text zoom/reflow, keyboard/reduced-motion coverage, applicable system states and final consolidated evidence.

## Other open release/validation work

- #18: parent personalization/onboarding acceptance requires a separate live audit before any closure decision.
- #25: remaining user-facing listening/pronunciation/custom-vocabulary presentation is design-gated as described above.
- #65 / #461: physical-device/system reduced-motion and accessibility sign-off remains manual QA.
- #78: production CSP/security-header enforcement still requires authorized staged production promotion; stage Report-Only evidence alone is not completion.
- #133: moderated usability validation requires real sessions and is not replaceable by browser automation.
- #205: final consolidated OpenPencil visual parity umbrella remains open.
- #508: physical installed-PWA icon/splash/cold-start matrix remains manual QA.

## Delivery contract

- One PR contains one atomic product/tooling/reconciliation slice.
- Product changes require immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changes.
- Pure Agent Docs reconciliation uses the fail-closed lightweight classifier and must not trigger a runtime Stage deployment.
- Design changes use OpenPencil production identities and repository-owned mapping; historical Figma provenance is reference-only.
- Controlled same-head reruns may classify proven infrastructure/browser flakes; product code is not changed without a reproduced product defect.
- Evidence-only audits do not silently redesign runtime. Reproduced runtime defects receive separate atomic Issues/PRs.

## Next selection rule

After `.agents/current/**` is reset by the reconciliation PR, choose the next atomic slice from live GitHub and source evidence. Prefer automated engineering work over manual-only gates, but do not manufacture UI/design requirements where the active OpenPencil source has no approved state.
