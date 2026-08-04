# Current Task

## Identity

- Issue: #70.
- Branch: `style/issue-70-phrases-grid-ownership`.
- Base SHA: `c51b1d0ff41ec9cc3dfcfdfd1f7a8b1304937fb4`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Objective

Make the canonical `/phrases` result grid independent of `premium-ui.css` and `phrases.css` import order while preserving the compatibility fallback and approved one-column catalog presentation.

## Scope

- Audit exactly four reviewed `.lx-phrase-grid` conflicts: one `gap` and three responsive `grid-template-columns` declarations.
- Preserve `premium-ui.css` as the compatibility fallback owner.
- Add a stronger `.lx-app[data-route-client-island="phrases"] .lx-phrase-grid` canonical owner with the existing Phrases values.
- Extend fail-closed source evidence for manifest membership, renderer reachability, import order, specificity and values.
- Add Chromium computed-cascade evidence under production and adversarial stylesheet orders at 390, 760, 761, 1040, 1041 and 1440 px.

## Non-goals

- No redesign, card presentation, pagination, filtering, focus, History or API change.
- No visual snapshot/hash, route budget, tolerance or timeout change.
- No manifest deletion or reclassification; the four fallback conflicts remain reviewed `requires-proof` items.
- No Account Security, async-state or final semantic audit work.

## Allowed paths

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/phrases.css`;
- `frontend/components/phrases-css-ownership.test.ts`;
- `frontend/e2e/phrases-grid-cascade.spec.ts`;
- `frontend/package.json`.

## Prohibited paths

- `frontend/app/premium-ui.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- route/runtime component files;
- visual snapshots, expected hashes, budgets, workflows, dependencies, backend, API, migrations and deployment configuration;
- all unrelated feature stylesheets.

## Runtime owners

- `LexigoPhrasesApp` remains the dedicated route-island owner for `/phrases` and `/phrases/[slug]`.
- `PhrasesCatalog` remains the only production renderer of `lx-phrase-grid` and renders below `data-route-client-island="phrases"`.
- `premium-ui.css` remains the broad compatibility fallback.
- `phrases.css` remains the canonical Phrases presentation owner.

## Documentation owners

- Current task facts remain in `.agents/current/**`.
- Final merge/main/stage evidence belongs in `.agents/PROJECT_STATE.md` through a separate Agent Docs reconciliation.

## Invariants

- The live Phrases catalog remains one column with `gap: 10px` at every supported width.
- Premium fallback values and media boundaries remain unchanged.
- Production root import order remains unchanged.
- No `!important` is introduced.
- No horizontal overflow or route-focus regression is introduced.

## Acceptance criteria

- The manifest still contains exactly four reviewed premium → Phrases `.lx-phrase-grid` items, all classified `requires-proof`.
- Source contracts prove the route owner is more specific than the premium fallback and retains the approved values.
- Renderer evidence proves the grid exists only below the canonical Phrases island.
- Production, route-first/fallback-last and fallback-first/route-last orders produce identical computed grid snapshots at all six boundary widths.
- The browser proof is included in `test:e2e:ui` and `test:e2e:responsive`.
- Full immutable-head product CI passes without baseline, budget, tolerance or timeout changes.
- PR is expected-head squash-merged and exact-SHA main/stage validation succeeds.

## Required checks

- Agent Harness and overlap manifest/source contracts.
- Frontend lint, TypeScript, full unit/source suite, production build and dependency audit.
- Both UI shards, Phrases visual/accessibility, responsive, PWA, CSP, performance and container gates.
- Backend required gates.

## Risks

- Keeping only the unscoped `.lx-phrase-grid` owner would remain order-dependent.
- Removing premium fallback without compatibility proof could break fallback surfaces.
- Testing only one width would miss premium 760/761 and 1040/1041 transitions.

## Rollback

Revert the focused route owner and source/browser proof. Do not alter baselines, budgets, tolerances, timeouts or fallback declarations as rollback substitutes.
