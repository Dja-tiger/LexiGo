# Current Task Progress

## 2026-07-28 20:58 Europe/Berlin

### Verified

- Live `main` is exactly `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- No pull request was open at task start.
- PR #278 had already reconciled PR #277 completion and reset active context.
- `frontend/docs/compatibility-cleanup.md` authorizes exactly one Phrases catalog/detail compatibility runtime deletion family and explicitly prohibits CSS deletion.
- Canonical `/phrases` and `/phrases/[slug]` resolve to `LexigoPhrasesApp` before the `LexigoPremiumApp` fallback for guest and authenticated entry.
- Shared phrase lesson-domain behavior still resides partly in `LexigoPremiumApp` and must remain.

### Finding

`LexigoPremiumApp` still contains unreachable route-level Phrases catalog/detail state, API loaders, effects, URL synchronization, navigation handlers and presentation markup. The same file also contains live phrase lesson-domain contracts, so removal must be marker-bounded rather than component-wide.

### Root cause

The canonical Phrases route was extracted into a dedicated route island, but the previous compatibility route implementation remained in the fallback component pending executable reachability and deletion-boundary proof.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md` pending

### Checks passed

- Exact-main comparison: `162b93b7...` versus `main` is identical.
- Open-PR search: none.
- Branch created from exact base: `refactor/issue-70-remove-phrases-compat`.
- Task allow-list, invariants, required checks and stop conditions recorded before runtime writes.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this commit.

### Next action

Record execution provenance, then apply an exact fail-closed transformation to the two runtime/source-contract files. Remove the transient edit workflow before PR creation and inspect the final branch-to-base diff.
## 2026-07-28 temporary transformer diagnostic

The fail-closed runtime transformation was rejected before a source commit. Diagnostic:

```text
Phrases derived route values: expected exactly one regex match, found 0

```
