# Computed-cascade-safe CSS ownership consolidation

## Scope

This rule applies when deleting, merging or reordering global or feature stylesheets while claiming unchanged presentation.

## Confirmed failure

On 2026-07-28, PR #262 run `30319926639` passed 43 of 44 applicable Linux visual cases but changed the approved `desktop-offline-dark` SHA.

The retired `.lx-review-sync span:not(.lx-review-sync__indicator)` rule had higher specificity than the nominal canonical `.lx-review-sync__copy span` rule. Its `#cbd5e1`, `13px` and `1.45` values therefore remained effective before deletion even though the canonical stylesheet was imported later.

On 2026-07-28, Issue #199 PR #273 also exposed a contrast failure in the Phrases catalog sort surface. The feature stylesheet declared route colors, but the computed cascade still inherited a translucent global catalog surface. The visible foreground/background pair therefore failed axe despite source inspection suggesting that the route owner was complete.

## Mandatory rule

Selector presence and import order do not prove CSS ownership.

1. Inventory every selector and declaration in the owner being retired.
2. Compare selector specificity against every earlier and later shared, canonical and contextual rule.
3. Record which declarations are actually effective in each relevant state, appearance and viewport.
4. Preserve effective values in the canonical owner before deleting the legacy rule or compatibility file.
5. Add a source contract for values whose ownership depends on a specificity or import-boundary correction.
6. Require unchanged authoritative Linux hashes when the task is consolidation rather than redesign.
7. Never promote a changed baseline until the actual is reviewed against the exact Figma node.
8. For a new route surface, verify computed foreground, background, border and opacity in both Light and Dark; a declared token is not evidence that it won the cascade.
9. Run axe against the final computed surface and keep a route-scoped selector contract when a global component owner must be overridden.
10. When removing a compatibility stylesheet but preserving its declarations, prove that the canonical stylesheet remains after the shared base import and retain exact selector text, specificity and values.

## Canonical ownership

- `frontend/app/catalog-enhancements.css` owns the shared catalog-sort base.
- `frontend/app/phrases.css` owns the route-scoped Phrases catalog-sort, topic-chip, results-spacing and forced-colors overrides.
- Root layout must import `catalog-enhancements.css` before `phrases.css`.
- `frontend/app/phrases-compat.css` is retired; reintroducing a separate post-import compatibility owner requires a new computed-cascade incident and explicit evidence.

## Regression gate

- `frontend/components/system-states-contract.test.ts` protects the canonical review-sync copy values and retired-owner absence.
- `frontend/e2e/system-states-visual.spec.ts` preserves the approved `desktop-offline-dark` SHA for Figma node `79:194`.
- `frontend/components/phrases-css-ownership.test.ts` protects Phrases file absence, import order, selector uniqueness and exact computed-cascade declarations.
- `frontend/e2e/accessibility-audit.spec.ts` verifies final Phrases catalog contrast in Light/Dark.
- `frontend/e2e/phrases-visual.spec.ts` protects eight content-addressed compact/desktop Light/Dark catalog/detail images.
- Full immutable-head Linux visual CI must pass without baseline updates.

## Reusable lesson

CSS ownership is determined by the computed cascade, including specificity, inherited transparency and unique declarations, not by filenames or import position alone. A compatibility file can be removed only after its effective declarations are preserved in the canonical owner and the browser-computed foreground/background pair, accessibility tree and authoritative visual hashes remain unchanged.
