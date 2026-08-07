# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-active-lesson-live-targets`
- Base SHA: `b9119d8f2b57e454d1bfa24b0cefe3875801102e`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Close the confirmed residual Active Lesson live-control gap in Issue #74 by giving every currently 44px-only interactive control a 44 CSS px fine-pointer and 48 CSS px coarse-pointer effective target without changing the approved painted geometry.

## Scope

- Audit canonical `/lesson/active` controls whose current CSS minimum is 44px.
- Add a route-scoped paint-inert hit-slop owner for the live utility, text-action, confidence-rating and compact Back/Close controls.
- Import that owner from the canonical root layout after the Active Lesson presentation stylesheet.
- Add a dedicated permanent Playwright acceptance owner; the default `playwright.config.ts` has no explicit `testMatch`, so the new spec is automatically collected by the authoritative browser matrix.
- Keep Agent Harness task/progress/execution records factual for this atomic slice.

## Non-goals

- No Active Lesson redesign, typography or painted-layout change.
- No API, review, scheduler, history, session or outbox behavior change.
- No changes to other Issue #74 routes in this PR.
- No visual baseline update.
- No claim of final physical-device acceptance; that remains a manual Issue #74 gate.

## Allowed paths

- `frontend/app/active-lesson-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend, API and migrations.
- Existing Active Lesson presentation declarations outside the dedicated touch-target owner.
- Other route presentation owners.
- Visual snapshots and Figma assets.
- CI workflow definitions, Playwright collection configuration and dependency manifests.

## Runtime owners

- Presentation: `frontend/components/active-lesson-presentation.tsx`
- Canonical painted CSS: `frontend/app/active-lesson.css`
- Touch-target overlay: `frontend/app/active-lesson-touch-targets.css`
- Root stylesheet import boundary: `frontend/app/layout.tsx`
- Browser acceptance: `frontend/e2e/active-lesson-touch-targets.spec.ts`

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Existing 44px painted controls remain visually unchanged on fine and coarse pointers.
- Coarse-pointer effective height is 48px and fine-pointer effective height is at least 44px.
- Hit slop is block-axis only except compact Back/Close controls, where inline expansion is bounded by the same target token and only applies when painted width is below the platform minimum.
- Expanded regions must not overlap adjacent live controls or escape compact viewport containment.
- Existing accessible names, focus-visible behavior, callbacks, review semantics, safe-exit behavior and lesson navigation remain unchanged.
- Existing authoritative visual baselines remain unchanged.

## Acceptance criteria

- Live Active Lesson utility buttons, text actions and confidence ratings expose at least 44px fine-pointer / 48px coarse-pointer effective height.
- Compact Active Lesson Back and Close controls expose at least 44×44px fine-pointer / 48×48px coarse-pointer effective targets where painted width is below 48px.
- Effective-target perimeter points resolve to the owning control.
- Expanded targets do not overlap adjacent live controls.
- Keyboard focus remains visible and compact layout has no horizontal overflow.
- Permanent acceptance executes in desktop Chromium, iOS WebKit and Android Chromium.

## Required checks

- Targeted frontend source/lint/typecheck/unit checks for the changed area.
- Targeted Active Lesson touch-target browser acceptance in desktop Chromium, iOS WebKit and Android Chromium.
- Full required immutable-head CI, including accessibility, authoritative Linux visual, performance and container gates.
- Clean review/thread audit before Ready.
- Exact-SHA main CI and exact-image Stage/public validation after squash merge.

## Risks

- Pseudo-element hit slop can intercept a neighbouring control if spacing is insufficient.
- A direct min-height change would alter approved compact geometry and visual baselines; it is intentionally avoided.
- Off-screen perimeter probes can produce false negatives unless the control is scrolled into view before `elementFromPoint` checks.

## Rollback

Remove the dedicated Active Lesson touch-target stylesheet/import and its matching browser acceptance while preserving all prior Issue #74 deliveries.
