# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-learning-switch-placement`.
- Base SHA: `cc3636872f47c44948d9be5f3aec4784fb2c5a79`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Objective

Make Learn-route placement of the shared Lessons/Scenarios switch independent of `scenario-catalog.css` and `learning-section-switch.css` import order while preserving the Scenario Catalog presentation and all approved desktop, tablet, compact and narrow geometry.

## Scope

- Audit the eight reviewed `scenario-catalog.css` → `learning-section-switch.css` exact-selector conflicts for `.lx-learning-section-switch--learn`.
- Preserve Scenario Catalog as the shared visual-shell and compatibility-fallback owner.
- Scope every Learn placement declaration below canonical `.lx-routed-app[data-route-path="/learn"]` ancestry.
- Preserve the existing widths, margins, safe-area offsets and media boundaries at global, 720–1099px, 1024px+, 719px- and 360px- ranges.
- Extend the existing Chromium computed-cascade matrix with the live Learn switch markup and both stylesheets under production and adversarial orders.
- Keep the reviewed 71-item manifest unchanged; its eight switch items remain `requires-proof` and are satisfied by companion source/browser evidence.

## Non-goals

- No Scenario Catalog card, recommendation, navigation chrome or route-runtime change.
- No shared switch visual redesign, copy, accessibility semantics or link behavior change.
- No declaration-value, breakpoint, root import-order, manifest JSON, snapshot, budget, tolerance or timeout change.
- No Phrases, adaptive-layout, Account Security, async-state or final Issue #70 reconciliation work.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/learning-section-switch.css`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

## Prohibited paths

- `frontend/app/scenario-catalog.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/layout.tsx`;
- route component/runtime files;
- visual snapshots and expected hashes;
- bundle budgets, workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated route and feature stylesheets.

## Runtime owners

- `scenario-catalog.css` owns shared switch appearance and compatibility fallback placement.
- `.lx-routed-app[data-route-path="/learn"] .lx-learning-section-switch--learn` owns production Learn placement.
- Scenario Catalog renders `.lx-learning-section-switch` inside its route heading and remains unaffected by Learn-specific selectors.
- Route Chrome renders `.lx-learning-section-switch lx-learning-section-switch--learn` only for pathname `/learn`.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final merge/main/stage evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.

## Invariants

- Production import order remains `scenario-catalog.css` before `learning-section-switch.css`.
- At 361–719px the Learn switch remains `calc(100% - 48px)`, centered, with the 76px safe-area-aware top offset.
- At 360px and below it remains `calc(100% - 32px)`.
- At 720–1023px it remains aligned to the 104px navigation rail with the existing 48px/24px horizontal offsets and 860px ceiling.
- From 1024px it remains aligned to the 220px Foundation rail with the existing 40px outer spacing and 1180px ceiling.
- Shared switch visual properties and Scenario route layout remain unchanged.
- Exactly one primary navigation remains visible and no horizontal overflow is introduced.
- No `!important` or media-boundary broadening is added.

## Acceptance criteria

- All Learn placement selectors in `learning-section-switch.css` use canonical `/learn` route ancestry.
- The reviewed manifest still contains exactly eight `scenario-catalog.css` → `learning-section-switch.css` items, all `requires-proof` and all for `.lx-learning-section-switch--learn` placement properties.
- Source contracts protect the route-only renderer, stylesheet import order, selector specificity and unchanged values/breakpoints.
- Production, learning-first/scenario-last and scenario-first stylesheet orders produce identical switch and shell snapshots at 360, 390, 719, 720, 1024 and 1440px.
- Scenario Catalog visual regression and full route/browser matrix remain unchanged.
- Full immutable-head product CI passes without baseline, budget, tolerance or timeout changes.
- PR has no unresolved review surface and is expected-head squash-merged.
- Exact-SHA main CI and exact-SHA stage/public validation succeed after merge.

## Required checks

- Agent Harness and fail-closed overlap parser/manifest contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Focused Chromium computed-cascade matrix in both authoritative UI commands.
- Full browser, Linux visual, accessibility, CSP, PWA, Dictionary, Lesson and performance gates.
- Backend required gates and API/Web container builds.

## Risks

- Scoping only some responsive blocks would leave one source-order-dependent range.
- Changing the shared `.lx-learning-section-switch` selector would alter the Scenario Catalog route.
- Testing only production import order would not prove the eight fallback conflicts harmless.
- Absolute pixel assertions without route ancestry could accidentally validate the fallback instead of the canonical owner.

## Rollback

Revert the focused route-scoping and companion proof. Do not change values, breakpoints, snapshots, hashes, tolerances, timeouts or budgets as rollback substitutes.
