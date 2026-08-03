# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-complete-fallback-inventory`
- Base SHA: `3a6bf7686a2563c2828b9293b9ac381397274710`
- Head SHA: resolve from the live branch ref after each write
- PR: #354 (Draft)

## Objective

Complete the proof-only compatibility fallback inventory before any further runtime or CSS deletion.

The source contract must fail closed if a dedicated route island moves behind `LexigoPremiumApp`, if an island predicate disappears, or if the remaining live fallback/session/account boundaries are weakened.

## Scope

- Expand `frontend/components/compatibility-fallback-source.test.ts` to cover all nine dedicated route-island owners.
- Require the complete nine-predicate island selection inventory.
- Preserve exact remaining premium presentation dispatch for Library, Profile and Lesson.
- Preserve guest Profile through the authenticated-only Profile island predicate.
- Preserve shared Review Outbox, email confirmation and account panels outside route-island selection.
- Record exact branch and delivery evidence in `.agents/current/**`.

## Non-goals

- No production runtime, route behavior, CSS, API, backend, snapshot, performance ceiling, dependency, workflow, README or architecture change.
- No compatibility deletion in this proof-first slice.
- No claim that `LexigoPremiumApp`, `renderLibrary`, `renderProfile` or `renderLesson` is dead.
- No Home hero CSS deletion; the PR #355 candidate family remains a later separate slice.

## Allowed paths

- `frontend/components/compatibility-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially:

- production TypeScript/TSX and CSS
- snapshots and route-budget ceilings
- workflows and dependencies
- backend/API/database files
- `.agents/PROJECT_STATE.md`
- README, architecture and Figma artifacts

## Runtime owners

- Dedicated islands: Scenario Catalog, Scenario Detail, Home, Learn, Active Lesson, Dictionary/Word Detail, Phrases, Progress and authenticated Profile.
- Compatibility owners: Library, guest Profile/authentication recovery, Lesson and unknown/product-route fallback.
- Shared bootstrap owners: Review Outbox, email confirmation, account security, account email and account data panels.

## Invariants

- All nine dedicated route-island components render before `LexigoPremiumApp`.
- All nine selection predicates remain present.
- Guest Profile remains compatibility-owned through `initialSession === null` behavior.
- Library, Lesson and unknown/product-route fallback remain live.
- Shared account/session owners remain outside route-island ownership.
- PR #355 Home hero proof and deployed product state remain unchanged.

## Acceptance criteria

- Source contract covers all nine dedicated components and all nine predicates.
- Exact remaining premium presentation dispatch remains bounded to Library, Profile and Lesson.
- Guest Profile, Library, Lesson, unknown fallback and shared account/session owners are positively protected.
- Final diff contains only the four allowed paths.
- Full required CI passes on the final immutable developer-authored head after reconstruction onto `3a6bf768…`.
- Comments, reviews and unresolved review threads are empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Required checks

- Updated source-level Vitest contract.
- Frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration.
- Full browser matrix, accessibility, CSP, service worker, Lesson completion and Dictionary smoke.
- Authoritative Linux visual regression and route-performance budgets without updates.
- Web and API container builds.
- Exact-SHA stage deploy, public smoke and public browser validation.

## Rollback

Revert the proof-only PR. No runtime, schema, API, data or deployment rollback is required.
