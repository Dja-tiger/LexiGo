# Current Task Progress

## 2026-08-05 20:42 Europe/Moscow

### Verified

- Live documentation `main` is `6563e7e2dbdefe6d42f6cd3c30b747030c6acca5`.
- Latest deployed product SHA remains `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.
- Product PR #402, exact-SHA main CI #2864 and Deploy Stage #2702 are fully complete.
- Docs PR #404 and post-merge docs CI #2869 are complete; Deploy Stage #2705 correctly skipped the deploy job.
- Issue #74 remains open; current Agent Harness files were canonical before this slice.
- Open PRs #304–#306 are unrelated Dependabot maintenance.
- Canonical Home runtime renders a direct progress-panel button with exact label `Открыть прогресс` and callback `navigate({ view: "progress" })`.
- Canonical Home CSS hides `.lx-home-paths`, so `Настроить урок`, `Найти материал` and `Посмотреть результат` are not exposed controls.
- The primary next-action CTA has a route-specific 48px production minimum and is excluded.
- Figma file `3xXmBWnf38jbvLjtziwber`, node `196:223`, contains exact progress CTA node `196:259` with a 40px approved painted height.
- Production Home CSS raises all Home `.lx-button` controls to a 44px minimum; the progress CTA has no coarse-pointer 48px event-surface contract.

### Finding

The only currently exposed secondary action on canonical Home is `Открыть прогресс`. Its production border box is 44px, but coarse-pointer users have no guaranteed 48px effective target.

### Root cause

The canonical Home production slice standardized visual button geometry to a 44px floor before Issue #74 introduced input-modality-specific event-surface owners. The progress CTA retained the visual floor but never received a coarse-pointer interaction contract.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live repository/main/open-PR/deployment reconciliation.
- Current Agent Harness reset verification.
- Canonical Home runtime and accessibility-tree ownership inventory.
- Home visibility and CSS cascade inventory.
- Figma metadata and design-context verification for nodes `196:223` and `196:259`.
- Exact label, callback and hidden-consumer classification.

### Checks failed

- None.

### Current branch head

- `634a14c41310d4520f4067292926447bb3090aac`.

### Next action

Record execution ownership, add the narrow progress CTA event-surface owner and source/browser contracts, then run authoritative CI.