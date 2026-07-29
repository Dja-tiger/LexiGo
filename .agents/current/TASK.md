# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-dictionary-reachability`
- Base SHA: `10ed9cd39b03204794b53c6bb8158ab1253ffdb9`
- Head SHA: resolve from live branch ref
- PR: Draft pending

## Objective

Publish executable two-sided reachability evidence for the Dictionary compatibility boundary before any route-runtime deletion.

## Scope

- Prove dedicated `/dictionary` and `/words/*` island selection for canonical guest and authenticated direct entry.
- Prove render order before `LexigoPremiumApp`.
- Record that product-owned Dictionary history entries can still retain the product graph and compatibility presentation.
- Preserve canonical Dictionary URL, History, scroll and Learn handoff ownership.

## Non-goals

- No runtime deletion.
- No CSS consolidation or visual baseline change.
- No authentication, account recovery or unknown-route extraction.
- No bundle-ceiling change.

## Allowed paths

- `frontend/components/dictionary-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime TS/TSX implementation files.
- Stylesheets and visual snapshots.
- Backend, API, migrations, workflows and dependencies.

## Runtime owners

- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-dictionary-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`

## Documentation owners

- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/**`

## Invariants

- Guest authentication, account recovery and unknown-route fallback remain reachable.
- Shared lesson-domain and catalog consumers remain unchanged.
- Dictionary history semantics and route-graph ownership remain unchanged.
- Existing bundle and visual contracts remain unchanged.

## Acceptance criteria

- Source contract proves canonical island predicates, guest/auth independence and render ordering.
- Source contract proves direct-entry graph reconstruction and product-owned history preservation.
- Source contract proves persistent bootstrap/outbox owners are not duplicated.
- Documentation explicitly marks this as evidence-only and not deletion-ready.

## Required checks

- Agent Harness validation and change-scope classification.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit.
- Full browser and container CI required by mixed frontend/documentation scope.

## Risks

- Source markers can be too implementation-specific; CI must validate exact current source and future ownership drift.
- Incorrectly treating all Dictionary entries as canonical could delete a still-live product-graph fallback.

## Rollback

Revert the source contract and documentation-only evidence commit; runtime behavior is unchanged.
