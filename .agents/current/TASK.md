# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-learn-boundary-v2`
- Base SHA: `d7a2c037040b1a1d8d978fa038b2528abd92661e`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Prove the two-sided Learn route boundary before any compatibility deletion: `/learn` must select `LexigoLearnApp` before `LexigoPremiumApp`, while the exact legacy Learn presentation candidate and shared lesson/auth/fallback owners remain explicit.

## Scope

- Extend `learn-route-island-source.test.ts` with render-order and compatibility candidate/preservation assertions.
- Record the bounded Learn compatibility manifest in current repository memory.

## Non-goals

- No runtime deletion.
- No Learn behavior, Active Lesson behavior, auth, navigation, CSS, API, backend, workflow, visual baseline or bundle-ceiling changes.

## Allowed paths

- `frontend/components/learn-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime implementation files.
- CSS, visual snapshots, deployment, backend, migrations and workflows.

## Runtime owners

- `LexigoBootstrappedApp`: route-graph selection and render order.
- `LexigoLearnApp`: canonical Lesson Composer data, mutation, presentation and History owner.
- `LexigoPremiumApp`: compatibility `renderLearn` candidate plus shared lesson/auth/fallback owners that remain live.

## Documentation owners

- `.agents/current/**`

## Invariants

- `/learn` continues to render `LexigoLearnApp` before the compatibility fallback.
- Active Lesson handoff remains on the product graph.
- Shared lesson creation, authentication, Library, Profile and Lesson owners remain available in `LexigoPremiumApp`.
- No runtime or visual behavior changes.

## Acceptance criteria

- Source contract proves Learn render order before `LexigoPremiumApp`.
- Source contract records legacy `renderLearn` and its dispatch as a bounded future candidate.
- Shared lesson/auth/fallback markers are explicitly preserved.
- Full required CI passes on the final head.

## Required checks

- Frontend source contract, lint, TypeScript, unit tests and production build.
- Full required browser, accessibility, performance and container CI.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- Treating shared lesson/auth code as Learn-only dead code.
- Breaking the Active Lesson product-graph handoff through over-broad assertions.

## Rollback

Revert the source-contract and current-memory commits; runtime remains unchanged.
