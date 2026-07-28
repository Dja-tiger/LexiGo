# Computed-cascade-safe CSS ownership consolidation

## Scope

This rule applies when deleting, merging or reordering global or feature stylesheets while claiming unchanged presentation.

## Confirmed failure

On 2026-07-28, PR #262 run `30319926639` passed 43 of 44 applicable Linux visual cases but changed the approved `desktop-offline-dark` SHA.

The retired `.lx-review-sync span:not(.lx-review-sync__indicator)` rule had higher specificity than the nominal canonical `.lx-review-sync__copy span` rule. Its `#cbd5e1`, `13px` and `1.45` values therefore remained effective before deletion even though the canonical stylesheet was imported later.

## Mandatory rule

Selector presence and import order do not prove CSS ownership.

1. Inventory every selector and declaration in the owner being retired.
2. Compare selector specificity against every later canonical and contextual rule.
3. Record which declarations are actually effective in each relevant state, appearance and viewport.
4. Preserve effective values in the canonical owner before deleting the legacy rule.
5. Add a source contract for values whose ownership depends on a specificity correction.
6. Require unchanged authoritative Linux hashes when the task is consolidation rather than redesign.
7. Never promote a changed baseline until the actual is reviewed against the exact Figma node.

## Regression gate

- `frontend/components/system-states-contract.test.ts` protects the canonical review-sync copy values and retired-owner absence.
- `frontend/e2e/system-states-visual.spec.ts` preserves the approved `desktop-offline-dark` SHA for Figma node `79:194`.
- Full immutable-head Linux visual CI must pass without baseline updates.

## Reusable lesson

CSS ownership is determined by the computed cascade, including specificity and unique declarations, not by filenames or import position alone.
