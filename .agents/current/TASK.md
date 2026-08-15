# Current Task

## Identity

- Issue: #528 — `[High][Figma][QA] Зафиксировать canonical Active Lesson parity для #205`
- Branch: `test/issue-528-active-lesson-figma-parity`
- Base SHA: `336483615bf76e32100c52bb9317cb94ecc059b5`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Convert the approved `/lesson/active` → Figma handoff into an executable route/state-level parity contract without redesigning the product or duplicating existing behavior, review, history, zoom or accessibility owners.

## Scope

- extend the existing `frontend/e2e/active-lesson-figma.spec.ts` owner rather than creating a parallel spec;
- canonical mobile viewport `390x844` for Recall Default `75:6`, Recall Correct `75:30` and Choice Incorrect `75:89`;
- canonical desktop viewport `1440x1024` for Study `75:120` and Recall Correct `75:150`;
- cover Light/Dark semantic appearance using the same approved ownership/geometry;
- assert route-island, started focus-mode and main-content ownership;
- assert primary route navigation is intentionally absent after lesson start;
- assert canonical horizontal geometry and no document overflow;
- annotate executable cases with exact Figma node ids;
- use deterministic request-scoped Active Lesson fixtures.

## Non-goals

- no product redesign;
- no production React/CSS changes unless the executable audit proves a concrete defect and scope is explicitly isolated;
- no offline `75:57`, Lesson Result or Scenario states;
- no visual snapshot/hash/tolerance changes;
- no duplicate server review payload, safe-exit, history, direct-entry/reload, true 200% browser zoom, reduced-motion, touch-target or accessibility coverage;
- no Playwright global config, CI workflow, backend/runtime/dependency changes;
- no Figma canvas mutation or new live-approval claim while MCP quota is exhausted.

## Allowed paths

- `frontend/e2e/active-lesson-figma.spec.ts`;
- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`.

## Prohibited paths

- production React/CSS/components unless separately authorized by a proven product defect;
- visual snapshots/baselines/hash inventories;
- Playwright global config and CI workflows;
- `frontend/package.json` unless collection audit proves the existing owner is not already authoritative;
- backend/runtime/dependency files;
- Figma canvas/source binary.

## Runtime owners

- `frontend/components/lexigo-active-lesson-app.tsx` owns the `/lesson/active` route island and started focus mode;
- `#lexigo-main-content` owns the semantic lesson main surface;
- Active Lesson intentionally hides `RoutePrimaryNavigation` after lesson start;
- existing appearance runtime owns Light/Dark semantic tokens;
- request-scoped `active-lesson-fixture.ts` owns deterministic browser fixture setup for this test surface.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md` is the repository-side canonical route → Figma handoff;
- Issue #205 owns the umbrella audit;
- Issue #528 owns this atomic Active Lesson executable parity slice.

## Invariants

- mobile Recall Default source remains `75:6`;
- mobile Recall Correct source remains `75:30`;
- mobile Choice Incorrect source remains `75:89`;
- desktop Study source remains `75:120`;
- desktop Recall Correct source remains `75:150`;
- Light canvas remains `#f4f7f5`; Dark remains `#10211d`;
- started lesson focus mode renders no visible primary route navigation;
- offline/result/scenario states remain separate owners;
- true browser zoom and existing behavioral review/history semantics remain separate owners.

## Acceptance criteria

- all five canonical Figma nodes are executed at their approved mobile/desktop viewport and state;
- canonical cases cover Light/Dark semantic appearance without inventing alternate Figma frames;
- `/lesson/active` route island, `.lx-lesson-focus-mode` and `#lexigo-main-content` are observable after start;
- no primary route navigation is visible while focus mode is active;
- route island, main content and Active Lesson surface remain within the horizontal viewport and document has no horizontal overflow;
- exact node ids are recorded in Playwright `figma` annotations;
- existing `active-lesson-figma.spec.ts` remains in authoritative `test:e2e:ui` collection;
- required CI is green on immutable PR head;
- clean review audit, expected-head squash merge, exact-main CI and Stage/public validation follow.

## Required checks

- targeted Active Lesson Playwright contract through repository CI;
- authoritative UI collection audit;
- repository-selected frontend core/browser/visual/a11y/performance/PWA/security gates;
- review threads and submitted reviews audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- duplicating existing behavior instead of proving Figma parity;
- accidentally asserting primary route navigation during focus mode although product ownership intentionally hides it;
- coupling tests to implementation details rather than observable route/state owners;
- over-constraining vertical geometry for content states whose canonical contract is horizontal ownership/viewport containment;
- inventing Light/Dark frame variants not present in approved handoff;
- expanding into offline/result/scenario ownership.

## Rollback

Revert only the Issue #528 Active Lesson parity additions and task evidence. Do not change production UI, existing behavior tests or canonical Figma evidence merely to satisfy the audit.
