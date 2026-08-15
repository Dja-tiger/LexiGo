# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `bb9a90906f111201c40452a5e51f7bafe7478183` after PR #529.
- Latest deployed runtime/Stage SHA: `bb9a90906f111201c40452a5e51f7bafe7478183`.
- PR #529 final head was `d15f4925274222efd489b91e83bbd5fa8fcea0e4`.
- Immutable-head PR CI #3535 (`31853506173`) completed successfully on that exact head after controlled same-SHA reruns of UI shard 2 and Visual regression. No source tree or visual baseline changed for either retry.
- The Visual retry authenticated existing Dictionary Empty render nondeterminism for node `79:93`: the failed attempt produced alternate hash `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`, while the controlled rerun returned to approved hash `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`. All Active Lesson visual owners passed throughout.
- PR #529 squash merge SHA is `bb9a90906f111201c40452a5e51f7bafe7478183`.
- Exact-main CI #3536 (`31866883130`) completed successfully for that exact merge SHA across backend, frontend core, both UI shards, Lesson completion, visual, accessibility, performance, security, PWA and both container builds.
- Stage run #3385 (`31867280943`) completed successfully for the same exact SHA; deployment, public endpoint verification and public Stage UI verification passed.
- Issue #528 is closed as completed. The executable Active Lesson parity contract is anchored to Figma nodes `75:6`, `75:30`, `75:89`, `75:120` and `75:150`, with Light/Dark semantic appearance coverage and authoritative UI-shard collection.
- Issue #525 Learn Composer parity remains complete through PR #526, exact-main CI #3529 and Stage #3376.
- Issue #522 Home parity remains complete through PR #523, exact-main CI #3520 and Stage #3367.
- Issue #518 Dictionary Empty visual determinism remains complete through PR #520, exact-main CI #3515 and Stage #3361; approved raw PNG SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Issue #515 Progress parity remains complete through PR #517, exact-main CI #3486 attempt 2 and Stage #3330.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require the repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage.
- Physical-device or production-only acceptance remains manual when required by the Issue.
- A controlled CI retry may prove infrastructure/render nondeterminism only when the exact commit/tree and source/baseline state remain unchanged; retries must not normalize a flaky product or baseline.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile and Scenario routes use dedicated route islands.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
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
- Live Figma inspection/editing was rechecked during PR #529 delivery and remains blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim fresh Screen Map/canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation when Figma MCP access becomes available.
- Issue #205 remains the active umbrella for final route-by-route parity audit.
- Home parity is delivered by #522/PR #523: mobile Dark `196:223`, desktop Light `194:249`, semantic-token opposite appearances, route-shell/navigation ownership, no horizontal overflow and reload stability.
- Learn Composer parity is delivered by #525/PR #526: mobile recommended/collapsed `202:6`, mobile manual settings `203:5`, desktop full composer `204:2`, semantic Light/Dark coverage, route-island/navigation ownership, no horizontal overflow and canonical reload semantics.
- Active Lesson parity is delivered by #528/PR #529: mobile Recall Default `75:6`, Recall Correct `75:30`, Choice Incorrect `75:89`, desktop Study `75:120`, desktop Recall Correct `75:150`, semantic Light/Dark appearance, focus-mode ownership and no horizontal overflow.
- Active Lesson offline node `75:57` remains owned by System States #202; Lesson Result nodes remain owned by #194; Scenario lesson nodes remain owned by #196.
- Progress executable parity is delivered by #515/PR #517: mobile Light `76:6`, mobile Dark `76:53`, desktop geometry `76:154` plus semantic Dark tokens.
- Dictionary Empty Light `79:93` visual determinism is resolved by #518/PR #520.
- The next executable #205 child is `/dictionary` using repository-approved nodes `78:54` Mobile / Dictionary / Light and `78:193` Desktop / Dictionary / Light; Dark reuses the same approved geometry with semantic Dark tokens.

## Dictionary parity preflight

- Existing `frontend/e2e/dictionary-route-island.spec.ts` owns direct-entry route-island/session-bootstrap handoff and route-history semantics and is already selected by `test:e2e:ui` and `test:e2e:navigation`.
- Existing Dictionary search, catalog touch targets, pagination, iOS PWA behavior and Empty/Error/System States have separate owners. Word Detail is also a separate route owner.
- The next Dictionary parity child should extend the existing route-island owner narrowly rather than create a competing spec.
- Canonical parity viewports are mobile `390x844` and desktop `1440x1024`.
- At `390px`, shared `RouteChrome` exposes the `mobile` primary-navigation variant. At `1440px`, it exposes the `header` variant; the `rail` variant belongs to the intermediate 720–1099px range.
- Canonical Light canvas remains `#f4f7f5`; Dark remains `#10211d` through semantic appearance tokens.
- The executable parity contract should cover `78:54` mobile and `78:193` desktop in Light/Dark, direct route-island ownership, visible primary-navigation ownership, catalog/main horizontal containment, no document overflow, exact Figma annotations and deterministic reload.
- Do not duplicate auth refresh counts, route-history assertions, catalog search/filter/pagination semantics, PWA/touch/zoom/reduced-motion owners, Word Detail, Dictionary Empty `79:93`, or visual baseline hashes.
- Prefer test-only evidence first. Do not change production React/CSS, visual hashes, package collection or Playwright/CI configuration unless executable audit proves a concrete defect or missing collection.

## Issue #201 design gate

- Existing Mobile / Onboarding / Light node `79:46` is known.
- Canonical Guest Home mobile/desktop, onboarding desktop, diagnostic pre/post-reveal, skip/completion/recovery and complete Light/Dark coverage remain design-gated.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Issue #528 Active Lesson parity is complete through PR #529, immutable-head CI #3535, exact-main CI #3536 and Stage #3385.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are reset to canonical templates before the next product/QA slice.
- The next executable Figma-related product/QA work is an atomic `/dictionary` child under #205 using nodes `78:54` and `78:193`, with semantic Dark token coverage.
- Issue #203 remains temporarily blocked on live Figma MCP access; repository-side handoff is already present from PR #501.
- Issue #201 remains design-gated and must not be implemented from incomplete evidence.
- Issue #78 remains the independent CSP/security-hardening workstream.
- User priority remains Figma-related product/parity work.

## Remaining roadmap

- #205: continue route-by-route Figma parity. Next: `/dictionary` canonical mobile/desktop Light/Dark parity without duplicating existing history/session/catalog/PWA/touch/zoom/state owners and without turning QA into a hidden redesign.
- After Dictionary, continue the approved route map with `/words/[id]` only after the Dictionary child is completely delivered and Agent Docs reconciled.
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
