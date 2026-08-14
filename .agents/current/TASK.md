# Current Task

## Identity

- Issue: maintenance follow-up to Dependabot PR #479
- Branch: `chore/next-16-3-fresh-main`
- Base SHA: `c3ba8a8756170171b8a40d10ac807a1886749eed`
- Head SHA: resolve from live branch ref
- PR: pending fresh-main delivery PR; original Dependabot input is #479

## Objective

Upgrade the production Next.js runtime from `16.2.11` to `16.3.0` on the current `main` while preserving all existing LexiGo route, PWA, security, accessibility, visual, performance and deployment contracts.

## Scope

- Refresh the Next.js runtime dependency and machine-generated lockfile graph from the current base.
- Preserve React/React DOM `19.2.8`, Playwright `1.62.1`, `eslint-config-next 16.3.0`, `js-yaml 4.3.1` and all previously delivered runtime/tooling behavior.
- Validate production build, full browser matrix, authoritative visual/accessibility/performance/security/PWA/service-worker gates, containers, exact-main CI and Stage/public UI.

## Non-goals

- No React, Playwright, ESLint, Redis or other unrelated dependency upgrades.
- No route redesign, CSS cleanup, architecture refactor, API/schema change or visual baseline update.
- No production deployment or CSP enforcement promotion.

## Allowed paths

- `frontend/package.json`
- `frontend/package-lock.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime/application source outside the two dependency files unless a reproducible Next.js 16.3.0 regression proves a minimal required compatibility fix and the scope is explicitly re-audited before writing.
- `.github/workflows/**`, `deploy/**`, API/backend source, CSS, Figma assets and visual snapshots.

## Runtime owners

- Next.js App Router runtime under `frontend/app/**`.
- Persistent route shell and session bootstrap under `RoutedLexigoApp` / `LexigoBootstrappedApp`.
- Route-specific client islands documented in `README.md` and `docs/architecture.md`.
- PWA/service-worker/security/header owners remain unchanged.

## Documentation owners

- `.agents/current/**` for this execution record.
- Final verified outcome will be promoted to `.agents/PROJECT_STATE.md` in a separate post-delivery Agent Docs reconciliation.

## Invariants

- Current canonical route ownership and Browser Back/Forward semantics remain unchanged.
- React/React DOM remain `19.2.8`.
- Playwright package/images remain `1.62.1`.
- `eslint-config-next` remains `16.3.0`.
- `js-yaml` remains `4.3.1`.
- No visual baseline changes are accepted for a dependency-only runtime upgrade.
- Final CI evidence must belong to one frozen developer-authored head.

## Acceptance criteria

- Dependency graph contains Next.js `16.3.0` and its matching `@next/*` / SWC runtime graph without unrelated lockfile drift.
- Locked install, lint, typecheck, unit tests and production build pass.
- Chromium, WebKit, Android Chromium and iOS WebKit product journeys pass.
- Browser-owned zoom, accessibility, visual regression, performance budgets, CSP/content security, PWA and service-worker suites pass with existing baselines/contracts.
- API/web containers build successfully.
- PR is review-clean and merged with expected-head protection.
- Exact-main CI and Stage/public endpoint + public browser validation pass on the resulting merge SHA.

## Required checks

- Repository classifier / Agent Harness validation.
- Frontend core including locked install, lint, typecheck, unit, production build and dependency audit.
- Full required Playwright/browser matrix including authoritative visual/a11y/performance/security/PWA/service-worker gates.
- Existing backend unit/security and PostgreSQL/Redis integration gates selected by full CI.
- API/web container builds.
- Post-merge exact-main CI and Stage validation.

## Risks

- App Router/RSC behavior changes in Next.js 16.3.0.
- Turbopack/build output differences.
- Transitive runtime changes including `postcss` and `sharp` ranges in the Next.js dependency graph.
- Browser history, server rendering, standalone/container or service-worker regressions that only appear in E2E/Stage.

## Rollback

Revert the dependency-only delivery merge to restore Next.js `16.2.11` and its prior lockfile graph. Do not weaken browser/security/visual gates or patch production behavior unless a reproducible 16.3.0 compatibility defect is classified and scoped separately.
