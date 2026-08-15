# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `8b0360cf8711e8bb39eb88953d66bc78cbdce1f5` after PR #532.
- Latest deployed runtime/Stage SHA: `8b0360cf8711e8bb39eb88953d66bc78cbdce1f5`.
- PR #532 final head was `9cf3bfa688ba6b8b6770f9a324aa5df9fca8f29b`.
- Immutable-head PR CI #3543 (`31883398708`) completed successfully on that exact final head after a developer-authored correction to the test contract. The first candidate head `2262c0b1bb546c1f016a7e4ca1bcd5a07d696b9f` failed UI shard 1 because the executable 1440px Dictionary runtime exposed `data-route-navigation="rail"`, not the inferred `header` owner. The fix changed only the Dictionary parity expectation and task metadata; production React/CSS, visual baselines, packages, workflows and backend remained unchanged.
- PR #532 squash merge SHA is `8b0360cf8711e8bb39eb88953d66bc78cbdce1f5`.
- Exact-main CI #3544 (`31883867449`) completed successfully for that exact merge SHA across backend, frontend core, both authoritative UI shards, Lesson completion, visual, accessibility, performance, security, PWA and both immutable container builds.
- Stage run #3393 (`31884298510`) completed successfully for the same exact SHA; fail-closed scope resolution, deployment, public endpoint verification and public Stage UI verification all passed.
- Issue #531 is closed as completed. The executable Dictionary parity contract is anchored to Figma nodes `78:54` and `78:193`, with Light/Dark semantic appearance coverage, exact `390x844` / `1440x1024` viewports, direct route ownership, observed `mobile` / `rail` RouteChrome ownership, horizontal containment and reload stability.
- Issue #528 Active Lesson parity remains complete through PR #529, exact-main CI #3536 and Stage #3385.
- Issue #525 Learn Composer parity remains complete through PR #526, exact-main CI #3529 and Stage #3376.
- Issue #522 Home parity remains complete through PR #523, exact-main CI #3520 and Stage #3367.
- Issue #518 Dictionary Empty visual determinism remains complete through PR #520, exact-main CI #3515 and Stage #3361; approved raw PNG SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Issue #515 Progress parity remains complete through PR #517, exact-main CI #3486 attempt 2 and Stage #3330.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require the repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage runtime.
- Physical-device or production-only acceptance remains manual when required by the Issue.
- A controlled CI retry may prove infrastructure/render nondeterminism only when the exact commit/tree and source/baseline state remain unchanged; retries must not normalize a flaky product or baseline.
- A failed executable parity assertion is not a baseline-refresh signal: first inspect authoritative browser artifacts and actual CSS/runtime ownership, then correct only the proven contract or product defect.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile and Scenario routes use dedicated route ownership boundaries.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- Word Detail remains a detail state inside the existing Dictionary client island rather than owning a second app island.
- `RouteChrome` remains the sole owner of primary route navigation outside Active Lesson focus mode.
- Active Lesson owns a focused lesson surface after lesson start and intentionally hides primary route navigation while focus mode is active.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad deletion requires route, bundle and browser evidence.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.
- Existing frontend speech playback remains the browser speech owner.

## Frontend/runtime status

- Production Next.js runtime is `16.3.0`; React/React DOM remain `19.2.8`.
- Playwright package/runtime is aligned at `1.62.1` across npm, CI, Stage validation, visual snapshots and frontend container testing.
- Frontend type tooling uses `@types/react 19.2.18` and `@types/react-dom 19.2.4`.
- `eslint-config-next` is `16.3.0`.
- Frontend container runtime Node `22.22.2` satisfies Playwright 1.62.1's Node >=20 requirement.
- Production Redis client remains `go-redis/v9 v9.22.0` with existing explicit timeout/pool configuration unchanged.

## PWA appearance status

- Canonical semantic appearance colors are Light `#f4f7f5` and Dark `#10211d`.
- Manifest/runtime/offline metadata and offline presentation use the canonical appearance contract.
- Install metadata uses dedicated `any`, `maskable` and `monochrome` icon assets.
- Native iOS/iPadOS, Android and desktop install surfaces remain manual acceptance under #508.

## Figma source-of-truth status

- Canonical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- Screen Map & Handoff canonical node: `82:3`.
- `frontend/docs/adaptive-knowledge-coach.md` is the repository-side canonical route → Figma node → Issue handoff delivered by PR #501.
- PR #488 preserves the audited 2026-08-13 offline source provenance in `docs/figma/`.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- The exact native `.fig` binary is still not stored in GitHub; Issue #487 remains open for binary-safe upload and SHA-256 verification.
- Live Figma inspection/editing was rechecked during the #205 parity sequence and remains blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim fresh Screen Map/canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation when Figma MCP access becomes available.
- Issue #205 remains the active umbrella for final route-by-route parity audit.
- Home parity is delivered by #522/PR #523: mobile Dark `196:223`, desktop Light `194:249`, semantic-token opposite appearances, route-shell/navigation ownership, no horizontal overflow and reload stability.
- Learn Composer parity is delivered by #525/PR #526: mobile recommended/collapsed `202:6`, mobile manual settings `203:5`, desktop full composer `204:2`, semantic Light/Dark coverage, route-island/navigation ownership, no horizontal overflow and canonical reload semantics.
- Active Lesson parity is delivered by #528/PR #529: mobile Recall Default `75:6`, Recall Correct `75:30`, Choice Incorrect `75:89`, desktop Study `75:120`, desktop Recall Correct `75:150`, semantic Light/Dark appearance, focus-mode ownership and no horizontal overflow.
- Active Lesson offline node `75:57` remains owned by System States #202; Lesson Result nodes remain owned by #194; Scenario lesson nodes remain owned by #196.
- Progress executable parity is delivered by #515/PR #517: mobile Light `76:6`, mobile Dark `76:53`, desktop geometry `76:154` plus semantic Dark tokens.
- Dictionary Empty Light `79:93` visual determinism is resolved by #518/PR #520.
- Dictionary canonical parity is delivered by #531/PR #532: mobile Light `78:54`, desktop Light `78:193`, semantic-token Dark counterparts, direct Dictionary island/main/catalog ownership, exact canonical viewports, no horizontal overflow and reload stability.
- Authoritative browser evidence for #531 corrected a stale inference: at the canonical 1440px Dictionary runtime the sole visible shared RouteChrome owner is `rail`, not `header`. Generic breakpoint CSS alone is insufficient evidence when downstream route/adaptive cascade participates.
- The next executable #205 child is Word Detail Issue #533 using repository-approved mobile Dark `78:99` and desktop Dark `78:274`; Light reuses the same approved hierarchy/geometry through semantic appearance tokens.

## Word Detail parity preflight

- Existing `frontend/e2e/word-detail-visual.spec.ts` is the authoritative collected owner through `playwright.visual.config.ts`; extend it instead of creating a competing parity/visual spec.
- Existing content-addressed Word Detail Light/Dark baselines, 200% text reflow, forced-colors and true browser-owned zoom remain separate evidence and must not be regenerated merely to satisfy #533.
- `frontend/e2e/word-detail-back-touch-targets.spec.ts`, `word-detail-related-phrase-touch-targets.spec.ts` and retry touch-target owners remain independent.
- Standalone `/words/[id]` remains inside `data-route-client-island="dictionary"`; there is no production `word-detail` app island.
- When detail state is active, `LexigoDictionaryApp` exposes `#lexigo-main-content[aria-label="Карточка слова"]`, `DictionaryCatalog` delegates to `WordDetailRoute`, and the primary detail surface is `.lx-word-detail`.
- The route-specific internal Dictionary `.lx-header` is hidden during Word Detail; shared `RouteChrome` remains an independent owner.
- Canonical parity viewports are mobile `390x844` and desktop `1440x1024`.
- Canonical semantic appearance colors remain Light `#f4f7f5` and Dark `#10211d`.
- Mobile Figma source is `78:99`; desktop Figma source is `78:274`. Dark is the explicit repository handoff; Light is the same approved composition through semantic Light tokens.
- The parity implementation should initialize explicit appearance through the existing `lexigo.appearance.v1` contract, add exact Playwright `figma` annotations, prove direct-entry detail ownership/key content/primary learning action, no document x-overflow, horizontal containment and deterministic reload.
- Do not assume a desktop RouteChrome variant from the generic breakpoint stylesheet. Measure the actually-visible `[data-route-navigation]` owner in the canonical runtime before encoding a fixed expectation.
- Prefer test-only evidence first. Do not change production React/CSS, screenshot hashes/tolerances, package collection, Playwright config, CI workflows, backend or dependencies unless executable audit proves a concrete defect.

## Issue #201 design gate

- Existing Mobile / Onboarding / Light node `79:46` is known.
- Canonical Guest Home mobile/desktop, onboarding desktop, diagnostic pre/post-reveal, skip/completion/recovery and complete Light/Dark coverage remain design-gated.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Issue #531 Dictionary parity is complete through PR #532, immutable-head CI #3543, exact-main CI #3544 and Stage #3393.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are reset to canonical templates by this reconciliation before the next product/QA branch.
- Issue #533 is the next executable Figma-related atomic child under #205: `/words/[id]` canonical parity using `78:99` and `78:274`, with semantic Light token coverage and existing Word Detail visual owner reuse.
- Issue #203 remains temporarily blocked on live Figma MCP access; repository-side handoff is already present from PR #501.
- Issue #201 remains design-gated and must not be implemented from incomplete evidence.
- Issue #78 remains the independent CSP/security-hardening workstream.
- User priority remains Figma-related product/parity work.

## Remaining roadmap

- #205 / #533: deliver Word Detail canonical mobile/desktop Dark/Light parity inside the existing `word-detail-visual.spec.ts` owner, without baseline refresh or hidden redesign.
- After Word Detail is completely delivered and Agent Docs reconciled, continue the repository-approved route map with `/phrases`, `/phrases/[slug]`, `/profile` and `/onboarding`, respecting each route's existing owners and design gates.
- #203: synchronize live Figma Screen Map/archive status when MCP access is available.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #487: upload the exact native `.fig` through a binary-safe GitHub path and verify SHA-256.
- #201/#18: complete canonical First Use design states, then implement the approved flow.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete the remaining CSP/security-header enforcement promotion through an authorized staged rollout.
- #65/#461: automated reduced-motion implementation evidence and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after the core routes and final visual parity are ready.

## Evidence correction

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
