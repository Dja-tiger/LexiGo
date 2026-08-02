# Current Task Progress

## 2026-08-03 00:44 Europe/Moscow

### Verified

- Live `main` is `6e5f66953f1e0dbda7e48b5f98d9bd97e6731ebd`.
- No pull request was open before this slice.
- Issue #70 remains open.
- Stage remains successful on product SHA `de1e56fc558e7a7d3fdca155902718034b9f22d2`, run `30763184057`.
- PR #350 proved zero executable production consumers of `lx-themed-home` and `lx-themed-library`.
- The former exact CSS inventory was five occurrences per class in `themed-vocabulary.css`, two in `accessibility-focus.css` and one in `accessibility-navigation.css`.
- Live `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow` and collection-prefixed classes retain executable consumers.

### Finding

The two retired card class names owned only dead presentation selectors. Their grouped neighbors contain live selector members that must remain unchanged.

### Root cause

Legacy themed Home and Library card presentations were removed from executable runtime in earlier compatibility cleanup, but their CSS members remained in canonical themed and accessibility stylesheets.

### Changed files

- `frontend/app/themed-vocabulary.css`
- `frontend/app/accessibility-focus.css`
- `frontend/app/accessibility-navigation.css`
- `frontend/components/themed-card-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Implementation

- Reduced the cursor owner to `.lx-themed-selector` only.
- Removed the dead parent-scoped arrow hover rule.
- Removed the dead overflow, pseudo-element and child-layer blocks.
- Removed only the two retired members from both shared focus groups.
- Removed only the two retired members from the reduced-motion hover group.
- Converted the source contract to require physical absence from every former CSS owner.
- Retained actual-checkout zero-consumer scanning and exact live-owner assertions.
- Preserved all declaration values and CSS import order.

### Diff evidence

- Production CSS: 34 deletions and zero additions.
- No production TypeScript/TSX, route, snapshot, budget, workflow, dependency, backend/API, README or architecture path changed.
- Draft PR #352 was opened against exact base `6e5f66953f1e0dbda7e48b5f98d9bd97e6731ebd`.
- Every product path was read back from the branch after write.
- `main` remained unchanged after every write.

### Checks passed

- Exact branch/base comparison confirms only declared paths.
- Source readback confirms both retired class names are absent from all three changed CSS files.
- Live themed selector, symbol, arrow, collection and accessibility declaration bodies remain unchanged by inspection.

### Checks failed

- None yet.

### Current branch head

Resolve from live branch ref after execution evidence is committed.

### Next action

Treat the next documentation-evidence commit as the final developer-authored head, run complete authoritative CI, verify unchanged Linux visual hashes and performance budgets, audit review surface, then perform expected-head squash merge and exact-SHA stage/public validation.
