# LexiGo Project State

## Verification

- Last verified: 2026-07-27 04:29 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `2ba1053877f916be2c5f5ce4651d772256ee66dd`.
- Latest product merge: PR #239, merge SHA `370d0dccfaa9c273d11164bbce37dd71975485cd`.
- PR #239 immutable head: `1a450fef6e6cc11621cb9c7de2552fb426cef522`.
- PR #239 full CI: #2042, run `30225559882`, successful.
- Product stage/public validation: run `30226263326`, exact image `370d0dccfaa9c273d11164bbce37dd71975485cd`, deploy/public smoke/public browser successful, 12/12 checks passed.
- Issues #202 and #170 are closed as completed.
- CI reliability follow-up: PR #242, merge SHA `b63b6197fdffd0fc7623a5131c649aadaaa52476`.
- PR #242 immutable head: `609367b61ae8f687fc2d1d8ec20a1f26f01048e0`.
- PR #242 full CI: #2045, run `30227244754`, successful, including Monday execution of `TestLearningReviewModesAndAnalytics`.
- Issue #241 is closed as completed.
- PR #242 exact-SHA stage/public validation: run `30227955912`, deploy/public smoke/public browser successful, 12/12 checks passed.
- Documentation reconciliation PR #240 passed final immutable-head CI #2047/run `30228327070` and was expected-head squash merged as `387cc50c199218d71b49b39beb9d92859b6e299c`.
- Agent Docs CI optimization PR #244 final head `cc59aff4729f168063315100179a1693922ca47c` passed CI #2060/run `30230474179` and was expected-head squash merged as `426144d00a857f36be8a543553df5029ac49a454`.
- Issue #243 is closed as completed.
- PR #244 exact-SHA stage/public validation: run `30231298766`, exact image `426144d00a857f36be8a543553df5029ac49a454`, scope validation/deploy/public smoke/public browser successful, 12/12 checks passed.
- PR #245 final head `a6c6a8a1dd410ddb8fcab219f379aa8555b9d4da` passed lightweight CI #2063/run `30231679715` and was expected-head squash merged as `2ba1053877f916be2c5f5ce4651d772256ee66dd`.
- PR #245 exact scope artifact classified only `.agents/PROJECT_STATE.md` and the three `.agents/current/**` files as `agent_docs_only=true`; Agent Harness validation passed and all backend/frontend/browser/container jobs were skipped.
- Push-triggered main CI for `2ba1053877f916be2c5f5ce4651d772256ee66dd` completed successfully through the lightweight path.
- Automatic stage deployment for PR #245 was skipped: Issue #12 remains on exact runtime image `426144d00a857f36be8a543553df5029ac49a454`, run `30231298766`, with successful deploy/public smoke/public browser evidence.

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
- `ReviewOutboxRuntime` remains the sole connectivity and IndexedDB review-outbox owner.
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

### Agent Harness and Agent Docs CI

- The repository contains root/normative agent instructions, verified project state, skills registry, current-task memory, templates, reusable lessons and a dependency-free source contract.
- PR #240 recorded PR #239 and PR #242 evidence, reset `.agents/current/**` from canonical templates and merged as `387cc50c199218d71b49b39beb9d92859b6e299c` after CI #2047 succeeded.
- PR #242 added mandatory calendar-boundary fixture guidance.
- PR #244 introduced fail-closed base-to-head scope classification and retained the required `CI` workflow for every pull request and `main` push.
- Only pure changes limited to `AGENTS.md`, `.agents/**` and `docs/agent-harness.md` may use the lightweight Agent Harness path.
- Workflow, script, runtime, dependency, mixed and all other documentation changes retain the complete backend/frontend/browser/container matrix.
- CI publishes exact-head scope evidence; automatic stage deployment revalidates that evidence before deployment.
- Pure Agent Docs pushes do not build/publish runtime images and do not perform automatic stage deployment; manual stage dispatch remains available.
- Missing, malformed or mismatched scope evidence blocks automatic deployment.
- PR #245 proved both live pull-request and main-push fast paths: classifier and Agent Harness successful, all heavy jobs skipped, runtime image and stage deployment unchanged.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset byte-for-byte from canonical templates.

## In progress

- No product or runtime slice is active.
- The next slice must be selected only after resolving live `main`, open PRs, Issues, CI and stage evidence again.

## Remaining roadmap

### 1. #199 — Phrases design gap

Approve exact catalog/detail Figma nodes before production implementation. Do not infer missing production design.

### 2. #18 and #201 — Adaptive personalization and First Use

Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 4. #115 — Route-level client islands and budgets

Inventory bundles and gradually extract remaining routes without duplicating session, API or PWA ownership.

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

1. #245 — `docs(agent): reconcile state after Agent Docs CI` → `2ba1053877f916be2c5f5ce4651d772256ee66dd`.
2. #244 — `ci: add safe Agent Docs fast path` → `426144d00a857f36be8a543553df5029ac49a454`.
3. #240 — `docs(agent): reconcile state after system states` → `387cc50c199218d71b49b39beb9d92859b6e299c`.
4. #242 — `fix(ci): make previous-week fixture boundary-safe` → `b63b6197fdffd0fc7623a5131c649aadaaa52476`.
5. #239 — `feat(ui): implement production system states` → `370d0dccfaa9c273d11164bbce37dd71975485cd`.
6. #238 — `docs(agent): reconcile state after Profile` → `d906cacf21f5a25dc52a380ab8ce681177831532`.
7. #237 — `feat(profile): implement Figma Profile and appearance preferences` → `9f8a5bc33cf87a2f1710edc309d889a5b7130a5f`.

## Evidence

- Live GitHub `main`, PRs #239/#240/#242/#244/#245, Issues #12/#170/#202/#241/#243, immutable heads and CI/deployment evidence were re-read at the verification timestamp.
- Product deployment evidence uses exact image `370d0dccfaa9c273d11164bbce37dd71975485cd` with successful deploy/public smoke/public browser checks.
- CI reliability deployment evidence uses exact image `b63b6197fdffd0fc7623a5131c649aadaaa52476`, stage run `30227955912`, successful deploy/public smoke/public browser and 12/12 checks.
- PR #240 final head `ba71e8fe3a3be6da52594559bbbea0e09b3b13ee` passed CI #2047/run `30228327070`; expected-head squash merge produced `387cc50c199218d71b49b39beb9d92859b6e299c`.
- PR #244 final head `cc59aff4729f168063315100179a1693922ca47c` passed complete CI #2060/run `30230474179`; expected-head squash merge produced `426144d00a857f36be8a543553df5029ac49a454`.
- Stage run `30231298766` checked out exact SHA `426144d00a857f36be8a543553df5029ac49a454`, downloaded and validated the exact CI scope artifact, deployed that image and passed public smoke plus 12/12 public browser tests.
- PR #245 final head `a6c6a8a1dd410ddb8fcab219f379aa8555b9d4da` passed lightweight CI #2063/run `30231679715`; expected-head squash merge produced `2ba1053877f916be2c5f5ce4651d772256ee66dd`.
- The PR #245 scope artifact contained exactly four `.agents/**` paths and `agent_docs_only=true`; every heavy product/container job was skipped.
- Issue #12 received the successful main-CI report for `2ba1053877f916be2c5f5ce4651d772256ee66dd`, while its deployment body remained unchanged on runtime image `426144d00a857f36be8a543553df5029ac49a454`, proving automatic stage deployment was skipped.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.