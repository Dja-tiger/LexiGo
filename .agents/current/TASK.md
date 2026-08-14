# Current Task

## Identity

- Issue: dependency maintenance; fresh-main delivery for stale Dependabot PR #403.
- Branch: `chore/frontend-dev-deps-fresh-main`
- Base SHA: `180e64624900c74ea64c5a99f9d185cf2ff0c5a9`
- Head SHA: resolve from live branch ref after final harness write; immutable-head CI must match that exact SHA.
- PR: create after dependency integration and read-back audit.

## Objective

Upgrade the frontend development dependency group from Dependabot PR #403 on the current repository base while preserving all later `main` changes and keeping Playwright package/container versions synchronized.

## Scope

- `@playwright/test` `^1.61.1` -> `^1.62.1`.
- `@types/react` `^19.1.0` -> `^19.2.18`.
- `@types/react-dom` `^19.1.0` -> `^19.2.4`.
- `eslint-config-next` `16.2.11` -> `16.3.0`.
- Synchronize Playwright container pins to `mcr.microsoft.com/playwright:v1.62.1-noble` in CI, Stage browser validation, visual-snapshot workflow and frontend container test script.
- Preserve current-main lockfile changes, especially `js-yaml 4.3.1`.

## Non-goals

No Next.js runtime upgrade from PR #479, no React runtime upgrade, no application feature changes, no Figma work, no production promotion, no unrelated workflow refactor.

## Allowed paths

`.agents/current/*`, `.github/workflows/ci.yml`, `.github/workflows/deploy-stage.yml`, `.github/workflows/update-visual-snapshots.yml`, `frontend/package.json`, `frontend/package-lock.json`, `scripts/ci/frontend-container.sh`.

## Prohibited paths

All other runtime, backend, migration, deployment, API, product and design files.

## Runtime owners

`frontend/package.json` and `frontend/package-lock.json` own the frontend development graph. Repository browser test execution is additionally version-pinned by the three workflow files and `scripts/ci/frontend-container.sh`.

## Documentation owners

`.agents/current/*` records task scope and immutable-head evidence. Durable project state is reconciled separately after runtime delivery.

## Invariants

- npm `@playwright/test` and every `mcr.microsoft.com/playwright` test image remain aligned at `1.62.1`.
- Current Node 22 frontend runtime remains compatible with Playwright 1.62.1's Node >=20 requirement.
- Current `js-yaml 4.3.1` lockfile resolution is preserved.
- Later workflow changes made after Dependabot's old base remain intact.
- Production Next.js stays at `16.2.11` in this slice.

## Acceptance criteria

- Final diff contains only allowed paths and the intended dependency/tooling delta.
- `package-lock.json` contains the Dependabot #403 graph plus current-main `js-yaml 4.3.1`.
- All Playwright package/image pins are internally consistent.
- Frontend lint/typecheck/unit/build/dependency audit, browser/E2E/visual/a11y/performance/security gates and relevant container checks pass on one immutable head.
- Review/thread audit is clean and final merge uses expected head SHA.
- Runtime-changing merge receives exact-main CI and Stage/public validation before reconciliation.

## Required checks

Repository CI selected for frontend dependency/workflow changes, including complete browser matrix and container publication; exact-main CI and Stage/public validation after merge.

## Risks

Playwright 1.62.1 changes browser tooling and its bundled browser revisions; `eslint-config-next` 16.3.0 changes lint rules/peer bounds. Because CI/Stage browser images are pinned separately from npm, partial upgrades can produce protocol/browser mismatches.

## Rollback

Revert the final squash merge to restore the 1.61.1 Playwright toolchain and prior frontend development dependencies.
