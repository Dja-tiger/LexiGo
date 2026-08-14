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

- extend the already-authoritative `frontend/e2e/progress-route-island.spec.ts` owner because it owns Progress route-shell, session-bootstrap and navigation/history semantics and is automatically collected by `frontend/playwright.config.ts`;
- add a canonical Light/Dark viewport matrix for `390×844` and `1440×1024`;
- assert explicit resolved appearance, route-island ownership, canonical navigation chrome, absence of horizontal overflow/clipping and stable reload;
- strengthen the existing route-island journey with Browser Back/Forward evidence without synthetic history manipulation;
- keep existing screenshot baselines unchanged until live Figma screenshot comparison is available.

## Non-goals

- no redesign;
- no production CSS or React changes unless the new acceptance test proves a reproducible product defect;
- no change to `frontend/playwright.visual.config.ts`;
- no PNG snapshot updates;
- no change to Progress data/API evidence in `progress-evidence.spec.ts`;
- no implementation of missing Issue #201 onboarding frames;
- no Figma Screen Map/archive synchronization while live Figma MCP calls are quota-blocked.

## Allowed paths

- `frontend/e2e/progress-route-island.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/e2e/progress-evidence.spec.ts`
- `frontend/app/**/*.css`
- `frontend/components/**/*.tsx`
- `frontend/playwright.visual.config.ts`
- `frontend/e2e/**/*-snapshots/**`
- `.github/workflows/**`
- backend/API/deploy files
- unrelated documentation or dependency files

## Runtime owners

- `/progress`: `LexigoProgressApp`
- Progress presentation/data evidence: existing Progress owners remain unchanged
- route shell/navigation: `RoutedLexigoApp` / `RoutePrimaryNavigation`
- appearance bootstrap: root layout + existing `lexigo.appearance.v1` contract
- API fixture owner for this acceptance: existing `installQualityGateAPI` used by `progress-route-island.spec.ts`

## Documentation owners

- Figma route handoff: `frontend/docs/adaptive-knowledge-coach.md`
- repository state: `.agents/PROJECT_STATE.md` (post-delivery reconciliation only)
- canonical Figma Progress nodes: mobile Light `76:6`, mobile Dark `76:53`, desktop `76:154`; Screen Map `82:3`

## Invariants

- existing approved Linux PNG hashes do not change;
- the test remains inside the authoritative normal Playwright collection;
- no `.first()` ambiguity or hidden-control assumptions;
- all geometry is sampled in one browser evaluation/current scroll state;
- explicit appearance must resolve to the requested Light/Dark state before assertions;
- mobile `390×844` owns mobile primary navigation; desktop `1440×1024` owns header navigation; rail must not leak into either canonical viewport;
- `/progress` remains a dedicated route island with `#lexigo-main-content` labelled `Прогресс`;
- no horizontal overflow or viewport clipping is accepted;
- reload and Browser Back/Forward may not corrupt route-shell ownership, appearance or session-bootstrap invariants;
- the desktop Dark test uses `76:154` only as the canonical desktop geometry owner plus the existing semantic Dark appearance contract; it does not claim a separate approved desktop-Dark Figma frame.

## Acceptance criteria

- `/progress` passes canonical `390×844` Light and Dark executable parity.
- `/progress` passes canonical `1440×1024` Light and Dark executable parity.
- no horizontal overflow or layout clipping is detected.
- route shell/navigation ownership is correct at both viewports.
- direct entry and reload preserve route, appearance and geometry.
- Browser Back/Forward across a real primary-navigation transition preserves canonical route ownership and does not create an extra session refresh.
- existing visual baselines remain byte-for-byte unchanged in this slice.
- full CI passes on the immutable developer-authored PR head.
- after merge, exact-main CI and Stage/public validation pass.

## Required checks

- source/diff audit proving only allowed paths changed;
- targeted `progress-route-island.spec.ts` in desktop Chromium/WebKit and mobile Chromium/WebKit projects;
- frontend core lint/typecheck/unit/build;
- full Chromium/WebKit/Android/iOS browser matrix;
- accessibility, content-security/CSP, PWA/service-worker, reduced-motion/zoom owners selected by CI;
- authoritative Linux visual regression without update mode;
- bundle/performance and container gates selected by full CI;
- review/thread audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- stale geometry assertions can create false positives if sampled across scroll states;
- explicit Dark appearance may expose a real route-shell/CSS defect; if so, classify and expand scope only to the proven owner rather than weakening the test;
- Browser Back/Forward assertions can be stale if they infer framework history internals instead of observing URL + semantic owner;
- live Figma MCP quota prevents new screenshot approval, so this slice must not claim final screenshot parity.

## Rollback

Revert the test-only delivery commit/merge. Do not change production UI or existing visual baselines merely to remove a failing but valid acceptance signal.