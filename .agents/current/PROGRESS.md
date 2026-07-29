# Current Task Progress

## 2026-07-29 14:46 Europe/Berlin

### Verified

- Live base `main`: `10ed9cd39b03204794b53c6bb8158ab1253ffdb9`.
- Issue #70 remains open.
- No open PRs or conflicting Issue #70 branches were present at pre-flight.
- Stage remains healthy on the latest product SHA `0b36be36b3c2c0ea1d859b025922d74ee2c5fcbb`.
- `LexigoBootstrappedApp` selects the Dictionary island for the `dictionary` route graph and `/dictionary` or `/words/*` pathnames before the compatibility fallback.
- `historyRouteGraph` intentionally preserves a `product` graph for product-owned Dictionary history entries.

### Finding

Dictionary has a two-sided compatibility boundary. Canonical direct entry, reload and new-tab reconstruction use the dedicated island for guests and authenticated users, while product-owned History entries can still route through `LexigoPremiumApp.renderLibrary()`.

### Root cause

Dictionary extraction preserved legacy cross-graph history ownership to avoid breaking product-owned navigation. Therefore route extraction alone is not proof that the compatibility presentation is dead.

### Changed files

- `frontend/components/dictionary-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Exact branch creation from verified `main`.
- Changed test and task files read back from the branch with new blob SHAs.

### Checks failed

- None yet; CI has not started.

### Current branch head

Resolve from live branch ref after the current documentation write.

### Next action

Complete execution/documentation evidence, open a Draft PR and run the authoritative full CI. Do not delete Dictionary compatibility runtime in this slice.
