# Current Task Progress

## 2026-08-07 11:39 Europe/Moscow

### Verified

- PR #425 was made Ready and expected-head squash-merged as `0a120092d89f7fffcb63b010acb2cb71ea615740`.
- Exact-SHA post-merge CI #2966 / run `31162312821` completed successfully.
- `main` remains `0a120092d89f7fffcb63b010acb2cb71ea615740` after branch creation and first task write.
- New branch `feat/issue-74-phrases-browser-zoom` was created from that exact SHA.
- `frontend/playwright.visual.config.ts` currently collects only five allow-listed files and omits Home/Learn/Active standalone browser-zoom specs.
- Existing Home, Learn and Active standalone specs each implement true per-tab Chromium zoom factor 2 via the MV3 browser-zoom controller and independent CDP/DOM telemetry.
- Existing Word Detail true-browser-zoom case is authoritative because it lives inside collected `word-detail-visual.spec.ts`.
- Existing Phrases visual owner is `phrases-visual.spec.ts` with eight content-addressed Linux baselines; those baselines must not change.
- Canonical Phrases Figma file/nodes are recorded by Issue #199; no redesign is needed.

### Finding

The repository had three valid browser-zoom specs whose source existed and whose merge/main/stage pipelines were green, but the authoritative visual `testMatch` never collected them. A green workflow therefore overstated acceptance evidence.

### Root cause

The visual suite uses an explicit allow-list. New standalone browser-zoom files were added without updating that list, and there was no fail-closed unit/source contract coupling required browser-zoom owners to the collection boundary.

### Changed files

- `.agents/current/TASK.md` — populated the bounded Issue #74 slice and prohibited runtime/design changes until an actual defect is reproduced.
- `.agents/current/PROGRESS.md` — this evidence record.

### Checks passed

- PR #425 docs-only CI #2965 on exact head `4b0f83095ba3e6e961a3502f18b1be044e2fce64`.
- PR #425 review/thread audit: no reviews, requested changes or unresolved threads.
- Post-merge main CI #2966 / `31162312821` on exact SHA `0a120092d89f7fffcb63b010acb2cb71ea615740`.
- Branch/base verification after first write.

### Checks failed

None in the new product branch yet. Authoritative product CI has not been invoked because the developer-authored test slice is not complete.

### Current branch head

Resolve from live branch ref after this write. Previous verified head: `a1dc561359490dc9d6e9981b8ce527b1baca8d89`.

### Next action

Record execution commands/evidence, repair `playwright.visual.config.ts`, add a fail-closed collection contract, then add the canonical `/phrases` browser-owned zoom case without touching runtime or baselines.
