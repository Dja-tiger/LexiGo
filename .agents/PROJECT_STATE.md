# LexiGo Project State

## Verification

- Last verified: 2026-08-22 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live GitHub and live source are authoritative for branch heads, open work, ownership, review state, CI and deployment state.
- This file is the current operational snapshot. Detailed historical delivery evidence remains preserved in Git history and the linked Issues/PRs.

## Latest completed runtime delivery

- Parent Issue #651 / PR #656 delivered Stage 1 of the learning-process separation architecture: an additive lesson-session intent contract without changing current candidate-selection or scheduler behavior.
- Final PR head: `4df21dfd25611d9b16f0e0599dc52a906eece5a5`; immutable-head PR CI #3979 / run `32563683185`: **success** across backend unit/security/integration, frontend core, browser/visual/accessibility/performance/service-worker gates and API/web container builds.
- Review audit before merge: no review submissions, no unresolved review threads and no PR comments; PR was mergeable against unchanged base `0873e31e26522d5a855f0ec95925a4fa4d2497e3`.
- PR #656 squash merge: `68298977652d737ee267b4cfd5e1a978fb99828c`. Parent Issue #651 remains open because later queue-selector, workload and recommendation stages are intentionally out of this PR.
- Exact-main CI run `32579145833`: **success** on `68298977652d737ee267b4cfd5e1a978fb99828c`, including backend integration/unit/security, frontend/browser/visual/accessibility/performance gates and API/web image publication.
- Exact CI scope artifact `ci-scope-68298977652d737ee267b4cfd5e1a978fb99828c` reports `agent_docs_only=false` and exact head SHA `68298977652d737ee267b4cfd5e1a978fb99828c`.
- Deploy Stage run `32579711137`: **success** on exact image SHA `68298977652d737ee267b4cfd5e1a978fb99828c`.
- Stage deployment, public frontend/API smoke and public browser verification all passed; public Chromium + iOS WebKit runtime suite passed 12/12.

## Issue #651 Stage 1 contract now delivered

- `sessionKind = study | review | remediation` is a distinct session-intent axis describing why a lesson exists; it remains orthogonal to `studyMode` / `answerMode`, which describe how an exercise is answered.
- `sessionKind` is optional for backward compatibility. Legacy/omitted intent remains SQL `NULL` and omitted from JSON; it is never fabricated as `study`.
- Explicit session intent persists in `lesson_sessions.session_kind` and participates in recent-active dedupe identity via null-safe comparison so different intents cannot alias one lesson.
- Durable selection reasons now include `overdue`, `relearning_due`, `repeated_again` and `repeated_almost` while retaining the pre-existing reasons, including `scheduled`.
- PostgreSQL constraints, backend HTTP/domain/persistence contracts, OpenAPI, frontend shared types/runtime validation and human-readable reason labels are synchronized.
- Unit, integration and full-file OpenAPI contract regressions protect explicit round-trip behavior, invalid-value rejection, legacy omission semantics and expanded selection reasons.
- This stage deliberately does not split Study/Review/Remediation candidate selectors, does not change review-ratio/due-priority behavior, and does not change scheduler intervals/easiness/repetitions.

## Delivery lessons retained from #651 Stage 1

- Additive shared enums must be traced through compiler-enforced exhaustive consumers, not only their primary API/type declarations.
- CI #3977 exposed `frontend/lib/interface-copy.ts` as an exhaustive `LessonSelectionReason` consumer; adding the four required labels fixed the contract dependency without widening product behavior.
- Legacy intent must remain distinguishable from explicit `study`; defaulting omitted data would corrupt future analytics and staged queue semantics.
- Session intent belongs in active-session dedupe identity because a lesson created for one pedagogical process must not be reused for another.
- Cross-layer contract changes require real PostgreSQL integration plus OpenAPI/frontend runtime validation in the same atomic slice.

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
- #651: Stage 1 session-intent contract is delivered by #656; independent Study/Review/Remediation queue selection, bounded workload and recommendation UX remain open in the parent task.

## Delivery contract

- One PR contains one atomic product/tooling/reconciliation slice.
- Product changes require immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changes.
- Pure Agent Docs reconciliation uses the fail-closed lightweight classifier and must not trigger a runtime Stage deployment.
- Design changes use OpenPencil production identities and repository-owned mapping; historical Figma provenance is reference-only.
- Controlled same-head reruns may classify proven infrastructure/browser flakes; product code is not changed without a reproduced product defect.
- Evidence-only audits do not silently redesign runtime. Reproduced runtime defects receive separate atomic Issues/PRs.

## Next selection rule

After `.agents/current/**` is reset by the reconciliation PR, choose the next atomic slice from live GitHub and source evidence. Prefer automated engineering work over manual-only gates, but do not manufacture UI/design requirements where the active OpenPencil source has no approved state.
