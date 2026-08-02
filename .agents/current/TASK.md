# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-dictionary-detail-selectors`
- Base SHA: `377d3d11ff5faf0c8fc95ac78f738add7bfac306`
- Delivery type: atomic CSS dead-code deletion

## Objective

Remove only the legacy `.lx-dictionary-detail*` selector arms that PR #336 proved have no executable production TypeScript/TSX consumers, while preserving every live grouped declaration and all current runtime, visual, accessibility and performance contracts.

## Evidence

- PR #336 introduced `dictionary-detail-orphan-source.test.ts` and proved zero comment-stripped production consumers of the `lx-dictionary-detail` prefix across `frontend/app`, `frontend/components` and `frontend/lib`.
- The exact bounded family contains 12 selectors in `frontend/app/dictionary-catalog.css`.
- `.lx-dictionary-result-heading*` shares three declaration blocks with legacy selector arms and must retain those declarations unchanged after the legacy arms are removed.
- `.lx-dictionary-translation` is independent of the proven prefix and remains unchanged.
- Stage currently runs product SHA `109ffd8dd39587a83e791ba195449a49bd084cbf` with successful deploy, public smoke and 12/12 public browser checks.

## Scope

- Delete only the 12 proven orphaned `.lx-dictionary-detail*` selector arms from `dictionary-catalog.css`.
- Where a legacy selector is grouped with `.lx-dictionary-result-heading*`, retain the live selector and declaration block byte-for-byte apart from removal of the orphaned selector arm and necessary separator formatting.
- Replace source-contract candidate-presence assertions with complete absence assertions.
- Preserve executable proof that production TypeScript/TSX contains no legacy prefix.
- Record factual execution and validation in `.agents/current/**`.

## Allowed paths

- `frontend/app/dictionary-catalog.css`
- `frontend/components/dictionary-detail-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime TS/TSX components and route ownership.
- API, backend, migrations and fixtures.
- Other CSS owners or import order.
- Visual snapshots and Figma baselines.
- Bundle/performance ceilings.
- Workflows, dependencies, README and architecture documents.

## Invariants

- `.lx-dictionary-result-heading`, `.lx-dictionary-result-heading span` and `.lx-dictionary-result-heading span[data-status]` remain with their existing declarations.
- `.lx-dictionary-translation` remains unchanged.
- No selector, declaration or cascade affecting mounted production markup changes.
- No runtime, navigation, session, History, API or accessibility semantics change.
- Authoritative Linux visual hashes remain unchanged and no snapshot is updated.
- Existing performance ceilings remain unchanged.

## Contract matrix

This is dead CSS deletion with no mounted consumer. Therefore direct entry, guest/auth, viewport, appearance, motion, input method, reload and Back/Forward behavior must remain identical. Validation must cover all configured browser projects, accessibility, Linux visual regression, Dictionary smoke, PWA, service worker and route performance budgets because any observed difference invalidates the orphan claim.

## Acceptance criteria

- Source contract requires zero production TS/TSX consumers and zero `.lx-dictionary-detail*` selector tokens in `dictionary-catalog.css`.
- The source contract explicitly protects the three live `.lx-dictionary-result-heading*` declaration blocks and `.lx-dictionary-translation` from accidental deletion.
- Final diff contains only the five allowed paths.
- Full authoritative CI passes on the final developer-authored head.
- Linux visual regression passes without baseline changes.
- Accessibility and performance budgets pass without contract changes.
- Reviews, comments and unresolved threads are empty before Ready.
- Expected-head squash merge succeeds.
- Exact merge SHA passes post-merge main CI and stage/public validation.

## Rollback

Revert the single cleanup PR, restoring the orphaned selector arms and the previous presence-oriented source contract.
