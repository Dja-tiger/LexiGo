# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `f902389f9aa3ef15e0691fa6493e46ff24b123c1` after PR #523.
- Latest deployed runtime/Stage SHA: `f902389f9aa3ef15e0691fa6493e46ff24b123c1`.
- PR #523 final head was `8f7dd47de08fefcbc08b59aceb58ecd6b90a9704`; CI #3519 (`31842957833`) completed successfully on that immutable head after one controlled same-SHA rerun of an unrelated unchanged Lesson completion job. No source tree or baseline changed for the retry.
- PR #523 squash merge SHA is `f902389f9aa3ef15e0691fa6493e46ff24b123c1`.
- Exact-main CI #3520 (`31848941939`) completed successfully for that exact merge SHA across backend, frontend core, browser UI shards, visual, accessibility, performance, security, PWA and both container builds. Lesson completion passed on exact-main without retry.
- Stage run #3367 (`31849545822`) completed successfully for the same exact SHA; deployment, public endpoint verification and public Stage UI verification passed.
- Issue #522 is closed as completed. The executable Home parity contract is anchored to Figma mobile Dark `196:223` and desktop Light `194:249`; opposite appearances use the same geometry with semantic tokens.
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
- `RouteChrome` remains the sole owner of primary route navigation.
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
- Progress executable parity is delivered by #515/PR #517: mobile Light `76:6`, mobile Dark `76:53`, desktop geometry `76:154` plus semantic Dark tokens.
- Dictionary Empty Light `79:93` visual determinism is resolved by #518/PR #520.
- The next executable #205 child is `/learn` Lesson Composer using canonical nodes `202:6` recommended/collapsed mobile, `203:5` mobile manual settings and `204:2` desktop full composer. Light/Dark share the same composer ownership and geometry.

## Learn parity preflight

- Existing `adaptive-lesson-composer.spec.ts` already owns mobile progressive-disclosure interactions, selected lesson payload, desktop two-column composer behavior and reduced-motion behavior.
- Existing `learn-browser-zoom.spec.ts` owns real 200% browser zoom/reflow evidence; touch-target coverage also has separate owners.
- A new `/learn` parity child must therefore remain narrow: canonical node traceability, Light/Dark appearance, route-island/shell geometry, compact mobile navigation vs desktop rail, no horizontal overflow and deterministic reload behavior.
- Mobile collapsed state maps to `202:6`; mobile expanded/manual state maps to `203:5`; desktop full composer maps to `204:2`.
- Manual-expanded React state is not persisted across reload; do not invent persistence. If reload is tested after manual expansion, the expected canonical state is collapsed again.
- Prefer test-only evidence first. Do not change production React/CSS unless the executable audit proves a concrete product defect.

## Issue #201 design gate

- Existing Mobile / Onboarding / Light node `79:46` is known.
- Canonical Guest Home mobile/desktop, onboarding desktop, diagnostic pre/post-reveal, skip/completion/recovery and complete Light/Dark coverage remain design-gated.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Issue #522 Home parity is complete through PR #523, immutable-head CI #3519, exact-main CI #3520 and Stage #3367.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are reset to canonical templates before the next product/QA slice.
- The next executable Figma-related product/QA work is an atomic `/learn` Lesson Composer parity child under #205 using nodes `202:6`, `203:5` and `204:2`.
- Issue #203 remains temporarily blocked on live Figma MCP access; repository-side handoff is already present from PR #501.
- Issue #201 remains design-gated and must not be implemented from incomplete evidence.
- Issue #78 remains the independent CSP/security-hardening workstream.
- User priority remains Figma-related product/parity work.

## Remaining roadmap

- #205: continue route-by-route Figma parity. Next: `/learn` Lesson Composer canonical parity without duplicating existing zoom/reduced-motion/touch/interaction owners or turning QA into a hidden redesign.
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
