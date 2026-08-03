# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-global-css-overlap-inventory`
- Base SHA: `708403160cb35c1e155c5e3eabd2e5078e4826c4`
- PR: #362 — Draft discovery
- Initial discovery head: `e75fc8e0e36e2672aa6e725beaf1afa1a7612af6`
- Final head: resolve after the complete manifest is reviewed

## Objective

Create a fail-closed, repository-checkout-level inventory of remaining global feature-style conflicts where two different stylesheets imported by `frontend/app/layout.tsx` define the same normalized feature selector and property with different values, equal priority and overlapping media conditions.

This is a proof-only slice. It must identify the exact remaining source-order-sensitive surface before any additional production CSS correction.

## Scope

- Add `frontend/app/global-feature-style-overlap-source.test.ts`.
- Add `frontend/app/global-feature-style-overlap-manifest.json` as the small reviewed classification boundary consumed by the parser test.
- Parse the actual CSS import list from `frontend/app/layout.tsx` rather than maintaining a duplicate file inventory.
- Parse imported CSS without new dependencies, including nested media/supports/layer blocks, selector groups and declarations.
- Exclude keyframes and non-feature document/token selectors already covered by dedicated ownership contracts.
- Detect only high-confidence cross-file conflicts:
  - identical normalized feature selector;
  - identical property;
  - different normalized values;
  - equal `!important` priority;
  - overlapping recognized media constraints;
  - different imported CSS files.
- Emit a deterministic conflict identifier containing selector, property, files, conditions and values.
- Convert the discovered output into an explicit classified manifest before the final immutable head.
- Record exact execution evidence in `.agents/current/**`.

## Non-goals

- No production CSS, component/runtime TypeScript/TSX, markup, route, API/backend/database, session or Figma change.
- No import reorder, selector edit, declaration edit or stylesheet deletion.
- No snapshot, route-budget, workflow, dependency, README or architecture change.
- No claim that semantically overlapping but textually different selectors are safe; that is a later audit boundary.
- Do not close Issue #70 in this proof slice.

## Allowed paths

- `frontend/app/global-feature-style-overlap-source.test.ts`
- `frontend/app/global-feature-style-overlap-manifest.json`
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
- Existing Phrases and Home order-independence contracts remain unchanged.
- A discovered conflict is not automatically classified as a defect; each item requires explicit ownership review.

## Acceptance criteria

- Final diff contains only the five allowed paths.
- The source test reads every root-imported CSS file from the actual checkout.
- Every emitted manifest item is deterministic, cross-file and reproducible from selector/property/value/media evidence.
- The final JSON contains an explicit complete manifest and the test fails closed on addition, removal, mutation, invalid classification or empty evidence.
- Each manifest item is classified as already protected, intentional layering with an owner contract, or requiring a separate production proof slice.
- Frontend lint, typecheck, unit suite and production build pass on the final immutable head; all additional CI selected by the fail-closed classifier must also pass.
- Review surface is empty before Ready.
- Expected-head squash merge and exact-SHA main validation complete before Agent Docs reconciliation.
- No stage deployment is expected unless the classifier treats the test-only change as product scope; if stage runs, exact-SHA validation remains mandatory.

## Rollback

Revert the proof PR. Product code, deployed images, schemas, data, snapshots and budgets remain unchanged.
