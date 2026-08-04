# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-account-security-width`.
- Base SHA: `8b6b2491a49c556d236a60018842cbf8318778ab`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Objective

Make the authenticated Account Security panel desktop width independent of `account-security.css` and `adaptive-knowledge-coach-home.css` import order while preserving mobile geometry and security behavior.

## Scope

- Audit the single reviewed `.lx-account-security` width conflict.
- Preserve the broad global Account Security fallback and the existing adaptive desktop fallback.
- Add a stronger `.lx-routed-app .lx-account-security` canonical desktop owner in `account-security.css` with the currently approved width and margins.
- Add fail-closed source evidence for manifest membership, runtime ancestry, import order, specificity and values.
- Add Chromium computed-cascade evidence under production and adversarial stylesheet orders at 719, 720, 1023, 1024, 1099, 1100 and 1440 px.

## Non-goals

- No account API, password/session flow, copy, focus or authentication change.
- No visual snapshot/hash, performance budget, tolerance or timeout change.
- No manifest deletion or reclassification.
- No async-state or final semantic audit work.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/account-security.css`;
- `frontend/components/account-security-css-ownership.test.ts`;
- `frontend/e2e/account-security-width-cascade.spec.ts`;
- `frontend/package.json`.

## Prohibited paths

- `frontend/app/adaptive-knowledge-coach-home.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- Account Security React/runtime/API files;
- visual snapshots, expected hashes, budgets, workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated stylesheets.

## Runtime owners

- `LexigoBootstrappedApp` remains the authenticated account-runtime owner.
- `AccountSecurityPanel` remains visible only on `/profile` and is rendered beneath `.lx-routed-app` beside the route app.
- `account-security.css` remains the shared panel presentation owner.
- `adaptive-knowledge-coach-home.css` retains the broad desktop-shell fallback.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final merge/main/stage evidence belongs in `.agents/PROJECT_STATE.md` through a separate Agent Docs reconciliation.

## Invariants

- Below 720px the panel retains `calc(100% - 24px)` and compact spacing.
- From 720px through 1023px the panel retains the global `min(1540px, calc(100% - 40px))` width.
- At 1024px and above the routed panel retains `min(1140px, calc(100vw - var(--ak-shell-rail-width) - 80px))` and the approved rail-aware margins.
- Production root import order remains unchanged.
- No `!important` is introduced.

## Acceptance criteria

- The manifest still contains exactly one `.lx-account-security | width` item classified `requires-proof`.
- Source contracts prove the routed owner is more specific than both unscoped fallbacks and retains approved values.
- Runtime evidence proves the visible panel is below `.lx-routed-app` and limited to `/profile`.
- Production, routed-first/fallback-last and fallback-first/routed-last orders produce identical computed width/margins at all seven boundary widths.
- The browser proof is included in `test:e2e:ui` and `test:e2e:responsive`.
- Full immutable-head product CI passes without baseline, budget, tolerance or timeout changes.
- PR is expected-head squash-merged and exact-SHA main/stage validation succeeds.

## Required checks

- Agent Harness and overlap manifest/source contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Account Security functional tests, both UI shards, visual/accessibility, responsive, PWA, CSP, performance and container gates.
- Backend required gates.

## Risks

- A rule scoped only by source order would remain fragile.
- Changing the unscoped fallback could affect compatibility or non-routed renderers.
- Omitting 1023/1024 would miss the desktop-shell transition.

## Rollback

Revert the focused routed owner and source/browser proof. Do not alter baselines, budgets, tolerances, timeouts or fallback declarations as rollback substitutes.
