# Current Task Progress

## 2026-08-06 09:51 Europe/Moscow

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `078f842740bbed27deed92888e8f482cb133f616`.
- Stage remains healthy on exact product image SHA `3b8f3c39faee1223e3773935c761eb7903409868`; Issue #12 records deploy, public smoke and public browser success.
- Open PRs #304, #305 and #403 are unrelated Dependabot maintenance.
- Issue #74 remains open and no product slice was active after PR #411/#412 reconciliation.
- Branch `fix/issue-74-word-detail-related-phrase-targets` was created from exact live `main`.
- Current task record commit `db9ab00ac039f29370bfcc15eb71a20d268eaafc` and blob `b24ac848e679a690a81f50af18b33ae9fd2b5537` were read back successfully; `main` remained unchanged.

### Finding

- Canonical authenticated Word Detail renders up to three live related-phrase native buttons in `.lx-word-detail-phrase-list`.
- `frontend/app/word-detail.css` gives these controls a 34px minimum painted height and the list a 10px wrapped gap.
- Fine-pointer 44px expansion needs 5px transparent block-axis slop per side; the existing 10px row gap is sufficient.
- Coarse-pointer 48px expansion needs 7px per side; wrapped rows therefore require a 14px row gap to prevent effective-target overlap.
- `DictionaryCatalog` already routes each selected phrase slug to canonical `/phrases/[slug]`; no runtime callback or History change is required.

### Root cause

The related-phrase pills were designed as compact 34px visual chips, but they do not have a separate interaction owner that guarantees the minimum 44px fine-pointer and 48px coarse-pointer hit area required by Issue #74.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Mandatory repository-harness reading and live GitHub pre-flight.
- Source ownership audit for Word Detail presentation, CSS, Dictionary route/navigation and canonical E2E fixture.
- Branch/base/readback verification.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Create the route-scoped interaction-only stylesheet, read it back, verify branch/main refs, then add source and browser regression contracts.