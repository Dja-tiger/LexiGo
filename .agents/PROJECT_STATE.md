# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `ec46b319d903b71708bc7f0d10aaa56a78ff14d6` after PR #520.
- Latest deployed runtime/Stage SHA: `ec46b319d903b71708bc7f0d10aaa56a78ff14d6`.
- PR #520 final head was `c951013984631b81723166f60603d5b30f80d6b4`; immutable-head CI #3514 (`31839910919`) completed successfully.
- PR #520 squash merge SHA is `ec46b319d903b71708bc7f0d10aaa56a78ff14d6`.
- Exact-main CI #3515 (`31841367634`) completed successfully for that exact merge SHA across the selected frontend/backend/browser/visual/accessibility/performance/security/PWA gates.
- Stage run #3361 (`31842102052`) completed successfully for the same exact SHA; deployment, public endpoint verification, public browser dependency installation and public Stage UI verification passed.
- Issue #518 is closed as completed. The Dictionary Empty Light visual gate remains anchored to Figma node `79:93` and approved raw PNG SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`; rejected alternate `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` was not promoted.
- #518 root cause was a capture race with deferred `CalendarReminderRouteEntry` settings hydration. The accepted test-owned fix waits for the reminder summary semantic `aria-label` sentinel before the existing layout/paint stabilization and exact SHA checks; product React/CSS, visual config, retries/tolerances and approved hashes were not changed.
- Verified code SHA for the #518 fix was `f3a3b551d718f7cadbdbf473afffb707da9bbfc6`; CI #3513 visual runs `94891172103` and `94893140048` both passed Dictionary `79:93` on the first attempt with zero flaky classification.
- Issue #515 is closed after PR #517 delivered executable Progress parity. PR #517 squash merge SHA is `f423d824c2d580e458128a54af3b53514b224bbb`; exact-main CI #3486 attempt 2 and Stage #3330 passed.
- PR #514 delivered Next.js `16.3.0`; exact-main CI #3479 and Stage #3322 passed.
- PR #512 delivered the frontend toolchain/Playwright `1.62.1` alignment; exact-main CI #3471 and Stage #3314 passed.
- PR #510 delivered `github.com/redis/go-redis/v9` `v9.22.0`; exact-main CI #3464 and Stage #3307 passed.
- Issue #68 automated PWA appearance work is complete through PR #506 and PR #507; physical-device acceptance remains #508.
- Figma provenance PR #488 merged as `3e8fdafb08f7789ca5a0b53e2e73a79bc7805b35`.
- Figma route handoff PR #501 merged as `83bfd5ddfbee3d2ee858e1d0f00e79ba47791ea9`.
- Figma Git LFS transport PR #502 merged as `c4b3f0145cee93be6e53de3775f8406bf6ed3e6e`.
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
- `js-yaml 4.3.1` remains preserved in the current lockfile.
- Production Redis client remains `go-redis/v9 v9.22.0` with existing explicit timeout/pool configuration unchanged.

## PWA appearance status

- Canonical semantic appearance colors are Light `#f4f7f5` and Dark `#10211d`.
- Manifest/runtime/offline metadata and offline presentation use the canonical appearance contract.
- Install metadata uses dedicated `any`, `maskable` and `monochrome` icon assets.
- Manifest orientation lock is removed; service-worker precache includes the install assets delivered by #506.
- Native iOS/iPadOS, Android and desktop install surfaces remain manual acceptance under #508.

## Figma source-of-truth status

- Canonical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- Screen Map & Handoff canonical node: `82:3`.
- PR #488 preserves the audited 2026-08-13 offline source provenance in `docs/figma/`.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- PR #501 makes `frontend/docs/adaptive-knowledge-coach.md` the repository-side canonical route → Figma node → Issue handoff.
- PR #502 adds Git LFS routing for `design/figma/*.fig`; expected destination is `design/figma/LexiGo Design System.fig`.
- The native `.fig` binary is not yet stored in GitHub. Issue #487 remains open until the exact binary is uploaded through a binary-safe path and its SHA-256 is verified.
- Live Figma inspection/editing is currently constrained by the connected Figma MCP Starter-plan tool-call limit; do not claim Screen Map or canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation when Figma MCP access is available.
- Issue #205 is the active umbrella for final route-by-route parity audit.
- Home canonical source is mobile Dark `196:223` and desktop Light `194:249`; opposite appearances are token-derived under the documented handoff.
- Progress executable parity is already delivered by #515/PR #517: mobile Light `76:6`, mobile Dark `76:53`, desktop geometry `76:154` plus explicit semantic Dark tokens.
- Dictionary Empty Light `79:93` visual determinism is resolved by #518/PR #520. Approved SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.

## Delivered learning/platform foundations

- Issue #19 retained-learning report and weak-area evidence are delivered.
- Issue #18 backend adaptive ranking, persisted selection reasons and diagnostic onboarding states are delivered foundations; the product flow remains open through #201.
- Issue #25 Phase 1 delivered persisted `listening` semantics without a parallel scheduler.
- Issue #25 Phase 2 delivered account-owned custom words through the existing words/SRS model.
- Issue #25 Phase 3 delivered bounded authenticated glossary export/import without exporting scheduler history.
- Issue #25 Phase 4 delivered a local ephemeral pronunciation recorder platform; product recorder UI/scoring remains separate work.
- No completed frontend custom-vocabulary/glossary workflow is claimed.

## Issue #201 design gate

- Existing Mobile / Onboarding / Light node `79:46` is known.
- Canonical Guest Home mobile/desktop, onboarding desktop, diagnostic pre/post-reveal, skip/completion/recovery and complete Light/Dark coverage remain design-gated.
- Delivered diagnostic state contract uses `not_started`, `in_progress`, `completed`, `skipped`, at most 12 items and self-marks `known` / `unsure` / `new` before reveal.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Parent #25 remains open after four delivered phases.
- Issue #68 is completed and closed after exact-main Stage/public validation.
- Issue #508 is the residual physical-device PWA acceptance gate and contains no implementation scope unless testing discovers a reproducible defect.
- Issue #515 Progress parity is complete through PR #517, exact-main CI #3486 attempt 2 and Stage #3330.
- Issue #518 Dictionary Empty visual determinism is complete through PR #520, immutable-head CI #3514, exact-main CI #3515 and Stage #3361.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are reset to canonical templates before the next product/QA slice.
- The next executable Figma-related product/QA work is an atomic Home child slice under #205, using canonical Home nodes `196:223` and `194:249` and existing `home-route-island.spec.ts` route/session/history ownership.
- Issue #203 remains temporarily blocked on live Figma MCP access; repository-side handoff is already present from PR #501.
- Issue #78 remains the independent security hardening workstream for CSP enforcement promotion.
- User priority remains Figma-related product/parity work.

## Remaining roadmap

- #205: continue route-by-route Figma parity. Start with an atomic Home child slice: canonical mobile Dark `196:223`, desktop Light `194:249`, token-derived opposite appearances, route-shell ownership, no horizontal overflow, reload and real Browser Back/Forward. Do not turn audit work into a hidden redesign.
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
