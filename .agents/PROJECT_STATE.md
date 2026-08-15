# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `f908955e7f7f6ec5650ef7d2df44230c63dd0eb9` after PR #526.
- Latest deployed runtime/Stage SHA: `f908955e7f7f6ec5650ef7d2df44230c63dd0eb9`.
- PR #526 final head was `7adff0c62718b38e38444c6bf5e7061c1bd115fe`; immutable-head CI #3528 (`31851403857`) completed successfully.
- PR #526 squash merge SHA is `f908955e7f7f6ec5650ef7d2df44230c63dd0eb9`.
- Exact-main CI #3529 (`31852418687`) completed successfully for that exact merge SHA across backend, frontend core, browser UI shards, Lesson completion, visual, accessibility, performance, security, PWA and both container builds.
- Stage run #3376 (`31852943046`) completed successfully for the same exact SHA; deployment, public endpoint verification and public Stage UI verification passed.
- Issue #525 is closed as completed. The executable Learn Composer parity contract is anchored to Figma nodes `202:6` recommended/collapsed mobile, `203:5` mobile manual settings and `204:2` desktop full composer, with Light/Dark semantic appearance coverage and authoritative UI-shard collection.
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
- Live Figma inspection/editing is currently blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim Screen Map or canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation when Figma MCP access becomes available.
- Issue #205 remains the active umbrella for final route-by-route parity audit.
- Home parity is delivered by #522/PR #523: mobile Dark `196:223`, desktop Light `194:249`, semantic-token opposite appearances, route-shell/navigation ownership, no horizontal overflow and reload stability.
- Learn Composer parity is delivered by #525/PR #526: mobile recommended/collapsed `202:6`, mobile manual settings `203:5`, desktop full composer `204:2`, semantic Light/Dark coverage, route-island/navigation ownership, no horizontal overflow and canonical reload semantics.
- Progress executable parity is delivered by #515/PR #517: mobile Light `76:6`, mobile Dark `76:53`, desktop geometry `76:154` plus semantic Dark tokens.
- Dictionary Empty Light `79:93` visual determinism is resolved by #518/PR #520.
- The next executable #205 child is `/lesson/active` Active Lesson using repository-approved nodes `75:6` Mobile / Recall / Default, `75:30` Mobile / Recall / Correct, `75:89` Mobile / Choice / Incorrect, `75:120` Desktop / Study / Light and `75:150` Desktop / Recall / Correct.
- Active Lesson offline node `75:57` remains owned by System States #202; Lesson Result nodes remain owned by #194; Scenario lesson nodes remain owned by #196. Do not fold those states into the Active Lesson parity child.

## Active Lesson parity preflight

- Existing `active-lesson-figma.spec.ts` already owns Active Lesson behavior, review submission, safe exit, direct entry/reload, Browser Back semantics, compact reflow evidence and semantic Dark/reduced-motion checks.
- Existing `active-lesson-browser-zoom.spec.ts` owns real 200% browser zoom/reflow evidence; touch/accessibility gates also have separate owners.
- The next Active Lesson parity child must therefore extend the existing Figma owner narrowly: exact canonical viewport/state traceability, Light/Dark appearance, route-island/focus-mode geometry, intentional absence of primary route navigation after lesson start, no horizontal overflow and exact Figma annotations.
- Canonical mobile parity viewport is `390x844`; canonical desktop parity viewport is `1440x1024`.
- The executable parity matrix must reach Recall Default (`75:6`), Recall Correct (`75:30`), Choice Incorrect (`75:89`), desktop Study (`75:120`) and desktop Recall Correct (`75:150`) without duplicating server-payload/history/zoom assertions.
- Prefer test-only evidence first. Do not change production React/CSS, visual hashes or Playwright global configuration unless the executable audit proves a concrete product defect.

## Issue #201 design gate

- Existing Mobile / Onboarding / Light node `79:46` is known.
- Canonical Guest Home mobile/desktop, onboarding desktop, diagnostic pre/post-reveal, skip/completion/recovery and complete Light/Dark coverage remain design-gated.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Issue #525 Learn Composer parity is complete through PR #526, immutable-head CI #3528, exact-main CI #3529 and Stage #3376.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are reset to canonical templates before the next product/QA slice.
- The next executable Figma-related product/QA work is an atomic `/lesson/active` Active Lesson parity child under #205 using nodes `75:6`, `75:30`, `75:89`, `75:120` and `75:150`.
- Issue #203 remains temporarily blocked on live Figma MCP access; repository-side handoff is already present from PR #501.
- Issue #201 remains design-gated and must not be implemented from incomplete evidence.
- Issue #78 remains the independent CSP/security-hardening workstream.
- User priority remains Figma-related product/parity work.

## Remaining roadmap

- #205: continue route-by-route Figma parity. Next: `/lesson/active` canonical state/viewport parity without duplicating existing behavior, review, history, real-zoom, reduced-motion, touch or accessibility owners and without turning QA into a hidden redesign.
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
