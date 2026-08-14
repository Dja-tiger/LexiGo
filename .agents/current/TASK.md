# Current Task

## Identity

- Issue: #522 — `[High][Figma][QA] Зафиксировать canonical Home parity для #205`
- Branch: `test/issue-522-home-figma-parity`
- Base SHA: `7837f01bb969ab0551d06ab8f3288d570734c33f`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Convert the already-approved Home route → Figma handoff into an executable production parity contract without redesigning Home or changing approved visual evidence.

## Scope

- extend `frontend/e2e/home-route-island.spec.ts` with four canonical Home layout/appearance cases;
- mobile Dark `390×844` uses Figma `196:223`;
- mobile Light `390×844` uses `196:223` geometry plus semantic Light tokens;
- desktop Light `1440×1024` uses Figma `194:249`;
- desktop Dark `1440×1024` uses `194:249` geometry plus semantic Dark tokens;
- assert Home route-island Figma metadata, semantic canvas appearance, horizontal geometry, shell ownership and reload stability;
- preserve existing Home route/session/history real Back/Forward contract.

## Non-goals

- no product redesign;
- no React/CSS change unless the executable audit proves a concrete product defect; such a defect must be isolated into a separate Issue;
- no visual baseline/hash/tolerance promotion;
- no Figma canvas mutation or new approval claim while live MCP is Starter-plan limited;
- no `/onboarding` work; #201 remains design-gated.

## Allowed paths

- `frontend/e2e/home-route-island.spec.ts`;
- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`.

## Prohibited paths

- production React/CSS/components unless scope is explicitly re-authorized by a separate proven defect;
- visual snapshots or approved hash inventories;
- Playwright global config and CI workflows;
- backend/runtime/dependency files;
- Figma canvas/source binary.

## Runtime owners

- `frontend/components/lexigo-home-app.tsx` owns the Home client island and canonical Figma data attributes;
- `frontend/components/route-primary-navigation.tsx` owns Home shell navigation variants;
- existing appearance runtime owns Light/Dark semantic tokens.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md` is the repository-side canonical route → Figma handoff;
- Issue #205 owns the umbrella audit;
- Issue #522 owns this atomic Home executable parity slice.

## Invariants

- Figma mobile Home source remains `196:223` and desktop Home source remains `194:249`;
- Light semantic canvas remains `#f4f7f5`; Dark remains `#10211d`;
- compact Home shows mobile primary navigation and desktop Home shows rail primary navigation;
- existing Home → Learn → Home → Dictionary → Home plus real Back/Forward/session-refresh behavior must remain green;
- existing 200% browser zoom, reduced-motion and touch-target Home gates remain separate owners and must not regress.

## Acceptance criteria

- all four canonical layout/appearance cases pass;
- Home island reports `data-figma-home-mobile="196:223"` and `data-figma-home-desktop="194:249"`;
- no horizontal overflow or route-island clipping;
- exactly one primary navigation variant is visible per canonical viewport;
- reload preserves layout/appearance contract;
- required CI is green on immutable PR head;
- merge uses expected-head guard and exact-main/Stage validation follows runtime-bearing test delivery.

## Required checks

- targeted Home route-island Playwright contract;
- repository-selected frontend core/browser/visual/a11y/performance/PWA/security gates through CI;
- clean review thread/submitted-review audit;
- exact-main CI and Stage/public validation after merge.

## Risks

- over-constraining implementation details instead of observable route contract;
- accidentally duplicating browser-zoom/reduced-motion owners;
- asserting the wrong desktop navigation variant (`header` instead of canonical visible `rail`);
- treating token-derived appearances as nonexistent Figma frames.

## Rollback

Revert only the Issue #522 Home route-island test contract and task evidence. Do not alter product UI or canonical Figma evidence to make a failing audit pass.
