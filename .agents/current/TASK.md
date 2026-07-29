# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-scenario-absence-contract`
- Base SHA: `eedd9dc4d978cd8f5b89d2d969a85cd181342e8f`
- PR: pending

## Objective

Protect the already-clean Scenario compatibility boundary from regression by proving that `LexigoPremiumApp` contains no Scenario route runtime.

## Scope

- Extend `scenario-route-island-source.test.ts` with an executable absence contract for Scenario API, state, lifecycle and presentation markers in `LexigoPremiumApp`.
- Preserve the existing canonical-owner and guest redirect assertions.

## Non-goals

- No runtime deletion or component changes.
- No authentication, CSS, API, backend, workflow, visual baseline or bundle-ceiling changes.

## Allowed paths

- `frontend/components/scenario-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Authenticated Scenario catalog/detail remain owned by dedicated islands.
- Guest Scenario entry remains redirected through the bootstrap authentication boundary.
- `LexigoPremiumApp` remains live for guest auth, recovery and unknown-route fallback, but may not regain Scenario route runtime.

## Required checks

- Frontend lint, TypeScript, unit tests and production build.
- Full required CI, browser matrix, performance, visual and container gates.

## Rollback

Revert the source-contract and current-task documentation commits; runtime is unchanged.
