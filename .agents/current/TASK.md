# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-resource-notice-orphan-proof`
- Base SHA: `65b73f0c9551880b8e84d371e473e9001e70cab9`
- PR: #346 (Draft)

## Objective

Add executable source evidence that the legacy `.lx-resource-notice*` selector family in `mobile-pwa-fixes.css` has no production TypeScript/TSX consumer, while the canonical `AsyncResourceNotice` presentation uses `AsyncStatePanel` / `.lx-async-state` and the live `.lx-resource-stack` plus `.lx-session-notice` owners remain protected.

This is a proof-only atomic slice. It does not delete or rewrite CSS.

## Scope

- Add one source-level Vitest contract that recursively scans executable `frontend/app`, `frontend/components` and `frontend/lib` TypeScript/TSX.
- Exclude test/spec files and strip comments before consumer analysis.
- Require zero executable production consumers of the `lx-resource-notice` class prefix.
- Bound the exact legacy selector inventory inside `mobile-pwa-fixes.css`.
- Prove that `AsyncResourceNotice` delegates to `AsyncStatePanel`, whose canonical class is `.lx-async-state` with the compact state contract.
- Protect the live `.lx-resource-stack`, `.lx-session-notice`, `system-states.css` import and canonical state selectors from accidental removal.
- Record exact implementation and CI evidence in `.agents/current/**`.

## Non-goals

- No deletion or modification of `mobile-pwa-fixes.css`.
- No CSS declaration, selector specificity, import order or visual baseline change.
- No React/runtime, route, navigation, session, PWA, outbox, API, backend or database change.
- No dependency, workflow, README, architecture or Figma change.
- No claim that Issue #70 or the remaining compatibility fallback is complete.

## Allowed paths

- `frontend/components/resource-notice-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially:

- `frontend/app/mobile-pwa-fixes.css`
- `frontend/app/system-states.css`
- `frontend/app/layout.tsx`
- production TS/TSX runtime
- visual snapshots and route-budget ceilings
- workflows, dependencies, backend/API and public documentation

## Owners and boundaries

- `AsyncResourceNotice` and `AsyncStatePanel`: canonical resource-error presentation runtime.
- `system-states.css`: canonical `.lx-async-state` presentation owner.
- `.lx-resource-stack`: live layout owner used by route islands to contain canonical async panels.
- `.lx-session-notice`: live bootstrap/session shell presentation owned by `mobile-pwa-fixes.css`.
- `.lx-resource-notice*`: legacy candidate family whose reachability is being proven, not removed, in this slice.

## Invariants

- Source search evidence must come from the actual checkout, not GitHub indexed search alone.
- Tests/specs and comments must not count as production consumers.
- The proof must distinguish the dead `.lx-resource-notice*` prefix from live `.lx-resource-stack` and `.lx-session-notice` selectors.
- Existing canonical async-state, session notice, PWA shell, reduced-motion, accessibility and visual behavior remains byte-for-byte unchanged.
- A future deletion PR must preserve grouped declarations that are still shared with `.lx-session-notice`; this proof does not authorize broad block removal.

## Acceptance criteria

- The new contract finds zero executable TS/TSX consumers of `lx-resource-notice`.
- The exact legacy selector/token inventory is bounded and cannot silently expand.
- `AsyncResourceNotice` is proven to render through `AsyncStatePanel` and `.lx-async-state`, not the legacy selector family.
- Live `.lx-resource-stack`, `.lx-session-notice` and canonical state-layer markers remain mandatory.
- Final diff contains only the four allowed paths.
- Full required CI passes on the final immutable developer-authored head.
- Comments, reviews and unresolved review threads are empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Required checks

- New source-level Vitest contract.
- Frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration.
- Full browser matrix, accessibility, CSP, service worker, iOS PWA, Linux visual regression and performance budgets.
- Web and API container builds.

## Risks

- Mistaking a similar live prefix such as `.lx-resource-stack` for the legacy notice family.
- Counting comments or test fixtures as production consumers.
- Creating an overly broad future deletion manifest that removes grouped `.lx-session-notice` declarations.
- Treating indexed search as authoritative when the branch checkout is the source of truth.

## Rollback

Revert the proof PR. No production CSS or runtime behavior changes in this slice.
