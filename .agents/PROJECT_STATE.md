# LexiGo Project State

## Verification

- Last verified: 2026-08-16 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Current `main`: `13d51e97514b1b521d641028169c2a7b49f68890` after PR #556.
- Latest runtime-bearing `main`: `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f` after PR #543.
- Latest deployed runtime/Stage SHA: `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f`.
- PR #553 promoted the reviewed OpenPencil source/token pair and established OpenPencil as the active AI-native design owner.
- PR #555 delivered optional standalone OpenPencil Web/MCP self-host tooling; persistent VPS deployment is not required for AI design work.
- PR #556 / Issue #201 design gate: squash merge `13d51e97`; exact-main OpenPencil AI import, visual acceptance, self-host fallback check and full CI are green on that SHA.
- #553, #555 and #556 did not change production application runtime; Stage redeploy was not required.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage runtime.
- Design-source/tooling changes require deterministic source identities, immutable-head design acceptance, clean review audit and exact-main design validation; Stage is not required when application runtime is unchanged.
- A controlled same-head CI retry may help classify infrastructure/render nondeterminism, but a retry-success result must not be reported as deterministic when Playwright still records a flaky test.
- A failed executable parity assertion is not a baseline-refresh signal: inspect authoritative browser evidence and actual runtime/CSS ownership first.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile and Scenario routes use dedicated route ownership boundaries.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `LexigoHomeApp` owns `/` and currently renders both authenticated Home and the legacy guest Home state.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`; Word Detail is detail state inside that island rather than a second application island.
- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`, including direct entry, URL-backed catalog state and Learn handoff.
- `RouteChrome` remains the sole owner of primary route navigation outside Active Lesson focus mode.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad deletion requires route, bundle and browser evidence under Issue #70.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.

## AI-native design source-of-truth status

ZSeven OpenPencil v0.8.2 is the day-to-day AI-first design editor while native Figma remains archived provenance/reference.

### Active visual/editor source

- Path: `design/openpencil/LexiGo Design System.op`.
- Reviewed active SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.
- Reviewed active size: `6,937,300` bytes.
- 23 pages / 7,983 recursive design nodes / 92 runtime variables.
- Canonical imported and OpenPencil-native production mapping: `docs/figma/openpencil-screen-map.json`.
- `activeScreens` records the stable OpenPencil-native First Use roots added by Issue #201.

### Active lossless token/provenance source

- Path: `design/openpencil/LexiGo Design Tokens.json`.
- Accepted SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Accepted size: `82,487` bytes.
- Native inventory: 6 collections / 92 variables = 43 COLOR + 48 FLOAT + 1 STRING.
- 40 Figma alias references; 0 unresolved aliases; 0 incomplete mode values.
- ZSeven v0.8.2 cannot store variable-to-variable alias values, so runtime aliases compile to resolved values while the original alias graph remains authoritative in this sidecar.

### Immutable Figma archive/provenance

- Historical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- Historical Screen Map & Handoff node: `82:3`.
- Repository archive: `design/figma/LexiGo Design System.fig` via Git LFS.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- `frontend/docs/adaptive-knowledge-coach.md` remains repository-side route -> historical Figma node -> Issue provenance.
- `docs/figma/openpencil-ai-workflow.md` owns the promoted OpenPencil workflow/source hierarchy.
- Figma Cloud remains historical/reference input while retained, not the day-to-day editable owner after OpenPencil promotion.

### OpenPencil acceptance contract

- Primary editor/toolchain: `ZSeven-W/openpencil` v0.8.2.
- Immutable Figma/tokenized migration baseline SHA-256 remains `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`.
- Permanent `.github/workflows/openpencil-visual-acceptance.yml` now validates two independent invariants:
  1. archived `.fig` still regenerates the historical tokenized migration baseline and token sidecar deterministically;
  2. committed active `.op` matches the reviewed active SHA/size, mapped nodes, selected Linux renders, all 92 runtime variables and isolated editability.
- This separation preserves migration provenance without making normal OpenPencil-native design edits impossible.
- ZSeven v0.8.2 does not preserve imported node->variable bindings. Existing imported nodes keep concrete visual values; recovered tokens are available for AI/new/intentionally updated elements. Do not claim full Figma binding parity.

### CI-native operation

- GitHub Actions Linux runners are the default OpenPencil runtime for AI inspection, semantic mutation, rendering and acceptance.
- Persistent OpenPencil Web on a VPS is optional, not a prerequisite for design work.
- `deploy/openpencil/**` and `.github/workflows/openpencil-self-host-check.yml` remain an isolated fallback for authenticated Web + loopback-only MCP operation; normal LexiGo Stage/prod compose and product Caddy are unaffected.

## First Use / Issue #201 design contract delivered by PR #556

- Existing imported mobile onboarding Light remains `fig_4282` on `figma-page-17`.
- Forty canonical First Use states were added and registered under `activeScreens`, covering Guest Home, onboarding, diagnostic pre-reveal/reveal/resume, skip confirmation, completion, loading and error across mobile/desktop Light/Dark.
- Representative stable roots:
  - Guest Home Mobile Light `n2`;
  - Diagnostic pre-reveal Mobile Light `n21`;
  - Diagnostic reveal Mobile Light `n42`;
  - Diagnostic resume Mobile Light `n62`;
  - Skip confirm Mobile Light `n85`;
  - Complete Mobile Light `n105`;
  - Onboarding Desktop Light `n299`;
  - Guest Home Desktop Light `n321`;
  - Diagnostic resume Desktop Light `n378`;
  - Complete Desktop Dark `n599`;
  - Loading Desktop Dark `n614`.
- Diagnostic interaction semantics follow delivered backend #18: states `not_started / in_progress / completed / skipped`, self-mark `known / unsure / new` before reveal, maximum 12 items, resumable in-progress flow, skip does not claim scheduler mutation.
- Preview visual review found actual overlap defects before promotion; repaired preview was reviewed and only the repaired exact `.op` was promoted.
- PR #556 final head `6e67b01210feefb97ed8ddbb65e5efdcc8fdc7ea` passed OpenPencil AI import, visual acceptance, optional self-host smoke and full repository CI.
- Exact-main after squash merge `13d51e97514b1b521d641028169c2a7b49f68890` passed OpenPencil AI import, visual acceptance #30, self-host check #15 and CI #3635.

## Backend First Use foundation already delivered by #18

- `backend/internal/learning/onboarding.go` owns server-side onboarding state and diagnostic selection.
- `backend/internal/learning/onboarding_http.go` exposes authenticated status/start/mark/complete/skip operations.
- Diagnostic item limit is 12.
- Marking accepts only `known`, `unsure`, `new` and returns reveal data after the mark request succeeds.
- `OnboardingStatus` returns the current unanswered prompt for `in_progress` state, enabling reload/resume.
- Completion and skip are distinct server states.

## Figma/OpenPencil follow-up ownership

- Issue #203 remains optional historical live-Figma Screen Map/archive reconciliation if Figma access becomes available; repository/OpenPencil delivery does not depend on it.
- Issue #205 historical executable route-parity umbrella is delivered.
- System state visual gate (Dictionary Empty renderer-equivalent) is resolved by PR #546.
- Issue #554 persistent self-host deployment was closed `not planned` by owner decision; merged fallback tooling remains available.

## Completed executable #205 route parity

- Home: Issue #522 / PR #523.
- Learn Composer: Issue #525 / PR #526.
- Active Lesson: Issue #528 / PR #529.
- Progress: Issue #515 / PR #517.
- Dictionary: Issue #531 / PR #532.
- Word Detail: Issue #533 / PR #535.
- Phrases catalog: Issue #536 / PR #538.
- Phrase Detail: Issue #540 / PR #541 / merge `11ad10835ad968b41f5f53b01e97d22dab08a1e9`.
- Profile: Issue #542 / PR #543 / merge `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f` / exact-main CI #3578 / Stage `31911802944`.
- System States (Dictionary Empty renderer-equivalent): Issue #545 / PR #546 / merge `bf0036c1`.
- Native Figma binary: Issue #487 / PR #547 / merge `d23f7a82` / Git LFS verified.
- Deterministic ZSeven import: Issue #550 / PR #551 / merge `e7d992ad6089aa6445017ea6ffff6280787b05d8`.
- OpenPencil active source promotion: Issue #552 / PR #553.
- Optional standalone OpenPencil fallback: Issue #554 / PR #555.
- First Use design gate: Issue #201 / PR #556 / merge `13d51e97514b1b521d641028169c2a7b49f68890`.

Canonical appearance invariants remain Light `#f4f7f5` and Dark `#10211d`.

## Known Figma visual-gate follow-up

- Canonical Dictionary Empty Light remains historical Figma node `79:93` at `390x844` with primary approved SHA-256 `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Issue #545 / PR #546 scoped renderer-equivalent SHA-256 `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` as an accepted alternate fingerprint for `compact-empty-light` only.
- Both fingerprints differ by exactly three RGB pixels (max 1 LSB delta) on the antialiased edge of the calendar-reminder control, not Dictionary content.
- Two consecutive captures within one test attempt must still produce identical raw SHA; any unreviewed third raster continues to fail the visual gate.

## Current state

- Current `main` is `13d51e97514b1b521d641028169c2a7b49f68890`.
- Latest application runtime-bearing SHA and latest Stage deployment remain `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f`; design/tooling merges after it did not require Stage.
- OpenPencil is the active AI-native visual source and operates successfully in GitHub Actions without a persistent VPS.
- Issue #201 design gate is complete; Issue #201 itself remains open because its implementation acceptance criteria are not yet delivered.
- The next atomic product slice is Issue #201 runtime implementation: Guest Home, onboarding/diagnostic UI, server-state resume/recovery, skip/complete transitions, accessibility and mobile/desktop Light/Dark visual regression.

## Remaining roadmap

- #201: implement the approved First Use runtime against the existing #18 server contract, then run full product delivery including Stage/public validation because runtime will change.
- #203: optional historical live-Figma Screen Map/archive synchronization when access is available.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete remaining CSP/security-header enforcement through authorized staged rollout.
- #65/#461: reduced-motion and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after core routes and final visual parity are ready.

## Evidence corrections retained

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
