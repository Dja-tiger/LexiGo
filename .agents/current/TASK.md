# Current Task

## Identity

- Issue: #261 — Consolidate canonical system-state CSS ownership.
- Parent Issue: #70.
- Branch: `agent/issue-261-system-state-css-ownership`.
- Base SHA: `32d36a6cc4eaefc553e893fcd1942519441d647b`.
- Head SHA: `0dce967` (local implementation commit; final evidence commit pending).
- PR: #262 (Draft).

## Objective

Make `system-states.css` the sole feature presentation owner for shared async/skeleton/connectivity states while preserving the effective Figma-reviewed appearance, offline/pending semantics and reduced-motion behavior.

## Scope

- remove the retired Issue #44 async/skeleton block from `mobile-pwa-fixes.css`;
- remove the pre-system-states `review-outbox.css` owner and layout import;
- move only still-effective status-tone, resource-stack, offline-indicator and pending-motion rules into `system-states.css`;
- add source-level duplicate-ownership protection;
- update focused ownership tests and durable documentation only where the ownership boundary changes;
- run exact Linux visual hashes and the complete required CI.

## Non-goals

- no markup, React state, API, IndexedDB outbox, session, navigation, Service Worker or deployment change;
- no visual redesign or unreviewed snapshot/hash promotion;
- no Phrases route island and no closure claim for parent Issues #70/#115;
- no dependency, workflow or unrelated CSS cleanup.

## Allowed paths

- `frontend/app/layout.tsx`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/review-outbox.css`;
- `frontend/app/system-states.css`;
- focused CSS ownership/source tests;
- `README.md`, `docs/architecture.md` and `.agents/current/**` only if required by the changed ownership contract.

## Prohibited paths

- backend, API, migrations, deployment and workflow files;
- production TSX/runtime behavior;
- unrelated feature styles or visual baselines;
- Figma node inference, gate weakening, timeout inflation or blind snapshot updates;
- secrets and generated artifacts.

## Runtime owners

- `AsyncState` and `AsyncSkeleton`: semantic shared state markup.
- `ReviewOutboxRuntime`: connectivity/outbox state and durable queue behavior.
- `system-states.css`: canonical Figma-backed async/skeleton/connectivity presentation.
- `mobile-pwa-fixes.css`: shared PWA/session shell only.
- root layout: deterministic global stylesheet registration.

## Documentation owners

- Issue #261 and Draft PR: task contract and validation evidence.
- `.agents/current/**`: active scope, progress and reproducible execution.
- Issue #70: parent technical-debt roadmap.
- `.agents/PROJECT_STATE.md`: final verified merge/stage outcome after completion only.

## Invariants

- screenshot pixels for the five approved system-state baselines remain byte-identical unless Linux actual is reviewed against its exact Figma node;
- async error/empty/loading/success tones and resource-stack geometry remain effective;
- offline indicator and pending pulse remain visible; reduced motion disables the pulse;
- outbox persistence, idempotency and first-network-request ordering do not change;
- forced-colors, compact/desktop and Active Lesson connectivity placement remain intact;
- final CI runs on a developer-authored immutable head.

## Acceptance criteria

- `system-states.css` is the sole feature owner of shared async/skeleton/connectivity selectors;
- `mobile-pwa-fixes.css` contains no `.lx-async-state` or `.lx-async-skeleton` presentation;
- `review-outbox.css` and its root layout import are absent;
- source contract rejects reintroduced duplicate ownership;
- exact existing Linux visual hashes pass unchanged, or reviewed replacements are explicitly documented;
- full required CI, review audit, expected-head squash merge and exact-SHA stage/public validation complete.

## Required checks

- repository-wide selector/import search and source contract;
- formatting/diff check, lint, TypeScript, unit and production build;
- system-state functional, accessibility, reduced-motion, offline/outbox and visual suites;
- full backend/frontend/browser/performance/container CI;
- final-head review-thread audit, expected-head merge, main CI and stage/public validation.

## Risks

- a higher-specificity legacy modifier may be omitted and cause an unintended pixel change;
- pending/offline indicator behavior may disappear when the old file is removed;
- compact resource-stack geometry may shift;
- stylesheet deletion may leave stale test/import consumers.

## Rollback

Restore the removed layout import and legacy CSS blocks; no runtime or persisted data migration is involved.
