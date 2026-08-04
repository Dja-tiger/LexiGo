# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-adaptive-layout-ownership`.
- Base SHA: `ad577c1ab8dba6734d8172df7b5bb1fc151f2cf3`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Objective

Prove that the six reviewed `premium-ui.css` → `adaptive-layout.css` tablet conflicts cannot change the live Learn Lesson Composer because the dedicated `adaptive-lesson-composer.css` route owner has stronger specificity and supplies the approved geometry at every relevant boundary.

## Scope

- Audit exactly six manifest items for `.lx-setup-footer`, `.lx-setup-submit`, `.lx-source-selector` and `.lx-source-selector > button`.
- Preserve `premium-ui.css` and `adaptive-layout.css` as compatibility/adaptive fallbacks.
- Treat `.lx-main-content[aria-label="Обучение"]` rules in `adaptive-lesson-composer.css` as the canonical production owner.
- Add fail-closed source evidence for import order, renderer reachability, selector specificity, approved values and exact manifest membership.
- Add Chromium computed-cascade evidence under production and adversarial stylesheet orders at 719, 720, 760, 761, 767, 768, 1099 and 1100 px.
- Run the new browser proof through both authoritative UI and responsive commands.

## Non-goals

- No production CSS, declaration-value, breakpoint or root import-order change unless computed evidence proves a defect.
- No Lesson Composer runtime, preview, session, disclosure or copy change.
- No visual snapshot/hash, performance budget, tolerance or timeout change.
- No Phrases, Account Security, async-state or final Issue #70 reconciliation work.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/components/adaptive-layout-css-ownership.test.ts`;
- `frontend/e2e/adaptive-layout-cascade.spec.ts`;
- `frontend/package.json`.

## Prohibited paths

- `frontend/app/premium-ui.css`;
- `frontend/app/adaptive-layout.css`;
- `frontend/app/adaptive-lesson-composer.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/layout.tsx`;
- route/runtime component files;
- visual snapshots and expected hashes;
- bundle budgets, workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated route and feature stylesheets.

## Runtime owners

- `premium-ui.css` remains the broad compatibility fallback.
- `adaptive-layout.css` remains the generic 720–1099px min-width/overflow fallback.
- `adaptive-lesson-composer.css` owns live Learn composer presentation under `.lx-main-content[aria-label="Обучение"]`.
- `LexigoLearnApp` remains the dedicated Learn route-island renderer.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final merge/main/stage evidence belongs in `.agents/PROJECT_STATE.md` through a separate post-merge Agent Docs reconciliation.

## Invariants

- At 719–767px the canonical source selector remains one column, footer remains a one-column grid and submit remains a grid.
- At 768px and above the canonical source selector remains three columns, source buttons remain `auto minmax(0, 1fr)`, footer remains `display: contents` and submit remains a grid.
- The 720–1099px generic adaptive fallback remains available outside the canonical Learn owner.
- Production import order remains unchanged.
- No `!important` or media-boundary broadening is introduced.
- No horizontal overflow is introduced.

## Acceptance criteria

- The manifest contains exactly six `premium-ui.css` → `adaptive-layout.css` items for the four bounded selectors/properties, all classified `requires-proof`.
- Source contracts prove the canonical Lesson Composer selectors are more specific than both fallback selectors and preserve approved mobile/desktop values.
- The production renderer remains reachable only through the dedicated Learn route island and retains the `aria-label="Обучение"` ancestry used by the CSS owner.
- Production, canonical-first and fallback-last stylesheet orders produce identical computed snapshots at all eight boundary widths.
- The browser proof is included in `test:e2e:ui` and `test:e2e:responsive`.
- Full immutable-head product CI passes without CSS, baseline, budget, tolerance or timeout changes.
- PR has no unresolved review surface and is expected-head squash-merged.
- Exact-SHA main CI and exact-SHA stage/public validation succeed after merge.

## Required checks

- Agent Harness and fail-closed overlap manifest/source contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Focused Chromium computed-cascade proof in both authoritative UI commands.
- Full browser, Linux visual, accessibility, CSP, PWA, Dictionary, Lesson and performance gates.
- Backend required gates and API/Web container builds.

## Risks

- Testing only production import order would leave fallback-last regressions undetected.
- Asserting generic adaptive values instead of the canonical composer values would validate the wrong owner.
- Omitting 767/768 would miss the canonical mobile-to-desktop transition.
- Deleting fallback selectors without two-sided reachability evidence could break compatibility surfaces.

## Rollback

Revert the focused source/browser proof and package command registration. Do not alter production CSS, values, breakpoints, snapshots, hashes, tolerances, timeouts or budgets as rollback substitutes.
