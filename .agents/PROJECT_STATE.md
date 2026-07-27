# LexiGo Project State

## Verification

- Last verified: 2026-07-28 02:24 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
- Latest product merge: PR #255, merge SHA `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
- PR #255 immutable developer-authored head: `4bd470609d20485a8a797c96574002de93bc6a03`.
- PR #255 final full CI: #2196, run `30312747613`, successful with the controlled measurement probe absent.
- Post-merge `main` CI: #2197, run `30313334659`, successful on exact merge SHA `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
- Issue #254 is closed as completed.
- PR #255 exact-SHA stage/public validation: #2035, run `30313824186`, exact image `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`; deploy, public smoke and public browser succeeded, with 12/12 public Chromium/WebKit checks passing.
- Latest documentation merge: PR #252, merge SHA `17c5a8baa544382344936f423d020e5fec89a3d2`.
- PR #252 immutable head: `008d53014e690ab0c314b5c706489988ab5ba29f`.
- PR #252 lightweight CI: #2135, run `30287635161`, successful; classifier and Agent Harness ran, while backend, frontend, browser and container jobs were correctly skipped.
- PR #252 did not build or deploy runtime images. Stage remains on exact product image `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754` from run `30279520923`.
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
- PRs #245, #246 and #252 proved the lightweight Agent Docs pull-request and main-push paths without rebuilding or redeploying runtime images.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Canonical App Router paths, browser history, route recovery, persistent PWA shell and service-worker safety contracts are implemented.

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
- Remaining routes in the compatibility graph `LexigoPremiumApp` are Phrases and Active Lesson.

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
- PRs #245, #246 and #252 proved live pull-request and main-push fast paths: classifier and Agent Harness succeeded, all heavy jobs were skipped, and the runtime image/stage deployment remained unchanged.

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

Gradually extract Phrases and Active Lesson without duplicating session, API, review-outbox or PWA ownership. Each route requires direct-entry/navigation proof, exact transfer evidence and a strictly tighter route-specific release ceiling.

### 5. #70 — Legacy applications and CSS

Remove only proven-dead app/CSS families with browser, visual and bundle evidence.

### 6. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Phrases and parts of First Use require approved exact Figma states.
- Final moderated usability evidence remains external work under #133.

## Blocked

- #199 and design-dependent portions of First Use are blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #255 — `perf(learn): extract Learn route island and lock bundle budget` → `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
2. #252 — `docs(agent): reconcile Home island completion` → `17c5a8baa544382344936f423d020e5fec89a3d2`.
3. #251 — `perf(home): extract Home route island and lock bundle budget` → `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`.
4. #249 — `docs(agent): reconcile Progress island completion` → `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`.
5. #248 — `perf(progress): lock route-island ownership and bundle budget` → `a617dfce331700d0b3e911726d52a2683f18d526`.
6. #246 — `docs(agent): record Agent Docs post-merge proof` → `a0b6ce2bfa359ec232ad3c8df79f0bdfa624db1c`.
7. #245 — `docs(agent): reconcile state after Agent Docs CI` → `2ba1053877f916be2c5f5ce4651d772256ee66dd`.
8. #244 — `ci: add safe Agent Docs fast path` → `426144d00a857f36be8a543553df5029ac49a454`.
9. #242 — `fix(ci): make previous-week fixture boundary-safe` → `b63b6197fdffd0fc7623a5131c649aadaaa52476`.
10. #239 — `feat(ui): implement production system states` → `370d0dccfaa9c273d11164bbce37dd71975485cd`.

## Evidence

- Live GitHub `main`, PR #255, Issues #12/#115/#254, immutable heads, CI and deployment evidence were re-read at the verification timestamp.
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
