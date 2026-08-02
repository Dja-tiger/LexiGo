# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-themed-card-orphan-proof`
- Base SHA: `9001982fa6cf917741a455c84d78fe06b23a2045`
- PR: #350 (Draft)

## Objective

Add executable source evidence that the legacy `.lx-themed-home` and `.lx-themed-library` CSS selector family has no production TypeScript/TSX consumer, while preserving the live `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow`, collection-theme and accessibility owners.

This is a proof-only atomic slice. It does not delete or rewrite CSS.

## Scope

- Add one source-level Vitest contract that recursively scans executable `frontend/app`, `frontend/components` and `frontend/lib` TypeScript/TSX.
- Exclude test/spec files and strip comments before consumer analysis.
- Require zero executable production consumers of `lx-themed-home` and `lx-themed-library`.
- Bound the exact legacy selector inventory across `themed-vocabulary.css`, `accessibility-focus.css` and `accessibility-navigation.css`.
- Protect live consumers and declarations for `lx-themed-selector`, `lx-themed-symbol`, `lx-themed-arrow` and collection-specific symbol themes.
- Record exact implementation and CI evidence in `.agents/current/**`.

## Non-goals

- No deletion or modification of any CSS file.
- No selector specificity, import order, declaration value, visual baseline or route-budget change.
- No production React/runtime, route, navigation, session, PWA, API, backend, database, dependency, workflow, README, architecture or Figma change.
- No claim that Issue #70 is complete.

## Allowed paths

- `frontend/components/themed-card-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially:

- `frontend/app/themed-vocabulary.css`
- `frontend/app/accessibility-focus.css`
- `frontend/app/accessibility-navigation.css`
- production TypeScript/TSX
- snapshots and route-budget ceilings
- workflows, dependencies, backend/API and public documentation

## Owners and boundaries

- `lx-themed-selector`: live Learn route collection selector.
- `lx-themed-symbol`: live collection identity presentation.
- `lx-themed-arrow`: live compatibility Library affordance.
- `.lx-themed-home` and `.lx-themed-library`: legacy candidate selectors whose reachability is being proven, not removed, in this slice.
- Accessibility focus and reduced-motion styles remain independent owners and must be reduced surgically in any future deletion.

## Invariants

- Source search evidence must come from the actual checkout, not GitHub indexed search alone.
- Tests/specs and comments must not count as production consumers.
- The proof must distinguish the candidate card selectors from live themed selector/symbol/arrow tokens.
- Existing Learn collection selection, compatibility Library affordances, accessibility focus and reduced-motion behavior remain byte-for-byte unchanged.
- A future deletion PR must preserve all live selector members in grouped accessibility and themed-vocabulary rules.

## Acceptance criteria

- The new contract finds zero executable production consumers of both candidate class names.
- Exact candidate occurrence counts and selector blocks are bounded in all three CSS files.
- Live themed selector, symbol, arrow and collection markers remain mandatory and have executable consumers.
- Final diff contains only the four allowed paths.
- Full required CI passes on the final immutable developer-authored head.
- Comments, reviews and unresolved review threads are empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Required checks

- New source-level Vitest contract.
- Frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration.
- Full browser matrix, accessibility, CSP, service worker, iOS PWA, Linux visual regression and performance budgets.
- Web and API container builds.

## Risks

- Treating the live `.lx-themed-arrow` token as orphaned because only its card-scoped hover rules are candidates.
- Counting CSS/test/comment references as production consumers.
- Weakening accessibility focus or reduced-motion groups in a future deletion.
- Inferring the entire `themed-vocabulary.css` file is dead when selector/symbol/collection rules remain live.

## Rollback

Revert the proof PR. No production CSS or runtime behavior changes in this slice.
