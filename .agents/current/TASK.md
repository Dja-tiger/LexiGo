# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-fallback-bundle-isolation`
- Base SHA: `31c1f9cd9432bc5fd75a81c76e7f65d96e430e8b`
- PR: pending

## Objective

Add executable production-bundle evidence that the live `LexigoPremiumApp` compatibility fallback is isolated from canonical route islands.

## Scope

- Extend `frontend/e2e/route-bundle-budget.spec.ts` with one controlled unknown/product-route compatibility probe.
- Measure the probe through the same cold-browser production-build path as canonical route budgets.
- Derive the fallback-exclusive JavaScript asset set from observed network resources.
- Prove at least one fallback-exclusive asset exists.
- Prove no canonical route island loads any fallback-exclusive asset.
- Include the probe and exclusive-asset evidence in the existing route bundle report.

## Non-goals

- No runtime, routing, API, backend, CSS, dependency, workflow, visual baseline or budget-ceiling change.
- No complete deletion of `LexigoPremiumApp`.
- No claim that Library, Profile, Lesson, authentication, recovery or unknown-route behavior is dead.
- No static assertion against hashed chunk names.

## Allowed paths

- `frontend/e2e/route-bundle-budget.spec.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Existing canonical route budgets remain unchanged.
- Asset evidence is derived from production network requests, not source-map names or unstable hashes.
- The compatibility probe must render the real fallback (`.lx-app`) after session bootstrap.
- All existing canonical route readiness and error assertions remain intact.
- A missing fallback-exclusive chunk or a leaked fallback chunk fails the performance-budget gate.

## Validation

- Targeted route-bundle Playwright project against a production build.
- Frontend lint, TypeScript, unit tests, production build and dependency audit.
- Full browser/accessibility/visual/performance/container CI because the changed test is part of the authoritative performance gate.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Rollback

Revert the E2E/report and documentation changes. Runtime behavior and bundle composition remain unchanged.
