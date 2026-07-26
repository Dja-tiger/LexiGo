# Current Task

## Identity

- Issue: #202 — `[High][Figma][Production Slice] Реализовать loading, empty, error и offline system states`
- Related issue: #170 — offline review outbox/runtime contract
- Branch: `feat/issue-202-system-states`
- Base SHA: `d906cacf21f5a25dc52a380ab8ce681177831532`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Implement the approved Figma-backed loading, empty, error, offline and synchronization states without creating a second network/offline owner or overstating the current offline lesson contract.

## Scope

- Redesign shared async-state presentation with semantic tokens, stable skeleton geometry and accessible live-region behavior.
- Replace the bootstrap placeholder with the approved compact Home loading hierarchy while persistent route chrome remains mounted.
- Preserve Dictionary search/filter input in empty and error states and expose only real recovery actions.
- Extend `ReviewOutboxRuntime` with truthful global offline/pending/failed/restored status, real queue evidence and user-controlled details.
- Surface locally queued Active Lesson reviews inline while preserving the submitted answer and blocking server-owned lesson advancement until synchronization.
- Add unit/source, Chromium, WebKit, iOS PWA, accessibility, reduced-motion, responsive and visual-state coverage.
- Update the bounded offline-review documentation.

## Non-goals

- No backend, database, OpenAPI or scheduler changes.
- No second offline/network runtime and no duplicate IndexedDB queue.
- No full offline lesson progression; next-card ownership remains server-side.
- No custom terminology/add-term workflow.
- No new global navigation item or canonical `/offline` route.
- No service-worker cache-policy expansion beyond existing contracts.
- No unrelated Figma parity or route-island refactor.

## Allowed paths

- `.agents/current/**`
- `docs/offline-review-outbox.md`
- `frontend/app/layout.tsx`
- `frontend/app/system-states.css`
- `frontend/components/async-state.tsx`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/review-outbox-runtime.tsx`
- `frontend/components/active-lesson-presentation.tsx`
- `frontend/lib/system-state-events.ts`
- `frontend/package.json`
- `frontend/e2e/async-states.spec.ts`
- `frontend/e2e/offline-review-outbox.spec.ts`
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/system-states-visual.spec.ts`
- `frontend/e2e/system-states-visual.spec.ts-snapshots/**`
- bounded source-contract tests directly associated with these files

## Prohibited paths

- `backend/**`
- `api/**`
- database migrations
- `.github/workflows/**`
- dependency lockfiles unless an independently verified build requirement appears
- service-worker runtime/cache implementation
- unrelated route, profile, scenario, dictionary-detail or lesson-result implementation

## Runtime owners

- `ReviewOutboxRuntime` remains the sole browser owner for connectivity, durable review queue and replay.
- `review-outbox.ts` remains the sole IndexedDB schema and summary owner.
- Active Lesson remains the owner of answer input and server-confirmed lesson progression.
- `AsyncStatePanel` and `AsyncSkeletonGrid` remain the shared route-state presentation owners.
- App Router `RouteChrome` remains the persistent navigation owner.

## Documentation owners

- `docs/offline-review-outbox.md` owns the bounded user-visible offline review contract.
- `.agents/current/**` owns the active execution record for this slice.
- `.agents/PROJECT_STATE.md` is updated only in the separate post-merge reconciliation slice.

## Invariants

- A review is written to IndexedDB before its first network request.
- Access and CSRF tokens are never persisted in the review outbox.
- One logical review keeps one idempotency key across retry/reload.
- Offline or retryable failure preserves the current answer and presents local-save evidence.
- The next card and lesson completion remain unavailable until the server confirms the authoritative position.
- Search/filter values survive empty/error/retry states.
- Offline and expired-session states remain distinct.
- Live regions do not repeatedly announce unchanged state.
- Reduced-motion disables shimmer/pulse movement without hiding state.
- No CTA advertises unimplemented custom-term or full-offline capabilities.

## Acceptance criteria

- Figma nodes `79:69`, `79:93`, `79:117`, `79:194` and `75:57` are represented through production semantic tokens and existing product ownership.
- Shared loading skeletons reserve final geometry and avoid layout shift.
- Dictionary empty state retains the submitted search/filter state and offers a real reset/recovery action.
- Error states expose safe copy, correlation evidence when available and deterministic retry.
- Authenticated users receive persistent, dismissible offline/restored/sync evidence with real pending/failed/synced counts.
- Active Lesson shows an inline local-save state after an offline/retryable review, preserves the entered answer and disables duplicate rating/advance until replay resolves or the authoritative lesson reloads.
- New lesson start remains blocked while offline.
- Desktop, compact, Light/Dark, forced-colors, reduced-motion, 320 px and 200% reflow remain usable.

## Required checks

- frontend lint, typecheck, unit tests and production build
- async-state and source-contract tests
- full UI shard matrix
- offline outbox Chromium and iOS WebKit tests
- keyboard, axe, live-region and reduced-motion checks
- responsive 320 px/200% checks
- state-specific Linux visual regression baselines
- performance/bundle gates
- full immutable-head repository CI
- clean review comments/reviews/unresolved threads
- expected-head squash merge
- post-merge `main`, exact-SHA stage, public smoke and public browser validation

## Risks

- Global state styling can unintentionally alter existing visual baselines.
- A queued review event can race component unmount or item changes.
- `navigator.onLine` is advisory; queue replay remains the authoritative connectivity proof.
- Interactive global status must not obscure compact navigation, active-lesson controls or safe areas.
- Retryable server responses must not be misrepresented as server-persisted lesson progress.

## Rollback

Revert the product squash commit. The existing IndexedDB schema and backend idempotency contract remain unchanged, so rollback restores the prior toast/async presentation without data migration.
