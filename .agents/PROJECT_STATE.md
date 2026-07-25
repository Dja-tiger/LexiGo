# LexiGo Project State

## Verification

- Last verified: 2026-07-25 17:12 Europe/Berlin
- Repository: `Dja-tiger/LexiGo`
- Main SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Stage product SHA: `f2785be459a04b87511ab8d9f26d60b3da15669b`; Issue #12 reports deploy, public smoke and 12/12 public browser success in run `30157188680`
- Latest merged PR: #217 `chore(agent): formalize LexiGo development harness`
- PR #217 validation: full CI #1756 (`30160458210`) success on final head `d9bfc899abaecb94aa32d0d3b30db9231f13da77`; no unresolved review threads
- Active branch: `fix/issue-196-scenario-review-contract`
- Active Issue: #196, prerequisite contract correction for #24 before Scenario UI
- Active PR: #218 (Draft)
- PR #218 validation: CI #1760 (`30162517241`) succeeded on the corrected runtime head; final-head CI is pending after bounded OpenAPI and Agent Harness reconciliation

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
- PR #216 passed CI #1744 and stage run `30157188680` on merge SHA `f2785be459a04b87511ab8d9f26d60b3da15669b`.
- Issue #24 remains open because frontend Scenario presentation and final product reconciliation are not complete.

### Agent Harness

- PR #217 added the root agent entrypoint, normative index, verified project state, skills registry, current-task memory, templates, lessons, README/PR integration and dependency-free source contract.
- PR #217 passed full CI #1756 after the confirmed GitHub Actions infrastructure incident was resolved.
- Harness merge SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.

### Quality gates

Required contracts include backend unit/race/integration/security; frontend lint/type/build; Chromium/WebKit; Android/iOS PWA; keyboard/axe/reduced motion/200% zoom; route/history/recovery; CSP/service worker; Linux visual regression; bundle/performance; clean final-head CI and no unresolved review threads.

## In progress

### #196 prerequisite — server-owned Scenario review target

- Branch: `fix/issue-196-scenario-review-contract`
- PR: #218 (Draft)
- Base: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Confirmed defect: Scenario submit delegated arbitrary `wordId`, rating and submitted-answer evidence to the client although the step and approved Figma UI had no legitimate owner for those fields.
- Implemented correction: immutable target definitions on all 18 steps; public `reviewTarget.term`; transactional target word resolution/creation and enrollment; deterministic whole-term server judgement; centralized trusted learning transaction; strict rejection of historical client-authored review fields.
- Evidence: migration, learning/scenario unit tests, expanded end-to-end integration and bounded `api/openapi-scenarios.json` guarded by a dependency-free Go source-contract test.
- CI: #1760 succeeded after the only initial failure—two `gofmt` differences—was corrected. A new immutable final-head run is required after the OpenAPI/memory commits.
- Non-goals: no React/Figma/CSS, no scheduler-policy redesign, no dependencies/workflows/deployment and no visual baseline changes.

## Remaining roadmap

### 1. #196 — Scenario Lessons UI; reconcile #24

- After PR #218 lands, implement the exact Figma-backed route island and active/completion states from nodes `76:100`, `76:127`, `76:219`.
- Cover direct entry, start/resume/pause, response retry preservation, fact/hypothesis interaction, completion, Back/Forward, mobile/desktop, Light/Dark, keyboard, axe, reduced motion, 200% zoom, Linux visuals and stage.

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

- PR #218 final-head CI after bounded OpenAPI and repository-memory writes.
- PR #218 unresolved review-thread check and final metadata reconciliation.
- Post-merge stage deploy/public smoke/browser evidence for the migration and runtime API correction.
- Scenario React route, manual device validation, route-by-route Figma parity and moderated usability remain separate evidence classes.

## Blocked

- Scenario UI remains blocked until PR #218 is merged and its post-merge runtime is verified.
- Phrases and parts of First Use remain blocked where exact approved Figma states are absent.
- Final usability closure is blocked on external moderated sessions (#133).

## Recently merged

1. #217 — `chore(agent): formalize LexiGo development harness` → `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.
2. #216 — `feat(scenarios): add durable scenario learning contract` → `f2785be459a04b87511ab8d9f26d60b3da15669b`.
3. #215 — `feat(progress): complete weekly weak-area recommendations` → `20188f7f64db066c599d2fd10daec965ce4a6e27`.
4. #214 — `feat(progress): add retained-learning evidence` → `ba4070833bb6c33fce4d86ee1a560105ee001d5c`.

## Evidence

- Live repository, PRs, checks, Issues, branch and deployment status were re-read at the verification timestamp.
- Exact Scenario model, HTTP, repository, migrations, integration, learning transaction and bounded OpenAPI contract were inspected.
- Exact Scenario Figma nodes were inspected for the downstream UI contract.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after every squash merge, after roadmap/dependency changes, after material Issue changes, after stage/production deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not encode a branch's own mutable head SHA as immutable state.
