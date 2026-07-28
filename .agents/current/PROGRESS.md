# Current Task Progress

## 2026-07-28 22:15 Europe/Moscow

### Verified

- Live `main`: `986ab18f4faa2f8a0581133e976cb104a3e4434a`.
- No open pull request existed before branch creation.
- Stage remains healthy on exact product SHA `9250d9ca583614b976e0c3154246ef56b69a5994`, run `30390320955`, public browser 12/12.
- Branch `refactor/issue-70-consolidate-phrases-css` was created from exact live `main` and read back before writes.
- Mandatory Agent Harness, Issue #70 reachability and Issue #261 CSS specificity rules were re-read from the current `main`.
- Root layout imports `catalog-enhancements.css` before `phrases.css`, then imports `phrases-compat.css` immediately after it.
- `phrases-compat.css` contains exactly seven route-scoped rule groups, including one forced-colors block.
- All selectors are scoped to `.lx-app[data-route-client-island="phrases"]` and are consumed by canonical Phrases markup.
- Eight content-addressed Phrases compact/desktop Light/Dark catalog/detail visual hashes are blocking in `frontend/e2e/phrases-visual.spec.ts`.

### Finding

`phrases-compat.css` is not dead CSS: it owns live computed values for catalog-sort contrast/surface, selected topic contrast, result spacing and forced-colors. The dead part is the separate compatibility-file/import boundary. Because `phrases.css` is already imported after `catalog-enhancements.css`, moving the exact scoped rules into `phrases.css` preserves cascade order relative to the shared base while eliminating the extra compatibility layer.

### Root cause

Issue #199 originally added a narrow post-import override file to repair catalog-sort and topic-chip computed values. After the canonical Phrases route island and visual baselines stabilized, those overrides remained live but their ownership was never consolidated into the canonical route stylesheet.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Repository/branch/PR/stage pre-flight.
- Exact selector/declaration inventory for `phrases-compat.css`.
- Import-order inspection of `layout.tsx`.
- Shared base inspection of `catalog-enhancements.css`.
- Canonical Phrases stylesheet and content-addressed visual contract inspection.
- Scope, invariants, stop conditions and rollback recorded before source changes.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Create the temporary exact-branch patch script and short existing-workflow job, consolidate the stylesheet ownership with exact guards, remove all temporary automation, add the source ownership contract and documentation updates, then run full immutable-head CI without baseline promotion.
