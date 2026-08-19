# Current Task

## Identity

- Issue: #614 — consolidated reduced-motion matrix for 10 canonical routes
- Branch: `test/issue-614-reduced-motion-parity`
- Base SHA: `beee70ecdbc5d066677ee36a78d2d615902c01a2`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Close the next automatable #205 acceptance dimension with one deterministic executable `prefers-reduced-motion: reduce` audit across all ten canonical routes, compact/desktop and explicit Light/Dark, without changing runtime presentation.

## Scope

- Add `frontend/e2e/route-reduced-motion-parity.spec.ts`.
- Reuse the canonical route fixture/topology established by Issue #608.
- Cover 390×844 and 1440×1024, Light/Dark.
- Prove reduced-motion media ownership, RouteChrome ownership, no unintended CSS/Web Animations motion, auto scrolling and preserved keyboard-visible feedback.
- Add a fail-closed frontend source contract.
- Add the new owner to the blocking `test:e2e:a11y` command.
- Record factual task evidence in `.agents/current/**`.

## Non-goals

- No OpenPencil source mutation.
- No Figma work; Figma is archival provenance only.
- No runtime CSS/React/API/backend/state/history/storage change in this audit PR.
- No browser/project exclusion to hide a product defect.
- No arbitrary timeout/sleep or tolerance widening.
- No replacement for physical-device Issue #461.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/route-reduced-motion-parity.spec.ts`
- `frontend/components/reduced-motion-collection-contract.test.ts`
- `frontend/package.json`

## Prohibited paths

- Runtime React/CSS owners, including `frontend/app/accessibility-navigation.css`.
- Backend/API/schema/deploy files.
- OpenPencil source/tokens/mapping.
- Existing visual baselines.
- GitHub workflows.

## Runtime owners

Read-only owners for acceptance:

- `frontend/app/accessibility-navigation.css` — existing Issue #65 reduced-motion implementation.
- Route islands and persistent `RouteChrome` enumerated by current architecture.
- Existing specialized `frontend/e2e/route-focus-management.spec.ts` reduced-motion journey.

## Documentation owners

- Issue #614 and parent #205.
- `.agents/current/**` for task-local execution evidence.

## Invariants

- Active design source is repository-owned OpenPencil: `design/openpencil/LexiGo Design System.op` plus `docs/figma/openpencil-screen-map.json`.
- Reduced motion is an accessibility/runtime dimension, not a new design node.
- Computed durations are normalized to milliseconds and must be `<= 0.01ms`; active Web Animations must be zero.
- Existing #65 navigation/progress/calendar contracts remain authoritative and must not be weakened.
- If the audit exposes a product defect, split a separate runtime Issue/PR and reconstruct this audit on corrected `main`.

## Acceptance criteria

- All 10 canonical routes run at 390×844 and 1440×1024 in explicit Light/Dark.
- `matchMedia('(prefers-reduced-motion: reduce)').matches` is true.
- Canonical route owner and expected RouteChrome topology are present.
- Visible route/shell ownership has no unintended positive-duration CSS/Web Animations motion.
- Reduced-motion scrolling is `auto`.
- Representative keyboard-originated focus remains visibly painted without active motion.
- Runtime error capture stays empty.
- Blocking accessibility collection explicitly includes the new owner.
- Full immutable-head CI succeeds before merge.

## Required checks

- Frontend unit/source contract, lint, typecheck and production build.
- Blocking Accessibility audit collection including Issue #614.
- Existing UI/axe/reduced-motion/visual/performance gates through full CI.
- Review/thread and main-drift audit.

## Risks

- A broad computed-style scan can create false positives from non-running declarations; inspect animation names/properties and Web Animations semantics, not string duration alone.
- Focused routes suppress ordinary RouteChrome and must retain the Issue #608 ownership model.
- Onboarding and Active Lesson require deterministic route-specific fixtures.

## Rollback

Delete the new audit/source-contract owner and remove its package-script entry. Runtime remains untouched.
