# Current Task

## Identity

- Issue: #515 — `[High][Figma][QA] Зафиксировать canonical viewport и Light/Dark parity для Progress`
- Branch: `test/issue-515-progress-figma-parity`
- Base SHA: `c13cf3bae514c03d1d54a237add7dacedf4573e5`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Add executable Figma-parity regression protection for `/progress` at the canonical `390×844` and `1440×1024` viewports in explicit Light and Dark appearance, while preserving route-shell ownership, direct entry, reload/history behavior and existing approved Linux visual baselines.

## Scope

- extend the already-authoritative `frontend/e2e/progress-evidence.spec.ts` owner instead of adding a standalone uncollected suite;
- add a canonical Light/Dark viewport matrix for `390×844` and `1440×1024`;
- assert explicit resolved appearance, route-island ownership, canonical navigation chrome, absence of horizontal overflow/clipping and stable reload;
- preserve Browser Back/Forward semantics using the existing route-island/navigation contract where the test can prove them without synthetic product behavior;
- keep existing screenshot baselines unchanged until live Figma screenshot comparison is available.

## Non-goals

- no redesign;
- no production CSS or React changes unless the new acceptance test proves a reproducible product defect;
- no change to `frontend/playwright.visual.config.ts`;
- no PNG snapshot updates;
- no implementation of missing Issue #201 onboarding frames;
- no Figma Screen Map/archive synchronization while live Figma MCP calls are quota-blocked.

## Allowed paths

- `frontend/e2e/progress-evidence.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/**/*.css`
- `frontend/components/**/*.tsx`
- `frontend/playwright.visual.config.ts`
- `frontend/e2e/**/*-snapshots/**`
- `.github/workflows/**`
- backend/API/deploy files
- unrelated documentation or dependency files

## Runtime owners

- `/progress`: `LexigoProgressApp`
- Progress presentation: `progress-evidence-dashboard` and existing route CSS owners
- route shell/navigation: `RoutedLexigoApp` / `RoutePrimaryNavigation`
- appearance bootstrap: root layout + existing `lexigo.appearance.v1` contract
- API fixture owner for this acceptance: existing `installAPI` in `progress-evidence.spec.ts`

## Documentation owners

- Figma route handoff: `frontend/docs/adaptive-knowledge-coach.md`
- repository state: `.agents/PROJECT_STATE.md` (post-delivery reconciliation only)
- canonical Figma Progress nodes: mobile Light `76:6`, mobile Dark `76:53`, desktop `76:154`; Screen Map `82:3`

## Invariants

- existing approved Linux PNG hashes do not change;
- the test remains inside the authoritative collected Progress owner;
- no `.first()` ambiguity or hidden-control assumptions;
- all geometry is sampled in a common current viewport state;
- explicit appearance must resolve to the requested Light/Dark state before assertions;
- mobile `390×844` owns mobile primary navigation; desktop `1440×1024` owns header navigation; rail must not leak into either canonical viewport;
- `/progress` remains a dedicated route island with `#lexigo-main-content` labelled `Прогресс`;
- no horizontal overflow or viewport clipping is accepted;
- reload and browser history may not change the resolved appearance or route-shell ownership.

## Acceptance criteria

- `/progress` passes canonical `390×844` Light and Dark executable parity.
- `/progress` passes canonical `1440×1024` Light and Dark executable parity.
- no horizontal overflow or layout clipping is detected.
- route shell/navigation ownership is correct at both viewports.
- direct entry and reload preserve route, appearance and geometry; Back/Forward remains compatible with existing route-island navigation.
- existing visual baselines remain byte-for-byte unchanged in this slice.
- full CI passes on the immutable developer-authored PR head.
- after merge, exact-main CI and Stage/public validation pass.

## Required checks

- source/diff audit proving only allowed paths changed;
- targeted authoritative Progress E2E in applicable browser projects;
- frontend core lint/typecheck/unit/build;
- full Chromium/WebKit/Android/iOS browser matrix;
- accessibility, content-security/CSP, PWA/service-worker, reduced-motion/zoom owners selected by CI;
- authoritative Linux visual regression without update mode;
- bundle/performance and container gates selected by full CI;
- review/thread audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- stale geometry assertions can create false positives if sampled across scroll states;
- a new standalone test could silently remain outside authoritative `testMatch`, therefore this slice reuses the collected Progress owner;
- explicit Dark appearance may expose a real route-shell/CSS defect; if so, classify and expand scope only to the proven owner rather than weakening the test;
- live Figma MCP quota prevents new screenshot approval, so this slice must not claim final screenshot parity.

## Rollback

Revert the test-only delivery commit/merge. Do not change production UI or existing visual baselines merely to remove a failing but valid acceptance signal.