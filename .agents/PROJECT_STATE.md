# LexiGo Project State

## Verification

- Last verified: 2026-08-24 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live GitHub and live source are authoritative for branch heads, open work, ownership, review state, CI and deployment state.
- This file is the current operational snapshot. Detailed historical delivery evidence remains preserved in Git history and the linked Issues/PRs.

## Latest completed runtime delivery

- Parent Issue #651 / PR #666 delivered Stage 4 of the learning-process separation architecture: the manual `/learn` workload is now bounded and explicit while the Stage 3 automatic Study/Review/Remediation ownership model remains unchanged.
- Final PR head: `3bd2f6fda9f2bdb9a39a11af17ee30615b10226f`; exact-head PR CI #4084 / run `32670204561`: **success** across backend unit/security/integration, OpenAPI, frontend core, both UI shards, lesson completion, accessibility, visual, performance, CSP/service-worker, iOS PWA, Dictionary smoke and API/web container builds.
- Review audit before merge: zero PR comments, zero submitted reviews and zero unresolved review threads; final compare was `behind_by=0` with exactly 22 intended Stage 4 files and zero `.github/workflows/**` diff.
- PR #666 squash merge: `87455e7154178e7986fdebccebabe12f89c4e159`. Parent Issue #651 remains open because recommendation/history/scheduler evolution and any other still-unmet acceptance criteria are intentionally outside Stage 4.
- Exact-main CI #4085 / run `32672927534`: **success** on `87455e7154178e7986fdebccebabe12f89c4e159`, including backend unit/security/integration, frontend/browser/visual/accessibility/performance gates and API/web image publication.
- Exact CI scope artifact `ci-scope-87455e7154178e7986fdebccebabe12f89c4e159` / artifact `9501864948`, digest `sha256:9f7bc6fb0d06d9e32bb4740fc8e6a22ea2dae6b50ac2f6481e75d5ccb82d0ee2`, reports `agent_docs_only=false`, base SHA `5196a4b2824820bb3c5105d03112929d9a495da1`, and exact head SHA `87455e7154178e7986fdebccebabe12f89c4e159`.
- Deploy Stage run `32673520649`: **success** on exact image SHA `87455e7154178e7986fdebccebabe12f89c4e159`; exact-scope resolution and deploy jobs both passed.
- Stage deployment, public frontend/API smoke and public browser verification all passed; public Chromium + iOS WebKit runtime suite passed 12/12.

## Issue #651 Stage 3 contract now delivered

- Stage 1 / PR #656 introduced the optional durable `sessionKind = study | review | remediation` lesson-session intent contract without fabricating intent for legacy callers.
- Stage 2 / PR #662 made explicit session kinds real backend selection boundaries: Study owns new candidates, Review owns due non-new candidates without future-scheduled fill, and Remediation uses persisted weakness/error evidence; self-rating `again` / `almost` remains distinct from objective correctness/effective scheduler evidence.
- Stage 3 / PR #664 makes automatic ownership mutually exclusive: a due candidate remains Review-owned even when it also has weakness/error evidence; automatic Remediation is restricted to not-due non-new candidates with persisted weakness/error evidence.
- `POST /api/v1/lessons/preview` accepts optional explicit `sessionKind`, validates the same vocabulary as creation and echoes explicit intent; omission retains the legacy manual-composer preview contract.
- Authenticated Home loads independent Study, Review and Remediation previews and derives truthful process backlog from `composition.availableWords + composition.availablePhrases`, rather than generic `progress.dueNow`.
- Automatic Home blocks are bounded to 15 items. A smaller process backlog creates a smaller block; no automatic process pads from another process population.
- Home recommendation priority is deterministic: active backend-owned lesson > Review > Remediation > Study > manual configuration fallback.
- Home keeps explicit secondary controls for each available automatic process, so Study and Remediation remain directly selectable when Review is the dominant recommendation.
- Home creation sends the exact selected `sessionKind`, compatible `studyMode` and `lessonSize: "15"`, keeping recommendation copy, backlog counts and created-session semantics aligned.
- Existing route ownership, active-lesson resume, PWA/session/history/connectivity boundaries, accessibility, reduced motion, 320/390/768/1440 responsive behavior and true 200% browser zoom remain protected by the full immutable-head matrix.
- Home-only visual evidence for the required process controls was reviewed from exact Linux CI #4032 / run `32635302334` at `77ca1ea56e23b058eeb2786524617797aaa18d47`; non-Home visual fingerprints were not refreshed.
- Scheduler interval/easiness/repetition formulas and manual `/learn` size choices remain unchanged by Stage 3.

## Issue #651 Stage 4 contract now delivered

- Manual `/learn` exposes exactly `15 / 30 / 50 / Все` and defaults to 15; legacy 60 is no longer a selectable or writable manual preset.
- Preview/create write vocabulary is exactly `15`, `30`, `50`, `all`; backend validation and OpenAPI reject `60` and arbitrary values with `invalid_lesson_size`.
- Explicit `all` uses the existing no-cap composer path only after validation. A deterministic 55-candidate regression proves `50` returns 50 while `all` returns all 55.
- `All` remains a user-only manual action. Automatic Home Study/Review/Remediation creation stays fixed at `lessonSize: "15"` and never sends `all`.
- Historical active lessons with persisted `lessonSize="60"` remain readable. The shared frontend read type and Active Lesson parser preserve that compatibility without reintroducing 60 into new writes.
- Newly created `50` and `all` sessions retain their exact size semantics through the `/learn` → `/lesson/active` handoff.
- The manual size control uses four equal responsive columns; the rejected three-column/four-option implementation was treated as a product defect rather than approved as a new visual baseline.
- Keyboard roving-radio behavior covers all four choices, and exact preview/create E2E proves the four request tokens.
- Reviewed `/learn` visual fingerprints were reconciled only from exact post-layout-repair Linux CI evidence. A later one-nibble Issue #603 hash mismatch was traced back to the original #4069 artifact and corrected as transcription, not blessed as renderer drift.
- Stage 4 does not change scheduler formulas, Study/Review/Remediation selector ownership, due/remediation eligibility, Home recommendation priority, database schema, `wordIds` limits, dependencies or persistent workflows.

## Delivery lessons retained from #651 Stage 2–4

- Self-rating and objective correctness are different signals. Repeated `again` / `almost` recommendations use persisted learner rating, while objective correctness/effective scheduler evidence remains a separate failure signal.
- A staged additive `sessionKind` contract is safe only while omission remains behaviorally distinguishable from explicit `study`; legacy callers must not silently enter new queue semantics.
- Review no-fill is a hard invariant and is protected against real PostgreSQL data containing future-scheduled candidates.
- Automatic cross-process ownership must be deterministic. Due + weak/error-signaled items remain Review-owned; automatic Remediation cannot compete for them.
- Process-aware preview, Home recommendation/counts and Home lesson creation must share the same selector source of truth; moving only one layer recreates semantic drift.
- Explicit Home preview fixtures must echo the requested `sessionKind`; request-count tests should prove resource ownership rather than preserve arbitrary hydration counts.
- Write vocabulary and persisted read compatibility are separate boundaries: removing an old value from new writes must not make already-created sessions unreadable.
- Visual fingerprints are acceptance evidence, not a substitute for fixing geometry. Correct runtime first, verify exact dimensions on Linux CI, then refresh only reviewed content-addressed fingerprints with exact provenance.
- When legitimate product copy can repeat, browser assertions must scope to the semantic owner/landmark rather than rely on global text uniqueness.
- Intentional Home visual changes require exact Linux provenance and path-bounded promotion; product-state evidence must not be mislabeled as renderer drift.

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
- #651: Stage 1 session-intent contract (#656), Stage 2 explicit backend queue selectors (#662), Stage 3 process-aware preview/Home rollout (#664) and Stage 4 bounded manual `/learn` workload (#666) are delivered. Remaining parent work must be selected from still-unmet acceptance criteria such as later recommendation/history/scheduler evolution; do not repeat delivered queue ownership, Home process rollout or manual workload controls.

## Delivery contract

- One PR contains one atomic product/tooling/reconciliation slice.
- Product changes require immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changes.
- Pure Agent Docs reconciliation uses the fail-closed lightweight classifier and must not trigger a runtime Stage deployment.
- Design changes use OpenPencil production identities and repository-owned mapping; historical Figma provenance is reference-only.
- Controlled same-head reruns may classify proven infrastructure/browser flakes; product code is not changed without a reproduced product defect.
- Evidence-only audits do not silently redesign runtime. Reproduced runtime defects receive separate atomic Issues/PRs.

## Next selection rule

After `.agents/current/**` is reset by the reconciliation PR, choose the next atomic slice from live GitHub and source evidence. Prefer automated engineering work over manual-only gates, but do not manufacture UI/design requirements where the active OpenPencil source has no approved state.
