# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-scenario-catalog-card-touch-targets`
- Base SHA: `64c0ef866e85348cf7e57279e14983d0c3f5f709`
- Head SHA: `fa1ed888d7950aec56f7f747b607d7860ce7fee0` before this harness checkpoint; resolve live branch ref before merge
- PR: #458

## Objective

Give the live authenticated Scenario Catalog card links a bounded 44px fine-pointer / 48px coarse-pointer effective target without changing their approved painted geometry, accessible names or navigation semantics.

## Scope

- Canonical `/scenarios` catalog card links labelled `Открыть сценарий «…»`.
- Add one route-specific interaction-only CSS owner after `scenario-catalog.css`.
- Add source ownership and cross-browser real-hit/non-overlap/focus/navigation evidence.
- Register the browser proof in blocking UI and accessibility collections.

## Non-goals

- Recommendation CTA, catalog retry/empty-state actions and the shared `Уроки / Сценарии` switch.
- Scenario Detail or active scenario lesson controls.
- API, backend, catalog ordering, recommendation logic or session semantics.
- Visual redesign, typography, spacing, colors, borders or approved screenshot baselines.
- Broad shared-link or `.lx-button` touch-target changes.

## Allowed paths

- `frontend/app/scenario-catalog-card-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/scenario-catalog-card-touch-target-source.test.ts`
- `frontend/e2e/scenario-catalog-card-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

All paths not listed above, especially `frontend/app/scenario-catalog.css`, Scenario runtime components, backend/API code, lockfiles, visual baselines and CI workflow definitions.

## Runtime owners

- `frontend/components/lexigo-scenario-catalog-app.tsx` owns authenticated Scenario Catalog rendering and `scenarioPath(...)` navigation.
- `frontend/app/scenario-catalog.css` remains the painted owner: card links are 44px minimum; recommendation CTA is already 48px.
- `frontend/app/scenario-catalog-card-touch-targets.css` owns only the transparent effective hit expansion for card links.
- `frontend/e2e/support/quality-gates.ts` supplies deterministic authenticated Scenario Catalog fixtures without product changes.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/PROJECT_STATE.md` remains unchanged until post-delivery reconciliation.

## Invariants

- Painted card-link height remains 44px; no paint declaration moves into the touch-target layer.
- Fine-pointer effective target is at least 44px; coarse-pointer effective target is at least 48px.
- Expansion is block-axis only, transparent, borderless and shadowless.
- Each effective target resolves real perimeter hit tests to its owning link and does not intersect sibling card-link targets when sampled in one common scroll frame.
- Existing accessible names, `href` values, focus-visible styling, server order and routing behavior remain unchanged.
- Recommendation CTA and Learning subsection switch retain their current independent owners.

## Acceptance criteria

- Desktop Chromium, Android Chromium and iOS WebKit prove 44/48px effective geometry and four-side real hit testing.
- Pairwise effective geometry is sampled from one common scroll frame and remains non-overlapping.
- Focus-visible remains visible and at least 3px; no horizontal overflow is introduced.
- Each card link preserves its canonical `/scenarios/{slug}` href and actual navigation.
- Source contract fails closed on CSS import order, runtime owner, painted 44px boundary, paint-inert expansion and blocking collection registration.
- Product diff contains only the eight allowed paths.

## Required checks

- Source/unit contract for Scenario Catalog card touch-target ownership.
- Frontend lint, typecheck, unit tests and production build.
- Blocking UI/accessibility browser collections including the new proof.
- Full immutable-head CI, including Linux visual regression and container gates selected for product changes.
- Clean PR comments/reviews/threads before expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation after merge.

## Risks

- A pseudo-element expansion can accidentally intersect another interactive surface if geometry is inferred from separate scroll frames.
- Border-relative pseudo geometry can be mismeasured if the link's existing top border is ignored.
- An over-broad selector could affect Scenario Detail or already-compliant recommendation controls.

## Rollback

Remove the route-specific touch-target stylesheet, its layout import, source/browser proofs and package registrations; restore the three current Agent Harness files through the normal task lifecycle. No backend or data rollback is required.
