# LexiGo Project State

## Verification

- Last verified: 2026-07-28 05:02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `d85c57f1e23b891526970b06c49479fa15873cb4`.
- Latest product merge: PR #262, merge SHA `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
- PR #262 immutable developer-authored head: `bfdb1ede306b6a1e8d29e2a71067a508d6903a45`.
- PR #262 final full CI: run `30320390335`, successful including unchanged authoritative Linux visual hashes.
- Post-merge `main` CI: run `30320890448`, successful on exact merge SHA `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
- Issue #261 is closed as completed; parent Issue #70 remains open for Phrases/dead compatibility evidence.
- PR #262 exact-SHA stage/public validation: run `30321331383`, exact image `f84e60a06124821e4d90086eea8fd8a2a03aaed9`; deploy and first-attempt frontend/API HTTP 200 smoke succeeded, with 12/12 public desktop Chromium/iOS WebKit checks passing.
- Previous product merge: PR #258, merge SHA `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
- PR #258 immutable developer-authored head: `21256ba34ba64448a26770c6eec584ea00a1e60a`.
- PR #258 final full CI: #2204, run `30317303968`, successful with the controlled measurement probe absent.
- PR #258 post-merge `main` CI: #2205, run `30317863420`, successful on exact merge SHA `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
- Issue #257 is closed as completed.
- PR #258 exact-SHA stage/public validation: #2043, run `30318351607`, exact image `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`; deploy and first-attempt frontend/API smoke succeeded, with 12/12 public desktop Chromium/iOS WebKit checks passing.
- Latest documentation merge: PR #263, merge SHA `d85c57f1e23b891526970b06c49479fa15873cb4`.
- PR #263 immutable head: `5dab7b979c6002f8d9fdf7f350f3799b62ecade0`.
- PR #263 lightweight CI: run `30321738395`, successful.
- PR #263 post-merge lightweight CI: run `30321794215`, successful on exact merge SHA `d85c57f1e23b891526970b06c49479fa15873cb4`.
- Deploy Stage scope run `30321812942` validated the Agent Docs classification and skipped the deploy job; stage remains on exact product image `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
- Previous documentation merge: PR #260, merge SHA `32d36a6cc4eaefc553e893fcd1942519441d647b`.
- PR #260 immutable head: `f3e8c6ca287997a5578b70db931c2d553995f460`.
- PR #260 lightweight CI: run `30319000583`, successful.
- PR #260 post-merge lightweight CI: run `30319056079`, successful on exact merge SHA `32d36a6cc4eaefc553e893fcd1942519441d647b`.
- Previous documentation merge: PR #259, merge SHA `8f21019b1061aea7ab649b13b002d68ccc7178c2`.
- PR #259 immutable head: `8be2a15ae7a34dff6d93d2705d5b080b16cee658`.
- PR #259 lightweight CI: #2206, run `30318745468`, successful; classifier and Agent Harness ran, while backend, frontend, browser and container jobs were correctly skipped.
- PR #259 post-merge lightweight CI: #2207, run `30318796156`, successful on exact merge SHA `8f21019b1061aea7ab649b13b002d68ccc7178c2`.
- PR #259 did not build or deploy runtime images. Stage remains on exact product image `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2` from run `30318351607`.
- Previous product merge: PR #251, merge SHA `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`.
- PR #251 immutable head: `189f5eee089b1afe5127904770525810da1ae101`.
- PR #251 authoritative full CI: #2133, run `30277124935`, successful.
- Issue #250 is closed as completed.
- PR #251 exact-SHA stage/public validation: run `30279520923`, exact image `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`; deploy, public smoke and public browser succeeded. All 12 logical public checks completed; one iOS WebKit stale-build recovery check passed on retry after a transient Service Worker load error.
- Previous product merge: PR #248, merge SHA `a617dfce331700d0b3e911726d52a2683f18d526`.
- PR #248 immutable head: `7052865d4ef07c707c7d692ecc4a539d863e13dc`.
- PR #248 full CI: #2084, run `30254670808`, successful.
- Issue #247 is closed as completed.
- PR #248 exact-SHA stage/public validation: run `30256018000`, exact image `a617dfce331700d0b3e911726d52a2683f18d526`; deploy, public smoke and public browser succeeded, 12/12 checks passed.
- Product system-state merge: PR #239, merge SHA `370d0dccfaa9c273d11164bbce37dd71975485cd`.
- PR #239 immutable head: `1a450fef6e6cc11621cb9c7de2552fb426cef522`.
- PR #239 full CI: #2042, run `30225559882`, successful.
- Product stage/public validation for PR #239: run `30226263326`, exact image `370d0dccfaa9c273d11164bbce37dd71975485cd`; deploy, public smoke and public browser succeeded, 12/12 checks passed.
- Issues #202 and #170 are closed as completed.
- CI reliability follow-up: PR #242, merge SHA `b63b6197fdffd0fc7623a5131c649aadaaa52476`.
- PR #242 immutable head: `609367b61ae8f687fc2d1d8ec20a1f26f01048e0`.
- PR #242 full CI: #2045, run `30227244754`, successful, including Monday execution of `TestLearningReviewModesAndAnalytics`.
- Issue #241 is closed as completed.
- PR #242 exact-SHA stage/public validation: run `30227955912`; deploy, public smoke and public browser succeeded, 12/12 checks passed.
- Documentation reconciliation PR #240 passed final immutable-head CI #2047/run `30228327070` and was expected-head squash merged as `387cc50c199218d71b49b39beb9d92859b6e299c`.
- Agent Docs CI optimization PR #244 final head `cc59aff4729f168063315100179a1693922ca47c` passed CI #2060/run `30230474179` and was expected-head squash merged as `426144d00a857f36be8a543553df5029ac49a454`.
- Issue #243 is closed as completed.
- PR #244 exact-SHA stage/public validation: run `30231298766`, exact image `426144d00a857f36be8a543553df5029ac49a454`; deploy, public smoke and public browser succeeded, 12/12 checks passed.
- PRs #245, #246, #252, #259 and #260 proved the lightweight Agent Docs pull-request and main-push paths without rebuilding or redeploying runtime images.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Canonical App Router paths, browser history, route recovery, persistent PWA shell and service-worker safety contracts are implemented.

### Shared system-state presentation

- `frontend/app/system-states.css` is the sole shared loading/empty/error/success/skeleton/connectivity presentation owner.
- `mobile-pwa-fixes.css` is limited to the PWA/session shell; the retired `review-outbox.css` owner and root import are absent.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue runtime owner.
- Source contracts protect the ownership boundary and effective review-sync typography; all approved Linux system-state hashes remain unchanged.

### Learning core

- Due queue, spaced repetition, objective schema-v2 review events, durable offline review outbox and idempotency are implemented.
- Study, Recall and Choice remain separate runtime and evidence modes.
- Progressive Lesson Composer, canonical Active Lesson and canonical Lesson Result are in production.
- Distinct-next protection prevents the next lesson from silently repeating the completed block.

### Progress and retained-learning evidence

- `/progress` is server-owned and reports current due evidence, retained knowledge, weekly trends, weak topics and deterministic recommendations.
- Weak part-of-speech evidence and direct server-owned recommendations are implemented.
- Route-boundary session adoption prevents logout during Progress navigation.
- Progress navigation remains escapable in desktop, mobile and installed PWA contexts.
- Scroll restoration is immediate and interruptible rather than uninterruptible smooth scrolling.

### Route-level client islands and bundle budgets

- Home, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole connectivity and review-outbox owner.
- `LexigoHomeApp` owns only Home progress/active-lesson reads, next-best-action presentation and lesson creation through the existing API. It does not import `LexigoPremiumApp` or duplicate session, outbox, Service Worker or appearance ownership.
- Home preserves the ordering active lesson > due review > new study > manual configuration and hands off through the one-time canonical `/lesson/active?resume=1` intent without a second confirmation click.
- Direct `/` entry and repeated Home ↔ Learn/Dictionary/Progress navigation perform exactly one network `/api/v1/auth/refresh` bootstrap request.
- All LexiGo History writers use `createNavigationHistoryState`, preserve the current `lexigoRouteGraph` owner and do not copy unknown Next.js internal state between route graphs.
- Cold `/` entry measures 207,675 JavaScript bytes and 18 initial requests versus the original 238,257-byte monolithic graph: a 30,582-byte, 12.8% reduction.
- Permanent `/` limits are 235,000 JavaScript bytes and 21 initial requests.
- Exact Home measurement artifact `8656783937` came from controlled run `30275645894` on probe head `dd35a8f3266aa9358f60a6f05abe2076cf404768`; the post-report test-only probe was removed byte-for-byte before final CI.
- `bundle-budgets.test.ts` preserves the original measured transfer and original release ceiling as distinct immutable boundaries. Home keeps the stronger ceiling-below-original-transfer requirement; existing extracted routes remain bounded below the original release ceiling and within route-specific headroom.
- `LexigoProgressApp` owns only Progress API reads/actions and evidence presentation and does not import `LexigoPremiumApp` or duplicate session, outbox or PWA lifecycle ownership.
- Cold `/progress` entry measures 207,502 JavaScript bytes and 18 initial requests versus the original 238,257-byte monolithic graph: a 30,755-byte, 12.9% reduction.
- Permanent `/progress` limits are 240,000 JavaScript bytes and 21 initial requests.
- Exact Progress measurement report artifact `8648042201` came from controlled run `30253573827`; its test-only probe was removed byte-for-byte before final immutable-head CI.
- `LexigoLearnApp` owns only Lesson Composer metadata/progress/active-session reads, preview/create/resume/discard mutations and presentation; it does not import `LexigoPremiumApp` or duplicate session, outbox or PWA lifecycle ownership.
- Active Lesson Browser Back preserves exact Next.js history state, invokes the safe-exit dialog in desktop Chromium/WebKit and Android/iOS projects, and leaves the confirmed-exit Back target at `/learn`.
- Cold `/learn` entry measures 210,986 JavaScript bytes and 20 initial requests versus the original 238,257-byte monolithic graph: a 27,271-byte, 11.4% reduction.
- Permanent `/learn` limits are 235,000 JavaScript bytes and 22 initial requests.
- Exact Learn measurement artifact `8670855986` came from controlled run `30312155204` on probe head `b82c31acfc9bd48ec5b28682a49035226bdef556`; its test-only probe was removed byte-for-byte before final immutable-head CI.
- `LexigoActiveLessonApp` owns only active-session restore, review/resync/suggestion, completion/result continuation, focused-route announcement and safe exit; it does not import `LexigoPremiumApp` or duplicate session, review-outbox, Service Worker or appearance ownership.
- Active Lesson semantic ownership survives transient Next pathname changes during Browser Back, preserves immutable framework history state and replaces the protected entry after confirmed exit so a later Back returns to `/learn`.
- Cold `/lesson/active` entry measures 220,225 JavaScript bytes and 19 initial requests versus the original 238,257-byte monolithic graph: an 18,032-byte, 7.6% reduction.
- Permanent `/lesson/active` limits are 235,000 JavaScript bytes and 22 initial requests.
- Exact Active Lesson measurement artifact `8672549672` came from controlled run `30316931098` on probe head `ce468c054dc57f3dc154a7b8b016f0999b04d90c`; artifact digest is `sha256:a66f6155801715d4d689adb84f82b136e57e5360ef76c193ad77e2db9ea3829a`, and the test-only probe was removed byte-for-byte before final immutable-head CI.
- The only remaining route in the compatibility graph `LexigoPremiumApp` is Phrases.

### Scenario learning

- Durable Scenario contracts, ordered steps, optimistic versioning, pause/resume/reload, fact/hypothesis evidence and idempotent submission are implemented.
- Scenario review targets resolve to concrete enrolled learning items and use the central learning transaction writer.
- Canonical `/scenarios/[slug]`, Scenario catalog `/scenarios` and Progress Scenario evidence/recommendations are in production.
- Scenario catalog preserves backend order and remains usable if Progress recommendations fail.

### Dictionary catalog and Word Detail

- Canonical `/dictionary` is server-owned for search, filters, sorting, pagination and exact result order.
- URL state and Back/Forward recovery are preserved.
- Canonical `/words/[id]` loads independently, strictly validates scheduler fields and loads bounded server-owned related phrases.
- Word Detail pronunciation has supported, loading, playing, error and unsupported states.
- Single-word practice creates an exact lesson with `wordIds: [selectedWordId]`.

### Profile and appearance

- Authenticated `/profile` is implemented from approved Figma nodes.
- Daily goal remains server-owned; calendar reminders remain browser/calendar-owned.
- Password, sessions, email change, export and deletion retain their existing account/API owners.
- Appearance persists only `auto`, `light` or `dark`; first-paint theme bootstrap and PWA `theme-color` are implemented.
- Logout and session invalidation remain owned by the persistent App Router shell.

### System and offline states

- PR #239 completed approved loading, empty, correlated error, physical-offline, retryable-failure, queued-review, restored-connection and synchronized states.
- Figma source nodes: `79:69`, `79:93`, `79:117`, `79:194` and `75:57`.
- Reviews are persisted before the first network request and retain one idempotency key across retry/reload.
- Auth and CSRF tokens are never persisted in the outbox.
- Active Lesson preserves the submitted answer after offline/retryable review and blocks duplicate rating or next-card advancement until authoritative replay confirmation.
- Full offline lesson progression remains intentionally unsupported; new lesson creation remains blocked offline.
- Dictionary query/filter state survives loading, empty, error and retry states.
- Connectivity presentation avoids compact navigation and Active Lesson controls.
- Reduced motion, forced colors, Light/Dark, 320 px, 200% reflow, Chromium/WebKit, Android/iOS PWA, keyboard, axe, CSP, service-worker and performance contracts are blocking.
- Reviewed visual hashes:
  - compact loading Dark: `0445cb0016887f4c54993cbf3706f4b720e01cf9b13c0bfebf37efc77f1bb61d`;
  - compact Dictionary empty Light: `d21af9c2f2e194eb6c5a447c5913107cc414f216f28a7fba7a78dfc05b211aa2`;
  - compact error Dark: `acd7f5437ba3994b140f0123f4734678dff7a82188abba8d6cbb5532ec0bc5c0`;
  - desktop offline Dark: `8f3b6192ba542969101166997046d92df0dc041ed9c8ec0fc7f588e951931f7a`;
  - compact Recall offline Dark: `0d7393ab3793ab5d773d167f65f743d3cd53190c4da4899a2d915e1d3b01d2ae`.

### Calendar-boundary CI reliability

- PR #242 fixed deterministic Monday failure in `TestLearningReviewModesAndAnalytics` without changing production aggregation.
- The invalid fixture `now() - interval '8 days'` was replaced by `date_trunc('week', now()) - interval '1 day'`.
- For `timezoneOffsetMinutes=0`, the fixture now always lies inside the immediately previous UTC week.
- `.agents/AGENTS.issue-241-calendar-boundaries.md` is mandatory reading.
- Calendar buckets must be seeded from explicit production boundaries, not fixed-duration approximations from `now()`.
- Same-head retries are prohibited when a failure is proven deterministic for the current calendar boundary.

### Request-scoped failure fixtures

- Initial PR #248 CI #2068 exposed a stale Dictionary test fixture on `ios-webkit`; production runtime was not defective.
- A broad path-only HTTP 503 interceptor failed both initial catalog loading and the intended `query=durable` request, racing the controlled input with an initial error remount.
- The fixture now allows successful baseline loading and fails only the exact target request; corrected and final browser matrices passed.
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md` is mandatory reading for failure fixtures sharing an endpoint between baseline and user action.

### Agent Harness and Agent Docs CI

- The repository contains root/normative agent instructions, verified project state, skills registry, current-task memory, templates, reusable lessons and a dependency-free source contract.
- PR #244 introduced fail-closed base-to-head scope classification and retained the required `CI` workflow for every pull request and `main` push.
- Only pure changes limited to `AGENTS.md`, `.agents/**` and `docs/agent-harness.md` may use the lightweight Agent Harness path.
- Workflow, script, runtime, dependency, mixed and all other documentation changes retain the complete backend/frontend/browser/container matrix.
- CI publishes exact-head scope evidence; automatic stage deployment revalidates that evidence before deployment.
- Pure Agent Docs pushes do not build/publish runtime images and do not perform automatic stage deployment; manual stage dispatch remains available.
- Missing, malformed or mismatched scope evidence blocks automatic deployment.
- PRs #245, #246, #252, #259 and #260 proved live pull-request and main-push fast paths: classifier and Agent Harness succeeded, all heavy jobs were skipped, and the runtime image/stage deployment remained unchanged.

## In progress

- No product or runtime slice is active.
- The next atomic slice must be selected only after resolving live `main`, open PRs, Issues, CI and stage evidence again.

## Remaining roadmap

### 1. #199 — Phrases design gap

Approve exact catalog/detail Figma nodes before production implementation. Do not infer missing production design.

### 2. #18 and #201 — Adaptive personalization and First Use

Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 4. #115 — Remaining route-level client islands and budgets

Extract Phrases after its exact production Figma nodes are approved, without duplicating session, API, review-outbox or PWA ownership. The route requires direct-entry/navigation proof, exact transfer evidence and a strictly tighter route-specific release ceiling.

### 5. #70 — Legacy applications and CSS

System-state CSS ownership consolidation is complete under #261/#262. Remove only remaining proven-dead app/CSS families with browser, visual and bundle evidence; Phrases/dead compatibility proof remains dependent on #199/#115.

### 6. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Phrases and parts of First Use require approved exact Figma states.
- Final moderated usability evidence remains external work under #133.

## Blocked

- #199 and design-dependent portions of First Use are blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #263 — `docs(agent): reconcile system-state ownership completion` → `d85c57f1e23b891526970b06c49479fa15873cb4`.
2. #262 — `refactor(frontend): consolidate system-state CSS ownership` → `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
3. #260 — `docs(agent): reconcile live project state` → `32d36a6cc4eaefc553e893fcd1942519441d647b`.
4. #259 — `docs(agent): reconcile Active Lesson island completion` → `8f21019b1061aea7ab649b13b002d68ccc7178c2`.
5. #258 — `perf(lesson): extract Active Lesson route island` → `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
6. #255 — `perf(learn): extract Learn route island and lock bundle budget` → `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
7. #252 — `docs(agent): reconcile Home island completion` → `17c5a8baa544382344936f423d020e5fec89a3d2`.
8. #251 — `perf(home): extract Home route island and lock bundle budget` → `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`.
9. #249 — `docs(agent): reconcile Progress island completion` → `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`.
10. #248 — `perf(progress): lock route-island ownership and bundle budget` → `a617dfce331700d0b3e911726d52a2683f18d526`.

## Evidence

- Live GitHub `main`, open PRs, branches, Issues #12/#70/#115/#199/#201/#261, CI and deployment evidence were re-read at the verification timestamp; no pull request was open.
- PR #263 final head `5dab7b979c6002f8d9fdf7f350f3799b62ecade0` passed lightweight CI run `30321738395`; review-thread, review and PR-comment audits were empty, and expected-head squash merge produced `d85c57f1e23b891526970b06c49479fa15873cb4`.
- Post-merge push CI run `30321794215` passed the classifier and Agent Harness on the exact documentation merge SHA. Deploy Stage run `30321812942` validated that exact Agent Docs scope and skipped deployment, so the stage runtime remained on product image `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
- PR #262 final head `bfdb1ede306b6a1e8d29e2a71067a508d6903a45` passed full CI run `30320390335`; review-thread, review and PR-comment audits were empty, and expected-head squash merge produced `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
- Initial run `30319926639` caught one computed-cascade specificity omission in `desktop-offline-dark`; the effective review-sync copy values were restored in the canonical owner, protected by a source contract and validated without changing any baseline.
- Post-merge push CI run `30320890448` passed on exact merge SHA `f84e60a06124821e4d90086eea8fd8a2a03aaed9`, including frontend core, backend unit/security/integration, complete browser/visual/performance matrix and both container builds.
- Stage run `30321331383` deployed exact web/API image `f84e60a06124821e4d90086eea8fd8a2a03aaed9`; frontend/API smoke returned HTTP 200 on the first attempt and the public desktop Chromium/iOS WebKit matrix passed 12/12.
- PR #258 final head `21256ba34ba64448a26770c6eec584ea00a1e60a` passed full CI #2204/run `30317303968`; review-thread, review and PR-comment audits were empty, and expected-head squash merge produced `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
- Post-merge push CI #2205/run `30317863420` passed on the exact merge SHA, including frontend core, backend unit/security/integration, full browser matrix, performance budgets and both container builds.
- Stage run `30318351607` deployed exact web/API image `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`; frontend/API smoke returned HTTP 200 on the first attempt and the public desktop Chromium/iOS WebKit matrix passed 12/12.
- Exact performance artifact `8672549672` from controlled run `30316931098` records `/lesson/active` at 220,225 bytes and 19 requests; the probe changed only the route-budget test, was restored to blob `304e7c62d3163a59edac3e648246e2aa4ce00660`, and was absent from final CI.
- PR #259 final head `8be2a15ae7a34dff6d93d2705d5b080b16cee658` passed lightweight CI #2206/run `30318745468`; review-thread and PR-comment audits were empty, and expected-head squash merge produced `8f21019b1061aea7ab649b13b002d68ccc7178c2`.
- Post-merge push CI #2207/run `30318796156` passed the classifier and Agent Harness on the exact documentation merge SHA; all runtime, browser and container jobs were correctly skipped, and deployment status Issue #12 remained on product image `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
- PR #255 final head `4bd470609d20485a8a797c96574002de93bc6a03` passed full CI #2196/run `30312747613`; review-thread audits were empty and expected-head squash merge produced `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
- Post-merge push CI #2197/run `30313334659` passed on the exact merge SHA, including frontend core, backend unit/security/integration, full browser matrix, performance budgets and both container builds.
- Stage run `30313824186` deployed exact web/API image `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`; public frontend/API smoke passed and the public desktop Chromium/iOS WebKit suite passed 12/12.
- Exact performance artifact `8670855986` from controlled run `30312155204` records `/learn` at 210,986 bytes and 20 requests; the probe was removed byte-for-byte before the permanent-budget head and final CI.
- PR #252 final head `008d53014e690ab0c314b5c706489988ab5ba29f` passed lightweight CI #2135/run `30287635161`; heavy backend/frontend/browser/container jobs were skipped by the Agent Docs classifier.
- Expected-head squash merge produced `17c5a8baa544382344936f423d020e5fec89a3d2`; runtime image and stage deployment remained unchanged.
- PR #251 final head `189f5eee089b1afe5127904770525810da1ae101` passed authoritative complete CI #2133/run `30277124935` after the same-head rerun of one transient UI shard 2 iOS WebKit timing failure.
- Expected-head squash merge of PR #251 produced `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754` and closed Issue #250.
- Stage run `30279520923` deployed exact image `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`; frontend and API became healthy, public smoke passed, and the public desktop Chromium/iOS WebKit matrix completed successfully.
- Exact performance artifact `8656783937` from controlled run `30275645894` records `/` at 207,675 bytes and 18 requests; the probe changed only the test and was removed byte-for-byte before final CI.
- CI #2130/run `30276740022` exposed only an over-strict test comparator that conflated the original measured transfer with the original release ceiling. The corrected test preserved all production code and budget values; final CI #2133 passed.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
