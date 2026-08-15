# Current Task

## Identity

- Issue: #531 — `[High][Figma][QA] Зафиксировать canonical Dictionary parity для #205`
- Branch: `test/issue-531-dictionary-figma-parity`
- Base SHA: `e3cf4054068867012e01f6ccba528dc04498686f`
- Head SHA: resolve from live branch ref
- PR: #532 — `test(figma): add canonical Dictionary parity contract`

## Objective

Convert the approved `/dictionary` → Figma handoff into an executable route-level parity contract without redesigning the product or duplicating existing session/history/catalog/PWA/touch/zoom/state owners.

## Scope

- extend existing `frontend/e2e/dictionary-route-island.spec.ts` rather than create a parallel owner;
- canonical mobile viewport `390x844` for Figma `78:54`;
- canonical desktop viewport `1440x1024` for Figma `78:193`;
- cover Light/Dark semantic appearance using the same approved geometry;
- assert cold direct-entry Dictionary route-island and main-content ownership;
- assert visible primary navigation owner is `mobile` at 390px and `header` at 1440px;
- assert catalog/main/island horizontal containment and no document x-overflow;
- annotate executable cases with exact Figma node ids;
- assert deterministic reload retains route/appearance/geometry contract;
- retain the existing session/bootstrap/history test unchanged.

## Non-goals

- no product redesign;
- no production React/CSS changes unless executable audit proves a concrete defect;
- no Dictionary Empty `79:93`, Error/System States or Word Detail;
- no visual snapshot/hash/tolerance changes;
- no duplicate search/filter/pagination, auth refresh, route-history, iOS PWA, touch-target, true browser zoom, reduced-motion or accessibility coverage;
- no Playwright global config, CI workflow, backend/runtime/dependency changes;
- no package change because existing owner is already selected by authoritative UI/navigation collections;
- no Figma canvas mutation or fresh live-approval claim while MCP quota is exhausted.

## Allowed paths

- `frontend/e2e/dictionary-route-island.spec.ts`;
- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`.

## Prohibited paths

- production React/CSS/components unless separately justified by a proven product defect;
- visual snapshots/baselines/hash inventories;
- Playwright global config and CI workflows;
- `frontend/package.json` unless collection audit becomes invalid;
- backend/runtime/dependency files;
- Figma canvas/source binary.

## Runtime owners

- `LexigoDictionaryApp` owns the cold `/dictionary` route island via `data-route-client-island="dictionary"`;
- `#lexigo-main-content[aria-label="Словарь"]` owns the semantic Dictionary main surface;
- `.lx-dictionary-catalog` owns the catalog surface;
- `RouteChrome` owns primary route navigation: `mobile` <=719px, `rail` 720–1099px, `header` >=1100px;
- existing appearance runtime owns Light/Dark semantic tokens.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md` is the repository-side canonical route → Figma handoff;
- Issue #205 owns the umbrella final parity audit;
- Issue #531 owns this atomic Dictionary executable parity slice.

## Invariants

- mobile Dictionary source remains `78:54`;
- desktop Dictionary source remains `78:193`;
- Light canvas remains `#f4f7f5`; Dark remains `#10211d`;
- 390px visible primary navigation remains `mobile`;
- 1440px visible primary navigation remains `header`;
- existing cold-session/bootstrap and route-history semantics remain in their original test;
- Dictionary Empty baseline `79:93` remains independently owned by #518/#520;
- Word Detail and other state routes remain separate owners.

## Acceptance criteria

- four canonical cases execute mobile/desktop × Light/Dark;
- exact Figma node ids are recorded as Playwright `figma` annotations;
- direct `/dictionary` route island, semantic main, catalog heading and deterministic 3-item list are observable;
- exactly one primary route-navigation variant is visible and matches viewport ownership;
- semantic canvas token matches selected appearance;
- route island, main and catalog stay within horizontal viewport; document/body have no horizontal overflow;
- reload preserves direct Dictionary route ownership, appearance, navigation variant and geometry;
- existing `dictionary-route-island.spec.ts` remains authoritative in `test:e2e:ui`/navigation collection;
- required immutable-head CI is green;
- clean review audit, expected-head squash merge, exact-main CI and Stage/public validation follow.

## Required checks

- authoritative UI collection audit;
- repository-selected frontend core/browser/visual/a11y/performance/PWA/security gates;
- review threads and submitted reviews audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- accidentally changing existing session/history ownership while adding parity evidence;
- asserting `rail` at desktop even though shared route-navigation CSS owns `header` at 1440px;
- coupling the parity matrix to internal implementation instead of observable route owners;
- duplicating Dictionary Empty or catalog behavioral tests;
- treating live Figma quota failure as permission to invent new canvas evidence.

## Rollback

Revert only the Issue #531 Dictionary parity additions and task evidence. Do not change production UI, existing route/history tests or canonical visual baselines merely to satisfy the audit.
