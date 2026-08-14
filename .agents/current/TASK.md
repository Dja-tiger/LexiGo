# Current Task

## Identity

- Issue: #525 — `[High][Figma][QA] Зафиксировать canonical Learn Composer parity для #205`
- Branch: `test/issue-525-learn-figma-parity`
- Base SHA: `b29344917805581cdf209730da2cd56570db41b4`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Convert the approved `/learn` Lesson Composer → Figma handoff into an executable route-level parity contract without redesigning the product or duplicating existing interaction/zoom/accessibility owners.

## Scope

- add `frontend/e2e/learn-route-island.spec.ts`;
- mobile recommended/collapsed uses Figma `202:6`;
- mobile manual settings uses Figma `203:5`;
- desktop full composer uses Figma `204:2`;
- cover Light/Dark semantic appearance for the same approved geometry/ownership;
- assert route-island/main-content ownership, horizontal geometry, shell navigation ownership and canonical reload semantics;
- use deterministic request-scoped authenticated fixtures.

## Non-goals

- no product redesign;
- no production React/CSS changes unless the executable audit proves a concrete defect; such a defect must be isolated before expanding scope;
- no visual snapshot/hash/tolerance changes;
- no duplicate 200% browser zoom, reduced-motion, touch-target or existing composer interaction coverage;
- no Playwright global config/CI workflow/backend/runtime/dependency changes;
- no Figma canvas mutation or new live-approval claim while MCP quota is exhausted.

## Allowed paths

- `frontend/e2e/learn-route-island.spec.ts`;
- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`.

## Prohibited paths

- production React/CSS/components unless separately authorized by a proven defect;
- visual snapshots/baselines/hash inventories;
- Playwright global config and CI workflows;
- backend/runtime/dependency files;
- Figma canvas/source binary.

## Runtime owners

- `frontend/components/lexigo-learn-app.tsx` owns the `/learn` route island;
- `frontend/components/lesson-composer-progressive-shell.tsx` owns mobile progressive disclosure;
- `frontend/components/route-primary-navigation.tsx` / RouteChrome own primary navigation variants;
- existing appearance runtime owns Light/Dark semantic tokens.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md` is the repository-side canonical route → Figma handoff;
- Issue #205 owns the umbrella audit;
- Issue #525 owns this atomic `/learn` executable parity slice.

## Invariants

- mobile collapsed source remains `202:6`;
- mobile manual source remains `203:5`;
- desktop full composer source remains `204:2`;
- Light canvas remains `#f4f7f5`; Dark remains `#10211d`;
- compact `/learn` shows mobile primary navigation and desktop shows rail navigation;
- manual-expanded state is local React state and is not persisted across reload;
- existing composer interaction, true 200% zoom, reduced-motion and touch-target gates remain separate owners.

## Acceptance criteria

- canonical mobile collapsed Light/Dark, mobile manual Light/Dark and desktop full Light/Dark cases pass;
- `/learn` route island and `#lexigo-main-content[aria-label="Обучение"]` are visible;
- no horizontal overflow or route-island clipping;
- exactly one primary navigation variant is visible per viewport;
- collapsed/manual/full composer semantic owners are mutually consistent;
- reload assertions follow real ownership and do not invent manual-state persistence;
- authoritative CI collection actually executes the new spec;
- required CI is green on immutable PR head;
- clean review audit, expected-head squash merge, exact-main CI and Stage/public validation follow.

## Required checks

- targeted `/learn` route-island Playwright contract through repository CI;
- repository-selected frontend core/browser/visual/a11y/performance/PWA/security gates;
- review threads and submitted reviews audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- duplicating existing composer behavior instead of proving parity;
- over-constraining implementation details rather than observable owners;
- treating manual-expanded state as persisted;
- asserting the wrong navigation owner or viewport coordinate frame;
- inventing token-derived Figma frames.

## Rollback

Revert only the Issue #525 Learn route-island parity test and task evidence. Do not change production UI or canonical Figma evidence merely to satisfy the audit.
