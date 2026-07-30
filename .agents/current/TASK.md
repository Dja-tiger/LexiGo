# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-home-compatibility-boundary`
- Base SHA: `94836b3214dddccd58e249a342f0e56505bf2d7d`
- PR: pending

## Objective

Prove the two-sided Home route boundary before any compatibility deletion: `/` must select `LexigoHomeApp` before `LexigoPremiumApp`, while the exact legacy Home presentation candidate and shared fallback owners remain explicit.

## Scope

- Extend `home-route-island-source.test.ts` with root-route graph, render-order, canonical-owner and candidate/preservation assertions.
- Record the bounded Home compatibility manifest in current repository memory.

## Non-goals

- No runtime deletion.
- No Home, authentication, lesson, navigation, CSS, API, backend, workflow, visual baseline or bundle-ceiling changes.
- No work on open Dependabot PRs #304, #305 or #306.

## Allowed paths

- `frontend/components/home-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- `/` resolves to the Home graph for direct entry, reload and History restoration.
- `LexigoHomeApp` remains the canonical Home data, next-action and Figma presentation owner.
- `LexigoPremiumApp` remains live for guest authentication, account recovery, unknown-route fallback and shared Learn/Library/Profile/Lesson behavior.
- No compatibility marker is removed in this proof-only slice.

## Required checks

- Frontend lint, TypeScript, unit/source contracts and production build.
- Full required CI including browser matrix, accessibility, visual/performance and containers.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Rollback

Revert the source-contract and current-task documentation commits; runtime remains unchanged.
