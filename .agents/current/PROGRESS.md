# Current Task Progress

## 2026-08-05 20:55 Europe/Moscow

### Verified

- Live documentation `main` remains `6563e7e2dbdefe6d42f6cd3c30b747030c6acca5`.
- Latest deployed product SHA remains `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.
- Product PR #402, exact-SHA main CI #2864 and Deploy Stage #2702 are fully complete.
- Docs PR #404 and post-merge docs CI #2869 are complete; Deploy Stage #2705 correctly skipped the deploy job.
- Issue #74 remains open; current Agent Harness files were canonical before this slice.
- Open PRs #304–#306 are unrelated Dependabot maintenance.
- Canonical Home runtime renders a direct progress-panel button with exact label `Открыть прогресс` and callback `navigate({ view: "progress" })`.
- Canonical Home CSS hides `.lx-home-paths`, so `Настроить урок`, `Найти материал` and `Посмотреть результат` are not exposed controls.
- The primary next-action CTA has a route-specific 48px production minimum and is excluded.
- Figma file `3xXmBWnf38jbvLjtziwber`, node `196:223`, contains exact progress CTA node `196:259` with a 40px approved painted height.
- Production Home CSS raises all Home `.lx-button` controls to a 44px minimum; the progress CTA previously had no coarse-pointer 48px event-surface contract.

### Finding

The only currently exposed secondary action on canonical Home is `Открыть прогресс`. Its production border box is 44px, but coarse-pointer users had no guaranteed 48px effective target.

### Root cause

The canonical Home production slice standardized visual button geometry to a 44px floor before Issue #74 introduced input-modality-specific event-surface owners. The progress CTA retained the visual floor but never received a coarse-pointer interaction contract.

### Implementation

- Added `frontend/app/home-progress-touch-targets.css` as a direct progress-panel event-surface owner.
- Preserved the existing 44px full-width visual border box and expanded only the block axis to 48px under `(pointer: coarse)`.
- Kept inline expansion at zero and asserted that the effective target stays below preceding progress content and inside the panel.
- Registered the owner after canonical Home presentation/accessibility CSS and before Lesson Composer CSS.
- Added a Vitest source contract for exact runtime label/callback, selector scope, import order, hidden-consumer exclusion, visual-declaration exclusion, focus ownership and blocking command ownership.
- Extended the existing Home Playwright specification with deterministic desktop Chromium, Android Chromium and iOS WebKit proof at 390px and 320px.
- Browser proof checks visual/effective geometry, all four perimeter hits, transparent hit slop, content/panel separation, focus-visible and horizontal overflow.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/home-progress-touch-targets.css`
- `frontend/components/home-progress-touch-target-source.test.ts`
- `frontend/e2e/adaptive-knowledge-coach-home.spec.ts`

### Checks passed

- Live repository/main/open-PR/deployment reconciliation.
- Current Agent Harness reset verification.
- Canonical Home runtime and accessibility-tree ownership inventory.
- Home visibility and CSS cascade inventory.
- Figma metadata and design-context verification for nodes `196:223` and `196:259`.
- Exact label, callback and hidden-consumer classification.
- Allowed-path compare against exact base: seven expected files, no unrelated changes.
- Draft PR #405 opened from the isolated branch.
- Full initial CI #2870 / run `31031527425` passed on implementation head `ff1b4e26b889f4bc605068e85a2adf33b981416f`:
  - classifier and Agent Docs routing contract;
  - frontend lint, TypeScript, unit/source contracts, production build and dependency audit;
  - backend unit/security and integration with race detector;
  - UI shards 1/2 and 2/2, including the Home target proof;
  - accessibility audit, iOS PWA dictionary, lesson completion, content security, controlled service worker, dictionary smoke, visual regression and performance budgets;
  - frontend aggregate quality;
  - API and web container builds.

### Checks failed

- None.

### Current branch head

- Implementation head validated by initial full CI: `ff1b4e26b889f4bc605068e85a2adf33b981416f`.
- Final evidence commit SHA resolves from the live branch ref after this atomic update.

### Next action

Run full authoritative CI on the final developer-authored head, inspect review threads and mergeability, then mark PR #405 ready and perform expected-head squash merge followed by exact-SHA main and exact-image stage/public validation.
