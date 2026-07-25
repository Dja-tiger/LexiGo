# LexiGo Project State

## Verification

- Last verified: 2026-07-25 19:29 Europe/Berlin
- Repository: `Dja-tiger/LexiGo`
- Live `main` must be resolved from GitHub at agent startup; at this verification its latest commit was `d7dc76c9139beff75d331c2b904f743f381f243d` from merged PR #220
- Stage image SHA: `d7dc76c9139beff75d331c2b904f743f381f243d`; Issue #12 and run `30165559836` report deploy, public smoke and 12/12 public browser success
- Latest production merge: #218 `fix(scenarios): own objective review targets on the server`
- PR #218 validation: final immutable-head CI #1770 (`30163260324`) succeeded on `1f5d4ac690d0527e28f057e66e9e7a86e6c6f542`; no unresolved review threads
- Repository-memory baseline: PR #220 `docs(agent): make project state durable across docs merges` squash-merged as `d7dc76c9139beff75d331c2b904f743f381f243d`; final CI #1775 (`30164974435`) succeeded on `b6781d30c3438b3daf908c3cb1f6d8eae2b3a0fc`
- Open PRs: #221 `feat(scenarios): implement focused Scenario Lessons UI` is Draft
- Active product branch/PR: `feat/issue-196-scenario-lessons-ui`, base `d7dc76c9139beff75d331c2b904f743f381f243d`, head `4dd453b77d171d24a17f148b853f2ebd99f28a66`, PR #221
- Current PR validation: CI #1803 (`30167307694`) completed with backend unit/security and integration success, but frontend core failed at TypeScript typecheck; diagnosis and a new final-head run are required
- Active product Issue: #196 Scenario Lessons UI; Issue #24 remains open for final Scenario product reconciliation

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, auth/session, account security, migrations, Docker and CI/CD foundations are implemented and protected by backend unit/race/integration/security gates.
- PWA shell, canonical App Router paths, browser history, route recovery and persistent runtime were completed by PR #113.
- Catalog, word/phrase detail, durable personal learning state and phrase deep links are in production.

### Learning core

- Due queue, spaced repetition, objective schema-v2 review events, durable offline review outbox and idempotency are implemented.
- Study, Recall and Choice are separate runtime and evidence modes.
- Progressive Lesson Composer was completed by PR #192.
- Canonical Active Lesson was completed by PR #208.
- Canonical Lesson Result, distinct-next protection and reload/history recovery were completed by PR #209.

### Retained-learning evidence

- PR #214 implemented canonical `/progress`, server-owned weekly evidence, retained knowledge, due backlog, weak topics, trend, recommendations and global/topic due Recall actions.
- PR #215 completed Issue #19 with weak part-of-speech evidence and direct server-owned recommendations.
- Full required CI and post-merge stage validation are green for these product slices.

### Scenario backend/content foundation

- PR #216 added six workplace scenario types, ordered steps, explicit outcomes and criteria, durable attempts, optimistic versioning, pause/resume/reload recovery, atomic step acceptance, fact/hypothesis storage, submission idempotency and ordinary Recall review-event persistence.
- PR #218 corrected the Scenario evidence ownership boundary: every seeded step has an immutable review target definition; public payloads expose only `reviewTarget.term`; accepted submissions resolve/create and enroll the concrete learning item atomically; correctness and rating are derived server-side; scheduler and review-event persistence remain centralized in the learning transaction writer.
- `api/openapi-scenarios.json` is the bounded OpenAPI 3.1 source of truth for all seven authenticated Scenario routes and is protected by a dependency-free Go source-contract test.
- PR #218 passed final CI #1770 on immutable head `1f5d4ac690d0527e28f057e66e9e7a86e6c6f542`, squash-merged as `15386321399f5386ff97d7d093c8a3c2777018be`, and deployed successfully to stage in run `30163844185`.
- Issue #24 remains open because Scenario frontend presentation, completion UX, Progress/recommendation reconciliation and final product acceptance are not complete.

### Agent Harness

- PR #217 added the root agent entrypoint, normative index, verified project state, skills registry, current-task memory, templates, lessons, README/PR integration and dependency-free source contract.
- PR #217 passed full CI #1756 after the confirmed GitHub Actions infrastructure incident was resolved.
- PR #219 reconciled merged Scenario evidence, reset `.agents/current/**` byte-for-byte from templates and passed full final-head CI #1773.
- PR #220 removed the self-invalidating current-`main` snapshot from repository memory and passed full final-head CI #1775.
- Harness foundation merge SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.

### Quality gates

Required contracts include backend unit/race/integration/security; frontend lint/type/build; Chromium/WebKit; Android/iOS PWA; keyboard/axe/reduced motion/200% zoom; route/history/recovery; CSP/service worker; Linux visual regression; bundle/performance; clean final-head CI and no unresolved review threads.

## In progress

PR #221 implements the active #196 Scenario Lessons UI slice on `feat/issue-196-scenario-lessons-ui`. It remains Draft and is not mergeable by process until the confirmed TypeScript failure is fixed, targeted gates pass, Linux visual baselines and measured bundle evidence are approved, full required CI succeeds on the final developer-authored head, and review-thread audit is clean.

## Remaining roadmap

### 1. #196 — Scenario Lessons UI; reconcile #24

- Implement the exact Figma-backed route island and active/completion states from nodes `76:100`, `76:127`, `76:219`.
- Use the merged server-owned Scenario contract without client-selected word IDs, client-authored correctness or duplicated scheduler logic.
- Cover direct entry, start/resume/pause, response retry preservation, fact/hypothesis interaction, completion, Back/Forward, mobile/desktop, Light/Dark, keyboard, axe, reduced motion, 200% zoom, Linux visuals and stage.
- Reconcile remaining Issue #24 acceptance criteria, including Progress/recommendation integration, only through explicit approved API and product contracts.

### 2. #197 — Dictionary catalog

Canonical Figma presentation for `/dictionary`, preserving URL filters, API and route-island semantics. Nodes `78:54`, `78:193`.

### 3. #198 — Word Detail

Canonical `/words/[id]` Figma presentation and direct-entry/loading/error/history contract. Nodes `78:99`, `78:274`.

### 4. #199 — Phrases design gap

Approve exact catalog/detail nodes before implementation; no production implementation from inferred design.

### 5. #200 — Profile

Canonical Profile/preferences/appearance presentation preserving auth/session/security ownership. Nodes `79:6`, `79:129`.

### 6. #18 and #201 — Adaptive personalization and First Use

Diagnostic onboarding, skip path, reason-coded personalized queue and balancing after stable catalog/scenario routes and approved Figma states.

### 7. #202 and #170 — System and offline states

Unified loading/empty/error/offline presentation and explicit network-loss/recovery UX.

### 8. #25 — Pronunciation, listening and custom terminology

Architecture/privacy decision first, then typed backend contract, scheduling, permission UX and import/export/deletion semantics.

### 9. #115 — Route-level client islands and budgets

Bundle inventory and gradual extraction of remaining routes without duplicated session/API/PWA ownership.

### 10. #70 — Legacy apps and CSS

Proven-dead app/CSS families only, coordinated with route ownership and guarded by browser/visual/bundle evidence.

### 11. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, perform route-by-route parity after product slices, and complete external moderated usability validation.

## Validation pending

- PR #221: TypeScript correction, keyboard safe-exit dialog contract, Linux compact Light and desktop Dark baselines, measured cold-route bundle evidence, full final-head CI, review audit, squash merge and post-merge stage validation.
- Progress/recommendation integration for completed Scenario attempts requires an explicit product contract and regression matrix in a later atomic slice.
- Phrases and First Use design gaps require approved Figma states before implementation.
- Final moderated usability evidence remains external work under #133.

## Blocked

- Phrases and parts of First Use remain blocked where exact approved Figma states are absent.
- Final usability closure is blocked on external moderated sessions (#133).

## Recent production/tooling evidence

1. #220 — `docs(agent): make project state durable across docs merges` → `d7dc76c9139beff75d331c2b904f743f381f243d`.
2. #219 — `docs(agent): reconcile state after Scenario contract merge` → `bb9a70f5d49e62d0aa44330eeb9f41f1ebe540f2`.
3. #218 — `fix(scenarios): own objective review targets on the server` → `15386321399f5386ff97d7d093c8a3c2777018be`.
4. #217 — `chore(agent): formalize LexiGo development harness` → `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.
5. #216 — `feat(scenarios): add durable scenario learning contract` → `f2785be459a04b87511ab8d9f26d60b3da15669b`.
6. #215 — `feat(progress): complete weekly weak-area recommendations` → `20188f7f64db066c599d2fd10daec965ce4a6e27`.
7. #214 — `feat(progress): add retained-learning evidence` → `ba4070833bb6c33fce4d86ee1a560105ee001d5c`.

## Evidence

- Live `main`, merged PR #220, Draft PR #221, current product head, CI #1803, Issues #12/#24/#196 and stage run `30165559836` were re-read at the verification timestamp.
- Stage currently runs images tagged with documentation-only main SHA `d7dc76c9139beff75d331c2b904f743f381f243d`; the latest product runtime change remains PR #218, while PRs #219/#220 changed repository memory only. API/frontend containers are healthy, public endpoints return HTTP 200 and 12/12 public Chromium/iOS WebKit checks passed.
- Exact Scenario runtime, migration, integration and bounded OpenAPI contracts are present in production history through PR #218.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
