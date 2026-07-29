# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-scenario-reachability`
- Base SHA: `8576c6645d31a4d4d4ef7b1aed5c2453f28d5d84`
- Head SHA: pending
- PR: pending

## Objective

Prove the authenticated Scenario catalog/detail route boundary before any compatibility deletion.

## Scope

- Add a source-level reachability contract for `/scenarios` and `/scenarios/[slug]`.
- Record canonical owners and the preserved guest authentication fallback in the compatibility cleanup manifest.

## Non-goals

- No runtime deletion.
- No auth/account extraction.
- No CSS changes, redesign, API changes or bundle-ceiling changes.

## Allowed paths

- `frontend/components/scenario-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime components, backend, API, migrations, stylesheets, visual baselines, workflows and deployment configuration.

## Runtime owners

- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-scenario-catalog-app.tsx`
- `frontend/components/lexigo-scenario-app.tsx`
- preserved fallback: `frontend/components/lexigo-premium-app.tsx`

## Documentation owners

- `frontend/docs/compatibility-cleanup.md`

## Invariants

- Guest Scenario entry remains redirected to `/profile` with `return_to`.
- Authenticated catalog/detail islands render before `LexigoPremiumApp`.
- Session restoration, account runtime and review outbox remain single owners.

## Acceptance criteria

- Exact route predicates and authenticated-session gates are executable assertions.
- Render ordering before the compatibility fallback is asserted.
- Canonical Scenario owners and preserved auth fallback are documented.

## Required checks

- Targeted Vitest source contract.
- Frontend lint, TypeScript, unit tests and production build.
- Full required CI including browser, visual/performance and container gates.

## Risks

- A brittle source marker could assert formatting instead of semantics.
- Guest redirect behavior must not be misclassified as dead fallback.

## Rollback

Revert the test and manifest-only commit; runtime is unchanged.
