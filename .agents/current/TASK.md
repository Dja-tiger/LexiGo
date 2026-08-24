# Current Task

## Identity

- Issue: #684 — `[High][Frontend][RouteChrome][Zoom] Убрать legacy mobile palette из 720–767px compact continuation`
- Branch: `fix/issue-684-zoom-compact-semantic-palette`
- Base SHA: `dd7db59be38cbc2dd28e00cd101e3d64e56c64b8`
- Head SHA: resolve from live branch ref
- PR: Draft after first executable runtime/test slice

## Objective

Preserve the proven #603 true-browser-zoom reflow repair while replacing the stale copied mobile RouteChrome presentation in the route-scoped 720–767px compact continuation with the current semantic compact navigation presentation.

## Scope

- Preserve #603 ownership: seven ordinary route families remain mobile/compact at 720–767px.
- Preserve #603 content width, reminder, Learn, Profile and Phrases reflow repairs.
- Align only the late `.lx-route-nav--mobile` presentation in `issue-603-browser-zoom-reflow.css` to the current semantic compact owner from `adaptive-knowledge-coach-home.css`.
- Protect Light/Dark semantic surface, border, text and active-primary paint with fail-closed source and browser-computed-style evidence.
- Use existing true browser zoom/CDP Linux evidence before approving any changed visual fingerprints.

## Non-goals

- No rail ownership at 720–767px; do not undo #603.
- No Home ownership change at exact 720px.
- No Active Lesson or Onboarding navigation change.
- No 719px compact or 768px tablet breakpoint change.
- No broad cleanup of `adaptive-navigation.css`, `route-navigation.css`, `premium-ui.css` or unrelated raw legacy colors.
- No backend, learning, Service Worker, route semantics or OpenPencil source changes.
- No blind visual baseline replacement.

## Allowed paths

- `.agents/current/**`
- `frontend/app/issue-603-browser-zoom-reflow.css`
- `frontend/components/issue-603-browser-zoom-reflow-source.test.ts`
- `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts`
- `frontend/e2e/route-browser-zoom-parity.spec.ts` only if reviewed exact Linux evidence requires baseline/provenance update or consolidated effective-style protection

## Prohibited paths

- `backend/**`
- `design/**`
- `.github/workflows/**`
- dependency manifests / lockfiles
- unrelated route/runtime CSS or React owners

## Runtime owners

- `issue-603-browser-zoom-reflow.css` remains the late 720–767px route-scoped reflow/compact continuation owner.
- `adaptive-knowledge-coach-home.css` is the current semantic compact navigation reference owner for <=719px.
- `route-navigation.css` remains the generic 720+ rail owner outside the #603 route-scoped exception.

## Documentation owners

- Issue #684 owns this visual defect and acceptance contract.
- Parent #205 owns final route-by-route visual parity.
- `.agents/current/**` owns branch-local execution state.

## Invariants

- Exactly one mobile navigation owner remains visible on the seven #603 route families at effective 720px.
- Reflow/clipping fix #603 remains effective.
- Semantic compact presentation is reused rather than inventing a new zoom-only visual design.
- 719px and 768px remain regression controls.
- Source declaration checks do not replace effective computed-style/browser evidence.

## Acceptance criteria

- No effective retired navy/purple mobile paint in the 720–767px #603 owner.
- Light/Dark navigation surface/text/active states resolve from current semantic tokens.
- Compact navigation geometry/presentation matches the current semantic compact system pattern while retaining #603 route-scoped reflow.
- Seven ordinary routes remain mobile at true browser zoom 2.0 / exact 720px and have no internal/document horizontal clipping.
- Home remains rail at exact 720px; focused routes remain without shared navigation.
- 719px compact and 768px semantic tablet rail remain unchanged.
- Exact Linux changed actuals are manually reviewed before fingerprints are approved.

## Required checks

- Vitest fail-closed #603 source ownership contract.
- Existing authoritative `issue-603-browser-zoom-reflow.spec.ts` true browser zoom/CDP matrix.
- Consolidated `route-browser-zoom-parity.spec.ts` where affected.
- Full visual regression, UI, accessibility, performance and security gates through immutable-head CI.
- Clean review/thread audit.
- Expected-head squash merge.
- Exact-main CI and exact-SHA Stage/public smoke/browser validation because runtime CSS changes.

## Risks

- Changing compact chrome geometry can affect evidence height or content viewport; review exact Linux actuals rather than assuming paint-only deltas.
- Late #603 specificity/import order must remain strong enough to preserve mobile ownership but not reintroduce retired paint.
- Existing #603 fingerprints intentionally freeze the old presentation and will require reviewed evidence if pixels change.

## Rollback

Revert the atomic #684 runtime/test squash merge. The underlying #603 reflow ownership can be restored independently because no backend/data/design migration is involved.
