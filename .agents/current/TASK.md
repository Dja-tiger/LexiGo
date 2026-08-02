# Current Task

## Identity

- Issue: #70
- Branch: `style/issue-70-remove-themed-card-selectors`
- Base SHA: `6e5f66953f1e0dbda7e48b5f98d9bd97e6731ebd`
- Head SHA: resolve from live branch ref
- PR: #352 (Draft)

## Objective

Delete only the proven-orphaned `.lx-themed-home` and `.lx-themed-library` CSS selector members while preserving all live themed selector, symbol, arrow, collection-theme and accessibility owners.

This is a deletion-only presentation cleanup. It must not change runtime behavior, route ownership, layout imports, approved visual baselines or performance ceilings.

## Scope

- Remove `.lx-themed-home` and `.lx-themed-library` from `themed-vocabulary.css`.
- Delete themed blocks whose complete selector ownership is limited to those two orphaned classes.
- Remove only those two selector members from shared focus and reduced-motion groups.
- Convert `themed-card-orphan-source.test.ts` from bounded-presence proof to physical-absence proof.
- Retain executable-consumer and declaration protection for live themed owners.
- Record implementation and CI evidence in `.agents/current/**`.

## Non-goals

- No production TypeScript/TSX runtime, route, navigation, session, PWA, API, backend or database change.
- No redesign, declaration-value change or CSS import-order change.
- No visual baseline or route-budget ceiling update.
- No deletion of `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow` or collection-prefixed selectors.
- No change to guest Profile, Library, Lesson or unknown-route compatibility boundaries.
- No dependency, workflow, README, architecture, Figma or Issue-state change.

## Allowed paths

- `frontend/app/themed-vocabulary.css`
- `frontend/app/accessibility-focus.css`
- `frontend/app/accessibility-navigation.css`
- `frontend/components/themed-card-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially:

- production TypeScript/TSX
- snapshots and route-budget ceilings
- `frontend/app/layout.tsx`
- workflows and dependencies
- backend/API/database files
- README, architecture and Figma artifacts

## Runtime owners

- No runtime owner changes.
- `LexigoLearnApp` remains an executable consumer of `.lx-themed-selector` and `.lx-themed-symbol`.
- Compatibility Library presentation remains an executable consumer of `.lx-themed-symbol` and `.lx-themed-arrow`.
- Collection-prefixed classes remain live themed symbol owners.

## Documentation owners

- `.agents/current/**` records only this atomic slice.
- `.agents/PROJECT_STATE.md` is updated separately after product merge and exact-SHA stage validation.

## Invariants

- Actual-checkout evidence must continue to show zero executable consumers of both retired class names.
- All occurrences of `.lx-themed-home` and `.lx-themed-library` must be physically absent from the three CSS owners after deletion.
- `.lx-themed-selector` retains cursor, selected-state and accessibility focus ownership.
- `.lx-themed-symbol`, `.lx-themed-arrow` and collection-specific declarations remain unchanged.
- Shared accessibility groups retain every live selector and declaration body.
- `layout.tsx` import order remains unchanged.
- Authoritative Linux visual hashes and route-performance budgets remain unchanged.

## Acceptance criteria

- The two retired class names have zero executable consumers and zero CSS occurrences.
- Dead cursor members, hover-arrow rule, overflow block, pseudo-element block and child-layer block are removed without changing live declaration values.
- Shared focus groups retain `.lx-themed-selector` and all unrelated selectors.
- Reduced-motion group retains all unrelated selectors and no retired themed-card members.
- Source contract fails closed on any reintroduction of the retired class names.
- Final diff contains only the seven allowed paths and is deletion-dominant for production CSS.
- Full required CI passes on the final immutable developer-authored head.
- Linux visual regression and performance budgets pass without baseline or ceiling updates.
- Comments, reviews and unresolved review threads are empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Required checks

- Updated source-level Vitest contract.
- Frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration.
- Full Chromium/WebKit/Android/iOS browser matrix, accessibility, CSP, service worker, Lesson completion and Dictionary smoke.
- Authoritative Linux visual regression and route-performance budgets.
- Web and API container builds.
- Exact-SHA stage deploy, public smoke and public browser validation.

## Risks

- Removing `.lx-themed-arrow` itself instead of only dead parent-scoped hover rules.
- Dropping `.lx-themed-selector` from a shared focus group while removing adjacent retired members.
- Changing declaration values or selector specificity for live owners.
- Accepting indexed search as final evidence instead of actual-checkout source contract.
- Updating visual snapshots to hide an unintended cascade change.

## Rollback

Revert the product PR. The previous orphaned selectors can be restored without schema, data or API rollback.
