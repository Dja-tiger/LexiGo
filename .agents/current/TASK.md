# Current Task

## Identity

- Issue: #70
- Branch: `agent/issue-70-final-acceptance-audit`
- Base SHA: `ec1295c5458f280998c08aaef53a9e68d3c4fc86`
- Head SHA: resolve from live branch ref
- PR: #382

## Objective

Close the remaining Issue #70 evidence gap with one centralized fail-closed semantic ownership and acceptance contract, without changing production runtime or presentation.

## Scope

- Restore the public architecture contract path already named by README and architecture documentation.
- Parse the reviewed exact-selector manifest and map every one of the 21 `requires-proof` items to exactly one stronger non-identical semantic owner family.
- Verify each family retains its focused source contract, adversarial computed-cascade browser proof and authoritative command registration.
- Reconcile the seven Issue #70 acceptance criteria with executable app-entry, global-style, bundle, visual, performance and public documentation evidence.
- Mount only `README.md` and `docs/` read-only into the isolated frontend CI task container so the public-document contract validates the real repository sources.
- Extend the existing frontend-container harness test with fail-closed read-only mount evidence.
- Run full immutable-head product CI, expected-head squash merge and exact-SHA stage/public validation.

## Non-goals

- No production CSS, component runtime, route, API, dependency, workflow, snapshot or budget change.
- No writable repository-root mount or public-document copy inside the frontend workspace.
- No deletion of intentionally live compatibility runtime.
- No redesign or visual baseline update.
- No unrelated Dependabot or product work.

## Allowed paths

- `frontend/components/architecture-documentation-contract.test.ts`
- `scripts/ci/frontend-container.sh`
- `scripts/ci/frontend-container.test.sh`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- production CSS and TypeScript runtime files
- `frontend/app/global-feature-style-overlap-manifest.json`
- bundle budgets and visual snapshots
- backend, API, migrations and deployment workflows

## Runtime owners

- `frontend/components/routed-lexigo-app.tsx` and `frontend/components/lexigo-bootstrapped-app.tsx` — canonical production application chain.
- Existing route islands and narrow `LexigoPremiumApp` compatibility fallback.
- Existing global-style owner files and stronger route/ancestor selectors already delivered by prior Issue #70 slices.

## Documentation owners

- `README.md` and `docs/architecture.md` — public frontend structure and ownership.
- `frontend/components/architecture-documentation-contract.test.ts` — executable public-document and final Issue #70 acceptance owner.
- `scripts/ci/frontend-container.sh` — read-only public-document availability inside isolated frontend tasks.
- `scripts/ci/frontend-container.test.sh` — shell-level mount, environment and lock contract.
- `.agents/PROJECT_STATE.md` after final product merge and stage validation.
- `.agents/current/**` during the active audit.

## Invariants

- Manifest totals remain 71: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Every `requires-proof` item maps to exactly one known proof family; no item is omitted or double-counted.
- Existing canonical owners, compatibility fallbacks, browser assertions and CI command registration remain unchanged.
- Production application entry, global document ownership, fallback-exclusive bundle evidence, route budgets, visual regression and documentation contracts remain executable.
- Public documents are mounted read-only and remain outside the mutable frontend Docker volume.
- The deployment-script check must prove both exact read-only mounts before the full product matrix is authoritative.
- No production behavior, generated baseline or deployment contract changes.

## Acceptance criteria

- Central registry covers resource stack (1), Async State (1), Learn switch (8), adaptive Lesson Composer (6), Phrases grid (4) and Account Security (1).
- Each registry entry proves the stronger semantic owner marker exists in production CSS and the focused source/browser evidence remains registered.
- The central contract reads the actual repository README and architecture document in local and isolated CI execution.
- The shell harness creates representative README/docs fixtures and asserts exact `:ro` mount arguments.
- The central contract fail-closes all seven Issue #70 acceptance criteria.
- Full immutable-head CI succeeds without changing baselines, budgets, tolerances or timeouts.
- Expected-head squash merge, exact-SHA main CI and exact-image stage/public validation succeed.

## Required checks

- Frontend Vitest source contracts, lint, TypeScript and production build.
- Deployment scripts check, including Bash syntax and read-only document mount behavior.
- Full browser, accessibility, visual, performance, PWA, CSP and container matrix.
- Backend required gates because this is a product/test PR.
- Exact-SHA main CI and stage/public validation after merge.

## Risks

- A registry predicate could overlap two families or silently miss a newly introduced exact conflict.
- String markers could be too weak and pass after a proof file stops protecting the intended owner.
- A documentation assertion could couple to prose without checking executable ownership.
- A broad or writable repository mount could weaken frontend workspace isolation; only the required public sources may be mounted read-only.
- A harness fixture that omits README/docs could produce a false infrastructure failure; the test must build the same minimum checkout shape required by production CI.

## Rollback

Revert the acceptance-contract test, the two read-only CI mounts, their shell contract and current Agent Harness records. No runtime, data, API, snapshot or deployment rollback is required.
