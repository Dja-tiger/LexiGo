# LexiGo Project State

## Verification

- Last verified: 2026-07-25 14:20 Europe/Berlin
- Repository: `Dja-tiger/LexiGo`
- Main SHA: `f2785be459a04b87511ab8d9f26d60b3da15669b`
- Stage SHA: `f2785be459a04b87511ab8d9f26d60b3da15669b`; Issue #12 reports deploy, public smoke and public browser success in run `30157188680`
- Latest merged PR: #216 `feat(scenarios): add durable scenario learning contract`
- Open PRs: #217 `chore(agent): formalize LexiGo development harness` (Draft)
- Active product branch: none verified; `agent/issue-19-weekly-evidence-completion` is absent
- Active product Issue: #24 remains open after its backend/content contract slice; next UI slice is #196
- Active product PR: none
- Harness branch: `chore/agent-harness-v1`
- Harness PR: #217 (Draft)

## Completed

### Platform foundations

- Auth, session runtime, refresh/logout and account security are present in `main`; README and architecture identify Go API, PostgreSQL, Redis, persistent session bootstrap and PWA runtime as production owners. Representative evidence includes PR #116 for account/privacy controls.
- PostgreSQL migrations, Redis integration, readiness/liveness, Docker images and CI/CD foundations are documented in `README.md` and protected by backend unit, race, integration and security gates.
- PWA shell, canonical App Router paths, browser history, route recovery and persistent runtime were completed by PR #113 (`ceb4f58791a896f3e5a9e67b3ce9c8c545b44bab`) with route/history/PWA regression coverage.
- Catalog and durable personal learning data are in production. Representative evidence: PR #111 (`950e44ef01bc80f867ab8897c1ad459e5f3b1299`) for browsable catalog and word details; phrase deep links were added by PR #136 (`41581b456d116ab964621e712befc942c706c346`).

### Learning core

- Due queue, spaced repetition, objective review events, durable offline review outbox and idempotency are implemented. Representative evidence includes PR #108 (`da96a41386617432d15ce61de4cade43c0756762`) and the review-event contracts exercised by later Progress and Scenario integration suites.
- Study, Recall and Choice are separate runtime and evidence modes.
- Progressive Lesson Composer was completed by PR #192 (`c384d520b6eab1ef117913c0799e4c247c15fd1a`).
- Canonical Active Lesson for Study, Recall and Choice was completed by PR #208 (`7a6f74f4975c83662cf68713c8ee2055bf25cb97`) with unit, browser, axe and visual coverage.
- Canonical Lesson Result, distinct-next protection, reload/history recovery and objective evidence separation were completed by PR #209 (`7f27961a14e9bb6d18ddf51c198faa2b1787fa29`).
- Lesson creation concurrency and distinct-next behavior were hardened by PR #179 (`921bfef35cf1aafd78e421e2d802c676cdb52de4`).
- Academic Technical English lessons were connected to composition and persistence by PR #180 (`8938fdaf406965d93d181cf5cadabd29168c757a`).

### Retained-learning evidence

- PR #214 (`ba4070833bb6c33fce4d86ee1a560105ee001d5c`) implemented the canonical `/progress` route, server-owned weekly evidence from persisted `review_events`, timezone-aware boundaries, separate Recall/Choice/Study metrics, retained knowledge, current/previous week comparison, seven-day trend, weak technical topics, strong topic, due backlog, global/topic due Recall CTA, no-data states, accessibility, mobile/WebKit contracts and reviewed Linux visual baselines.
- Full CI #1738 (`30151511471`) passed on final head `8612c70c2281b995c1295ec246c9e1fe1b6746d6`.
- PR #215 (`20188f7f64db066c599d2fd10daec965ce4a6e27`) closed Issue #19 by adding objective weak part-of-speech evidence, no more than three direct recommendations and source-filtered due Recall lessons.
- Full CI #1740 (`30155142501`) passed on final head `f1bef9f5fa0e63f4b7bdea8f7fda4e14687dbc87`.
- Issue #19 is closed as completed. The historical branch `agent/issue-19-weekly-evidence-completion` is no longer present.

### Scenario backend/content contract

- PR #216 (`f2785be459a04b87511ab8d9f26d60b3da15669b`) added six durable workplace scenario types, explicit outcomes and completion criteria, ordered production/revision/fact-hypothesis/final-message steps, optimistic versioning, pause/resume/reload recovery, atomic step acceptance, schema-v2 Recall review events, submission idempotency and integration coverage.
- PR #216 final head `b2b5e0bba45d7a02eeef65641b63c02959b7d44a` passed CI #1744 (`30155964976`) and had no unresolved review threads.
- Issue #24 remains open because frontend Scenario presentation and end-to-end product completion are separate work.

### Quality gates

- Blocking accessibility and Linux visual regression release gates were established by PR #125 (`e58b88dfcb76099d5520ecdc356681a656be8616`).
- Current required contracts include Chromium, desktop WebKit, Android Chromium, iOS WebKit, keyboard, axe, reduced motion, 200% zoom, route/history recovery, PWA, visual comparison, bundle/performance, dependency, CSP and service-worker gates.
- The detailed reusable failure categories and prevention rules remain in `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md` and `.agents/AGENTS.issue-19-completion.md`.

## In progress

### Agent Harness V1

- Branch: `chore/agent-harness-v1`
- Base: `f2785be459a04b87511ab8d9f26d60b3da15669b`
- Scope: repository memory, skills registry, current-task records, templates, lessons, documentation, PR checklist and a dependency-free source-contract script.
- Production behavior must remain unchanged.

### Issue #24 / #196 handoff

- Backend/content contract is merged through PR #216.
- Remaining product work is Scenario Lessons presentation and interaction in Issue #196, followed by Progress/recommendation integration and final acceptance reconciliation for Issue #24.
- No active product branch or PR was verified during this harness pre-flight.

## Remaining

The order below reflects current dependencies, not the stale historical sequence.

### 1. #196 — Scenario Lessons UI; complete #24

- Done: durable backend/content contract and integration tests in PR #216.
- Remaining: exact Figma-backed route, entry/active/completion states, pause/resume UI, fact/hypothesis interaction, accessible mobile/desktop Light/Dark behavior, browser history and visual baselines.
- Dependencies: merged PR #216; exact nodes `76:100`, `76:127`, `76:219`; existing lesson/review contracts.
- Next atomic slice: Scenario route island and typed client/presentation contract without redesigning Progress or scheduler.
- Closure evidence: targeted unit/E2E, Chromium/WebKit/Android/iOS, keyboard/axe/reduced motion/zoom, Linux visual, full CI, stage smoke, Issue #24 acceptance reconciliation.

### 2. #197 — Dictionary catalog

- Done: functional browsable catalog, URL-driven filters and word API exist from earlier PR #111.
- Remaining: canonical Figma production presentation for `/dictionary`, independent route ownership, final responsive/appearance/visual parity.
- Dependencies: exact Figma nodes `78:54`, `78:193`; route-island constraints.
- Next atomic slice: presentation-only catalog island retaining current API/history semantics.
- Closure evidence: search/filter/pagination/direct-entry browser matrix, accessibility, Linux visual and stage validation.

### 3. #198 — Word Detail

- Done: backend and shareable detail behavior exist.
- Remaining: canonical `/words/[id]` Figma presentation and complete direct-entry/loading/error/history contract.
- Dependencies: Dictionary contract; nodes `78:99`, `78:274`.
- Next atomic slice: isolated Word Detail presentation.
- Closure evidence: direct entry/reload/Back/Forward, accessibility, visuals and full CI.

### 4. #199 — Phrases design gap and implementation

- Done: phrase catalog routes and slug lookup exist.
- Remaining: approve canonical Figma catalog/detail screens, record node IDs, then implement separate frontend slice.
- Dependencies: Figma design review and Screen Map update.
- Next atomic slice: Figma-only handoff; no implementation before exact nodes exist.
- Closure evidence: approved mobile/desktop Light/Dark states, then route E2E/accessibility/visual parity.

### 5. #200 — Profile

- Done: auth, session, privacy and account-security backend/runtime exist.
- Remaining: canonical Profile/preferences/appearance presentation.
- Dependencies: nodes `79:6`, `79:129`; preserve security and session ownership.
- Next atomic slice: Profile route presentation without duplicating bootstrap.
- Closure evidence: account journeys, keyboard/axe, Light/Dark, mobile/desktop, full CI and stage.

### 6. #18 and #201 — Adaptive personalization and First Use

- Done: reliable review events, due queue, retained evidence and lesson composer foundations.
- Remaining: diagnostic onboarding, skip path, reason-coded personalized queue, balancing and first-use UI.
- Dependencies: #201 Figma gaps, server personalization contract, stable catalog/scenario routes.
- Next atomic slice: backend diagnostic/personalization contract or approved Guest Home/onboarding design, not both.
- Closure evidence: deterministic queue tests, first-use browser matrix, accessibility, stage validation and acceptance reconciliation.

### 7. #202 and #170 — System and offline states

- Done: PWA lifecycle, route-level boundaries and durable review outbox exist.
- Remaining: unified loading/empty/error/offline presentation, explicit network-loss UX and action availability.
- Dependencies: exact Figma states and route ownership.
- Next atomic slice: shared system-state contract and one route consumer.
- Closure evidence: online/offline transitions, recovery, iOS/Android PWA, accessibility, visuals and stage.

### 8. #25 — Pronunciation/listening/custom terminology

- Done: text learning scheduler and review-event foundation.
- Remaining: audio provider decision, listening event model, optional microphone permission, private custom vocabulary, import/export and deletion semantics.
- Dependencies: privacy/security review and product/architecture decision.
- Next atomic slice: architecture decision and typed backend contract.
- Closure evidence: ownership/scheduling/import/deletion tests, permission UX, privacy review and full CI.

### 9. #115 — Route-level client islands and budgets

- Done: persistent shell and `/progress` island demonstrate the target boundary.
- Remaining: independent Home, Learn, Phrases, Dictionary, Profile and Lesson chunks; bundle inventory/budgets; removal of duplicated state/API clients.
- Dependencies: route-specific product slices should land before broad cleanup; coordinate with #70.
- Next atomic slice: bundle inventory and one low-risk route island.
- Closure evidence: analyzer baseline, budgets, direct-entry/history/PWA matrix and no bootstrap duplication.

### 10. #70 — Legacy apps and CSS

- Done: production entry is documented; retired Active Lesson CSS was reduced by PRs #210 and #211; catalog header ownership was fixed by PR #212.
- Remaining: repository-wide import/dead-code audit, retirement of unused app roots and staged global CSS consolidation.
- Dependencies: #115 ownership map and visual baselines.
- Next atomic slice: one proven-dead app/CSS family with parser-aware source contract.
- Closure evidence: no production imports, visual/browser gates, bundle improvement and clean source contract.

### 11. #203, #205 and #133 — Handoff, visual parity and usability

- #203: maintain exact production source-of-truth nodes and archive parallel Figma variants.
- #205: perform route-by-route final visual parity after product slices are complete.
- #133: conduct moderated usability validation; automation cannot close this evidence gap.
- Closure evidence is external/manual by definition and must not be replaced with test results.

## Validation pending

- PR #216 post-merge stage validation is complete: Issue #12 reports deploy, public smoke and public browser success for `f2785be459a04b87511ab8d9f26d60b3da15669b` in run `30157188680`, including 12/12 Chromium and iOS WebKit checks and stale-build recovery.
- Harness PR #217 still requires full required PR CI, final-head review, squash merge and post-merge `main` validation. Runtime stage behavior is unchanged by this documentation-only diff, but live deployment status must still be re-read after merge.
- Manual device validation, route-by-route Figma parity and moderated usability remain separate evidence classes and must be tracked explicitly.

## Blocked

- No repository write blocker was found for the harness.
- Product UI work is blocked when exact Figma nodes or approved states are absent, notably #199 and parts of #201.
- Final usability closure is blocked on external moderated sessions (#133).

## Recently merged

1. #216 — `feat(scenarios): add durable scenario learning contract` → `f2785be459a04b87511ab8d9f26d60b3da15669b`.
2. #215 — `feat(progress): complete weekly weak-area recommendations` → `20188f7f64db066c599d2fd10daec965ce4a6e27`.
3. #214 — `feat(progress): add retained-learning evidence` → `ba4070833bb6c33fce4d86ee1a560105ee001d5c`.
4. #212 — `fix(frontend): preserve catalog header style ownership` → `86b1d4a31532bdb9b825a666018739366366b173`.
5. #210/#211 — retired Active Lesson CSS cleanup.

## Evidence

- Live repository and latest commits were verified through GitHub at the timestamp above.
- PR #214 body and CI record: full CI #1738.
- PR #215 body and CI record: full CI #1740; closes Issue #19.
- PR #216 body and workflow record: CI #1744 success; squash merge SHA `f2785be459a04b87511ab8d9f26d60b3da15669b`.
- Issue #12 is the deployment status source; it reports stage success for `f2785be459a04b87511ab8d9f26d60b3da15669b` in run `30157188680`.
- `README.md`, `docs/architecture.md`, `docs/roadmap.md` and all existing `.agents/AGENTS*.md` were read from the verified `main`.
- Indexed search is used only for discovery; final claims must be confirmed by exact files, PRs, Issues, commits, checks or artifacts.

## Update protocol

Update this file:

- before a new task when the verification block is stale;
- after every squash merge;
- after roadmap or dependency changes;
- after an Issue is closed, reopened or materially re-scoped;
- after stage or production deployment;
- after any discrepancy with live GitHub is found.

GitHub is authoritative when this file disagrees with live state. Correct the file in a dedicated branch before proceeding if the discrepancy changes task scope or safety. Do not encode a branch's own mutable head SHA as an immutable fact; always re-read the live ref.
