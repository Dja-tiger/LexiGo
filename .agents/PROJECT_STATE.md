# LexiGo Project State

## Verification

- Last verified: 2026-08-23 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live GitHub and live source are authoritative for branch heads, open work, ownership, review state, CI and deployment state.
- This file is the current operational snapshot. Detailed historical delivery evidence remains preserved in Git history and the linked Issues/PRs.

## Latest completed runtime delivery

- Parent Issue #651 / PR #662 delivered Stage 2 of the learning-process separation architecture: explicit Study/Review/Remediation backend queue selectors while preserving omitted `sessionKind` as the legacy staged-rollout path.
- Final PR head: `6e84b10e939848bf9bf22ff14756ea2dd3c27866`; immutable-head PR CI #4001 / run `32598503787`: **success** across backend unit/security/integration, frontend core, browser/visual/accessibility/performance/service-worker gates and API/web container builds.
- Review audit before merge: no review submissions, no unresolved review threads and no PR comments; PR was mergeable against unchanged base `02001d365eb557efa48fa0ecb5f4289b7cb61456`.
- PR #662 squash merge: `32b79cd8e9937305efb6b22f54ea6801d33cb988`. Parent Issue #651 remains open because process-aware preview/Home rollout, deterministic cross-process ownership refinement, bounded workload controls and later recommendation/history work are intentionally outside Stage 2.
- Exact-main CI #4002 / run `32602099045`: **success** on `32b79cd8e9937305efb6b22f54ea6801d33cb988`, including backend integration/unit/security, frontend/browser/visual/accessibility/performance gates and API/web image publication.
- Exact CI scope artifact `ci-scope-32b79cd8e9937305efb6b22f54ea6801d33cb988` reports `agent_docs_only=false`, base SHA `02001d365eb557efa48fa0ecb5f4289b7cb61456`, and exact head SHA `32b79cd8e9937305efb6b22f54ea6801d33cb988`.
- Deploy Stage run `32602630875`: **success** on exact image SHA `32b79cd8e9937305efb6b22f54ea6801d33cb988`.
- Stage deployment, public frontend/API smoke and public browser verification all passed; public Chromium + iOS WebKit runtime suite passed 12/12.

## Issue #651 Stage 2 contract now delivered

- Explicit `sessionKind=study` selects only `status = new` candidates.
- Explicit `sessionKind=review` selects only non-new candidates that are due now, including relearning-due/overdue states, and never pads the block with future `scheduled-not-due` items.
- Explicit `sessionKind=remediation` requires persisted weakness/error evidence and may pull a not-due item only because remediation was explicitly requested.
- Repeated `again` / `almost` signals are derived from persisted learner self-rating (`review_events.rating`), while objective failure remains a separate signal based on correctness/effective scheduler evidence.
- Durable process-specific primary reasons include `relearning_due`, `repeated_again`, `recent_failure`, `overdue`, `due`, `repeated_almost`, `weak_topic`, and `new`; manual `wordIds` remain caller-owned with durable `manual` reason.
- Explicit completed-block exclusion is session-kind scoped; omitted `sessionKind` retains the legacy composer and completed-block behavior for staged backward compatibility.
- Scheduler mutation, interval/easiness/repetition formulas and manual `/learn` composition behavior remain unchanged.
- Real PostgreSQL integration and unit regressions protect strict Review no-fill semantics, explicit queue boundaries, reason persistence, self-rating/objective-signal separation and legacy compatibility.
- `POST /api/v1/lessons/preview` and authenticated Home intentionally remain on the legacy public process contract after this stage; they must move atomically so process counts, recommendation copy and actual lesson creation cannot disagree.

## Delivery lessons retained from #651 Stage 2

- Self-rating and objective correctness are different signals. Repeated `again` / `almost` recommendations must use the learner's stored rating rather than `effective_rating`, which can be overridden by objective answer correctness.
- A staged additive `sessionKind` contract is only safe when omission remains behaviorally distinguishable from explicit `study`; legacy callers must not silently enter new queue semantics.
- Review no-fill is a hard invariant and must be proven against real PostgreSQL data containing future-scheduled candidates, not only against in-memory ranking helpers.
- Explicit remediation may intentionally pull a not-due weak/error item, but that permission must stay scoped to remediation and never leak into Review.
- Process-aware preview, Home recommendation/counts and Home lesson creation must be rolled out together against the same selector source of truth; exposing only one layer would recreate semantic drift.
- Stage 2 does not yet prove mutually exclusive automatic ownership for a candidate that is both due and weak/error-signaled; that deterministic cross-process ownership refinement remains for the next vertical rollout slice.

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
- #651: Stage 1 session-intent contract (#656) and Stage 2 explicit backend queue selectors (#662) are delivered; process-aware preview/Home rollout, deterministic cross-process ownership, bounded automatic/manual workload and later recommendation/history UX remain open in the parent task.

## Delivery contract

- One PR contains one atomic product/tooling/reconciliation slice.
- Product changes require immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changes.
- Pure Agent Docs reconciliation uses the fail-closed lightweight classifier and must not trigger a runtime Stage deployment.
- Design changes use OpenPencil production identities and repository-owned mapping; historical Figma provenance is reference-only.
- Controlled same-head reruns may classify proven infrastructure/browser flakes; product code is not changed without a reproduced product defect.
- Evidence-only audits do not silently redesign runtime. Reproduced runtime defects receive separate atomic Issues/PRs.

## Next selection rule

After `.agents/current/**` is reset by the reconciliation PR, choose the next atomic slice from live GitHub and source evidence. Prefer automated engineering work over manual-only gates, but do not manufacture UI/design requirements where the active OpenPencil source has no approved state.
