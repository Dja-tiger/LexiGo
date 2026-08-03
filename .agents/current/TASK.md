# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-global-css-overlap-inventory`
- Base SHA: `708403160cb35c1e155c5e3eabd2e5078e4826c4`
- PR: #362 — Draft
- Initial discovery head: `e75fc8e0e36e2672aa6e725beaf1afa1a7612af6`
- Classified-manifest commit: `6f0dd8cce26c818f190c24564ab1c146702f01a8`
- Latest branch commit before this task update: `c1f43f2e3fae414246cfb61cafaa07aef0ff1bc5`
- Final developer-authored head: resolve from the live PR after current-context and manifest-contract commits complete

## Objective

Create a fail-closed, repository-checkout-level inventory of remaining global feature-style conflicts where different stylesheets imported by `frontend/app/layout.tsx` define the same normalized feature selector/property with different values, equal priority and overlapping media conditions.

This is a proof-only slice. It identifies and classifies the exact remaining source-order-sensitive surface before any additional production CSS correction.

## Scope

- Add `frontend/app/global-feature-style-overlap-source.test.ts`.
- Add `frontend/app/global-feature-style-overlap-manifest.json` as the complete reviewed classification boundary consumed by the parser test.
- Add `frontend/app/global-feature-style-overlap-manifest.test.ts` to fail-close manifest size, unique IDs, classifications and exact stylesheet-pair group counts.
- Derive the CSS import list from the actual root layout.
- Parse imported CSS without new dependencies, including nested media/supports/container/layer blocks, selector groups and declarations.
- Exclude keyframes, same-file layering and non-feature selectors outside `.lx-*` ownership.
- Detect only high-confidence cross-file conflicts:
  - identical normalized feature selector;
  - identical property;
  - different normalized values;
  - equal `!important` priority;
  - overlapping recognized media constraints;
  - different imported CSS files.
- Emit deterministic IDs containing selector, property, priority, files, conditions and values.
- Keep a complete explicit manifest with one reviewed classification and non-empty evidence per conflict.
- Record exact discovery and validation evidence in `.agents/current/**`.

## Reviewed inventory

- Total conflicts: 107.
- `intentional`: 50 accessibility-layer overrides.
- `requires-proof`: 57 unresolved source-order ownership candidates.
- `protected`: 0 in this exact-selector inventory.

Intentional groups:

- Scenario Lessons accessibility: 40.
- Lesson Composer accessibility: 5.
- Progress Evidence accessibility: 4.
- Knowledge Coach accessible route-rail target: 1.

Requires-proof groups:

- premium → adaptive navigation: 21.
- premium → mobile PWA fixes: 10.
- Scenario Catalog → Learning switch: 8.
- mobile PWA fixes → adaptive navigation: 6.
- premium → adaptive layout: 6.
- premium → Phrases grid: 4.
- account security → adaptive Home: 1.
- adaptive navigation → system states: 1.

## Non-goals

- No production CSS, component/runtime TypeScript/TSX, markup, route, API/backend/database, session or Figma change.
- No import reorder, selector edit, declaration edit or stylesheet deletion.
- No snapshot, route-budget, workflow, dependency, README or architecture change.
- No claim that semantically overlapping but textually different selectors are safe; that remains a later audit boundary.
- No production correction for any of the 57 `requires-proof` items in this PR.
- Do not close Issue #70 in this proof slice.

## Allowed paths

- `frontend/app/global-feature-style-overlap-source.test.ts`
- `frontend/app/global-feature-style-overlap-manifest.json`
- `frontend/app/global-feature-style-overlap-manifest.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially all production CSS and TypeScript/TSX, snapshots, `frontend/bundle-budgets.json`, workflows, dependencies, README, architecture and `.agents/PROJECT_STATE.md`.

## Invariants

- The CSS import inventory is derived from the actual root layout.
- The parser is deterministic and dependency-free.
- Keyframes and same-file layering are excluded from the cross-file manifest.
- Opposite recognized media states do not produce false overlap claims.
- Feature selectors are limited to selectors containing LexiGo class ownership (`.lx-`).
- The JSON manifest is runtime-validated and cannot bypass classification typing through an unchecked cast.
- Ordered actual conflict IDs must equal ordered manifest IDs exactly.
- The separate manifest contract owns exact total, classification totals and pair-group counts.
- Invalid classifications and empty evidence are rejected.
- Existing Phrases and Home order-independence contracts remain unchanged.
- A discovered conflict is not automatically treated as a defect; each item has explicit classification evidence.
- Production CSS remains byte-identical in this PR.

## Acceptance criteria

- Final diff contains only the six allowed paths.
- The source test reads every root-imported CSS file from the actual checkout.
- Every manifest item is deterministic, cross-file and reproducible from selector/property/value/media evidence.
- The manifest contains exactly 107 explicit unique items.
- Classification totals are exactly 50 `intentional`, 57 `requires-proof`, 0 `protected`.
- Exact stylesheet-pair group counts match the reviewed 12-pair inventory.
- The tests fail closed on conflict addition, removal or ID mutation, malformed manifest structure, unknown pair, incorrect classification, count drift or empty evidence.
- Frontend lint, typecheck, full unit suite, production build and dependency audit pass on the final immutable head.
- Every additional backend/browser/accessibility/visual/performance/container gate selected by the fail-closed classifier passes.
- No snapshot, budget, timeout, browser matrix, workflow or dependency update is used to make CI green.
- Review surface is empty before Ready.
- Expected-head squash merge and exact-SHA main validation complete before Agent Docs reconciliation.
- If stage runs because the test-only diff is product-classified, exact-SHA deploy/public validation is mandatory.

## Next boundary

After this proof PR and its reconciliation, select exactly one bounded production proof cluster. Preferred first cluster: navigation/mobile-shell ownership, including the exact 719/720/760 px boundary. Do not combine it with Learning switch, Phrases grid, adaptive layout, account-security or async-state corrections.

## Rollback

Revert PR #362. Product code, deployed images, schemas, data, snapshots and budgets remain unchanged.
