# LexiGo Project State

## Verification

- Last verified: 2026-08-14 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `f423d824c2d580e458128a54af3b53514b224bbb` after PR #517.
- Latest deployed runtime/Stage SHA: `f423d824c2d580e458128a54af3b53514b224bbb`.
- Issue #515 is closed as completed by PR #517. The delivered slice locks executable Progress parity at canonical `390×844` and `1440×1024`, explicit Light/Dark appearance, route-shell ownership, horizontal geometry, reload and real Browser Back/Forward without changing production UI or approved visual baselines.
- PR #517 immutable developer head was `d71e922001c2105b977dace956f4c89293d63227`; PR CI #3485 (`31809988954`) completed successfully across frontend core, full Chromium/WebKit/Android/iOS browser matrix, Linux visual regression, accessibility, content security, PWA/service-worker, performance, backend unit/security and PostgreSQL/Redis race integration, plus API/web container builds.
- PR #517 squash merge SHA is `f423d824c2d580e458128a54af3b53514b224bbb`; its Git tree is `383830b19d30b9293d44e9a3c042996772326df7`.
- Exact-main CI #3486 (`31810930838`) ultimately completed successfully on run attempt 2 for `f423d824c2d580e458128a54af3b53514b224bbb`, with full frontend/backend/browser gates and API/web container publication green.
- Exact-main CI #3486 first attempt exposed an independent pre-existing Figma visual nondeterminism in `System state → Dictionary empty Light` / Figma `79:93`: approved raw PNG SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf` intermittently rendered as `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`. No approved hash or UI source was changed.
- PR synthetic merge commit `6104c283eef98f118ff45018f6f14c69ab5ace45` and exact squash merge `f423d824c2d580e458128a54af3b53514b224bbb` have the same Git tree `383830b19d30b9293d44e9a3c042996772326df7`, excluding source-tree drift as the cause of the `79:93` mismatch.
- Controlled visual retry on the same exact SHA, same Playwright `v1.62.1-noble` image digest `sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`, and no repository writes reproduced `dd2d...` on the first capture but passed the approved `e140...` hash on the internal Playwright retry; the job completed `success` with `1 flaky`. Issue #518 now owns deterministic remediation and explicitly prohibits baseline promotion to `dd2d...`.
- Stage run #3330 (`31812191384`) completed successfully for exact SHA `f423d824c2d580e458128a54af3b53514b224bbb`; deployment, public endpoint smoke, public browser dependency installation and public Stage UI verification passed. Earlier Stage #3329 was correctly skipped because it followed the failed first CI attempt.
- PR #514 upgraded the production Next.js runtime from `16.2.11` to `16.3.0` on a fresh-main delivery branch while preserving React/React DOM `19.2.8`, Playwright `1.62.1`, `eslint-config-next 16.3.0` and `js-yaml 4.3.1`.
- PR #514 immutable-head CI #3478 (`31806554374`) completed successfully on frozen head `5651712851f0b8bdde7f65328dca1b49ad357689`; frontend core, complete Playwright browser matrix, visual/a11y/performance/security/PWA/service-worker gates, backend unit/security and PostgreSQL/Redis race integration, and API/web container builds passed.
- PR #514 squash merge SHA is `30e95b736d7c93f3db43e78462609cbaafd65341`.
- Exact-main CI #3479 (`31807395219`) completed successfully for `30e95b736d7c93f3db43e78462609cbaafd65341`; the full frontend/backend/browser matrix passed and API/web container images were published.
- Stage run #3322 (`31808229555`) completed successfully for that exact SHA; deployment, public endpoint smoke, public-browser dependency installation and public Stage UI verification passed.
- Original Dependabot PR #479 was used only as a three-way integration input into the isolated fresh-main branch; current-main delivery and validation are represented by PR #514.
- PR #512 refreshed the frontend development toolchain: `@playwright/test` to `1.62.1`, `@types/react` to `19.2.18`, `@types/react-dom` to `19.2.4`, and `eslint-config-next` to `16.3.0`; all repository Playwright image pins are aligned to `mcr.microsoft.com/playwright:v1.62.1-noble`.
- PR #512 immutable-head CI #3470 (`31801507218`) completed successfully on frozen head `5acd08ab61579722fc831de84d9ec8f465269ef0`; frontend core, complete Playwright browser matrix, visual/a11y/performance/security/PWA/service-worker gates, backend gates and API/web container builds passed. Deployment scripts check #189 (`31801507298`) also completed successfully on that exact head.
- PR #512 squash merge SHA is `04d19c7340be98f9849338f5cee6a8ba766347fe`.
- Exact-main CI #3471 (`31802214378`) completed successfully for `04d19c7340be98f9849338f5cee6a8ba766347fe`; backend unit/security and PostgreSQL/Redis race integration, frontend core/full browser matrix, frontend aggregate, and API/web container publication passed.
- Exact-main Deployment scripts check #190 (`31802214503`) completed successfully.
- Stage run #3314 (`31802974825`) completed successfully for that exact SHA; deployment, public endpoint smoke, Playwright public-browser dependency installation and public Stage UI verification passed.
- Original Dependabot PR #403 was used only as a three-way integration input into the fresh-main delivery branch; current-main delivery and validation are represented by PR #512.
- PR #510 upgraded `github.com/redis/go-redis/v9` from `v9.21.0` to `v9.22.0`; squash merge SHA is `e397562996f7ee0c70160c9fb6fef8d8f69b110f`.
- PR #510 immutable-head CI #3463 (`31798738075`) and exact-main CI #3464 (`31799536933`) completed successfully; Stage #3307 (`31800348093`) passed deploy, public endpoint smoke and public UI verification.
- Stale Dependabot PR #478 was closed as superseded after the fresh-main PR #510 was merged and validated.
- Issue #68 automated PWA appearance work is complete: PR #506 merged as `1fae52ab9dda9bc807d60a20cdb8cee594172e0d`, and the offline metadata follow-up PR #507 merged as `07503e6fdd619a924b72c9f48f80f482bf36e28d`.
- Issue #68 is closed. Physical installed-app icon/splash/cold-start acceptance remains separately tracked by #508 and is not claimed from CI.
- Latest Issue #25 product merge contained in the deployed runtime remains Phase 4 squash `810fa59a748477f8723a19dee03e61517282df30`.
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
- A controlled CI retry may prove infrastructure/render nondeterminism only when the exact commit/tree and source/baseline state remain unchanged; such a retry must be recorded and followed by a dedicated defect rather than normalizing the flake.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile and Scenario routes use dedicated route islands.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad deletion requires route, bundle and browser evidence.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.
- Existing frontend speech playback remains the browser speech owner.

## Backend dependency status

- Production Redis client construction remains owned by `backend/internal/platform/redis/redis.go`.
- go-redis `v9.22.0` is deployed on Stage after exact-main integration validation.
- Existing explicit Redis `DialTimeout=5s`, `ReadTimeout=2s`, `WriteTimeout=2s`, `PoolSize=20` and `MinIdleConns=2` remain unchanged.
- LexiGo does not use `WaitAOF` and did not opt into the new experimental client-side caching or automatic pipelining features introduced around this dependency update.

## Frontend dependency/tooling status

- Production Next.js runtime is `16.3.0`; React/React DOM remain `19.2.8`.
- Playwright package/runtime is aligned at `1.62.1` across npm, CI, Stage validation, visual snapshots and frontend container testing.
- Frontend type tooling uses `@types/react 19.2.18` and `@types/react-dom 19.2.4`.
- `eslint-config-next` is `16.3.0`.
- Frontend container runtime Node `22.22.2` satisfies Playwright 1.62.1's Node >=20 requirement.
- `js-yaml 4.3.1` remains preserved in the current lockfile.
- PR #512, exact-main CI #3471 and Stage #3314 provide the delivery evidence for the development-toolchain state; PR #514, exact-main CI #3479 and Stage #3322 provide the delivery evidence for Next.js `16.3.0` runtime state.

## PWA appearance status

- Canonical semantic appearance colors are Light `#f4f7f5` and Dark `#10211d`.
- Manifest/runtime/offline metadata and offline presentation use the canonical appearance contract.
- Install metadata uses dedicated `any`, `maskable` and `monochrome` icon assets rather than declaring one raster asset as both `any` and `maskable`.
- Manifest orientation lock is removed; service-worker precache includes the install assets delivered by #506.
- Exact PWA appearance delivery SHA `07503e6fdd619a924b72c9f48f80f482bf36e28d` passed its Stage/public automated validation.
- Native iOS/iPadOS, Android and desktop install surfaces remain manual acceptance under #508.

## Figma source-of-truth status

- Canonical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- PR #488 preserves the audited 2026-08-13 offline source provenance in `docs/figma/`.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- PR #501 makes `frontend/docs/adaptive-knowledge-coach.md` the repository-side canonical route → Figma node → Issue handoff.
- PR #502 adds Git LFS routing for `design/figma/*.fig`; expected destination is `design/figma/LexiGo Design System.fig`.
- The native `.fig` binary is **not yet stored in GitHub**. Issue #487 remains open until the exact binary is uploaded through a binary-safe path and its SHA-256 is verified.
- Live Figma inspection/editing is currently constrained by the connected Figma MCP Starter-plan tool-call limit; do not claim Screen Map or canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation. Issue #205 remains the final route-by-route parity audit.
- Issue #515 is closed after PR #517 delivered canonical Progress executable parity for mobile Light `76:6`, mobile Dark `76:53`, and desktop geometry `76:154`, with explicit semantic Dark tokens for desktop Dark. No new Figma frame or screenshot baseline approval is claimed.
- Existing Figma System State node `79:93` / Dictionary Empty Light has a confirmed CI capture nondeterminism tracked in #518. Approved SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`; `dd2d0c...` is evidence of the flake, not an approved alternate baseline.

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
- go-redis `v9.22.0` maintenance is complete through PR #510, exact-main CI #3464 and Stage #3307.
- Frontend development toolchain maintenance is complete through PR #512, exact-main CI #3471 and Stage #3314.
- Next.js `16.3.0` runtime maintenance is complete through PR #514, immutable-head CI #3478, exact-main CI #3479 and Stage #3322.
- Progress Figma parity Issue #515 is complete through PR #517, immutable-head CI #3485, exact-main CI #3486 attempt 2 and Stage #3330.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are reset to canonical templates before the next product/QA slice.
- Issue #518 is the next executable Figma/CI slice: remove `79:93` render nondeterminism without changing the approved design hash, tolerances or product UI unless a concrete product defect is proven.
- Issue #78 remains the independent security hardening workstream for CSP enforcement promotion; production enforcement is authorization-sensitive and must preserve the staged rollout contract.
- User priority remains Figma-related product/parity work.

## Remaining roadmap

- #518: make Figma System State Dictionary Empty Light `79:93` deterministic while preserving approved SHA `e1405517...`; require clean no-flake immutable-head and exact-main visual evidence.
- #205: continue route-by-route Figma parity after #518; Home is a strong next child slice because canonical Home nodes `196:223` mobile Dark and `194:249` desktop Light already exist and `home-route-island.spec.ts` owns route/session/history semantics.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #487: upload the exact native `.fig` through a binary-safe GitHub path and verify SHA-256.
- #203: synchronize live Figma Screen Map/archive status when MCP access is available.
- #201/#18: complete canonical First Use design states, then implement the approved flow.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete the remaining CSP/security-header enforcement promotion through an authorized staged rollout.
- #65/#461: automated reduced-motion implementation evidence and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after the core routes and final visual parity are ready.

## Evidence correction

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
