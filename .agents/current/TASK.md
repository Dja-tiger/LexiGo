# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-dictionary-detail-css-ownership`
- Base SHA: `5b4cab79d6030b01b1306fa1ca28666c95fb35fd`
- PR: #334

## Objective

Remove the obsolete `dictionary-detail-compatibility.css` ownership boundary while preserving every effective Dictionary catalog, Word Detail and persistent route-navigation declaration byte-for-byte in the corresponding canonical stylesheet.

## Verified finding

- `dictionary-detail-compatibility.css` no longer owns a compatibility presentation.
- Its Dictionary catalog variables, active-filter colors, status colors and compact filter-toggle correction belong to `dictionary-catalog.css`.
- Its `/words/[id]` example-heading dark contrast correction belongs to `word-detail.css`.
- Its `/words/[id]` active Library rail-label dark contrast correction belongs to `route-navigation.css`.
- `layout.tsx` still imported the compatibility file and `word-detail-source.test.ts` still treated it as the contrast owner before this slice.

## Scope

- Move the exact effective declaration groups to the three canonical owners.
- Remove the compatibility import and delete `dictionary-detail-compatibility.css`.
- Update the source contract to prove compatibility-file absence, canonical declaration ownership and unchanged selector/value text.
- Record the completed ownership consolidation in the compatibility delivery plan.

## Non-goals

- No component markup, route selection, History, API, backend or lesson behavior changes.
- No cleanup of the older `.lx-dictionary-detail-*` selector family in `dictionary-catalog.css`; that is a separate consumer-proof slice.
- No selector rename, declaration-value change, specificity increase, redesign, visual baseline promotion, budget-ceiling change or workflow modification.

## Allowed paths

- `frontend/app/layout.tsx`
- `frontend/app/dictionary-catalog.css`
- `frontend/app/word-detail.css`
- `frontend/app/route-navigation.css`
- `frontend/app/dictionary-detail-compatibility.css` (delete)
- `frontend/components/word-detail-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- All effective colors, variables and selector specificity remain unchanged.
- Dictionary and Word Detail Light/Dark, forced-colors, compact/desktop and 200% reflow presentation remain unchanged.
- Route navigation remains unchanged outside the exact `/words/[id]` active Library rail-label correction.
- Existing visual snapshots and route performance ceilings remain unchanged.

## Acceptance criteria

- `dictionary-detail-compatibility.css` and its root-layout import are absent.
- Each declaration group exists exactly once in its canonical owner.
- Source contracts reject compatibility-file restoration, declaration drift and misplaced ownership.
- Full frontend core, browser, accessibility, visual and performance gates pass without baseline or ceiling updates.
- Full authoritative CI passes on the immutable PR #334 head, followed by review audit, expected-head squash merge and exact-SHA stage/public validation.

## Rollback

Restore the deleted compatibility stylesheet/import and remove the three canonical declaration blocks. No data or API rollback is required.
