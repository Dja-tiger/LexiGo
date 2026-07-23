# Adaptive Knowledge Coach — design and implementation handoff

This document records the source-of-truth contract for the first production slice of the approved Adaptive Knowledge Coach direction.

## Figma source

File: `LexiGo Design System`

File key: `3xXmBWnf38jbvLjtziwber`

Current product-screen nodes:

- page `13 — Product Screens — Home`: node `70:2`;
- desktop Home, Light, 1440×1024: node `194:249`;
- mobile Home, Dark, 390×844: node `196:223`;
- page `14 — Product Screens — Learn`: node `200:2`;
- mobile recommended lesson state: node `202:6`;
- mobile manual-settings state: node `203:5`.

The original Issue #183 referenced additional Figma pages that were not present in the live file. The nodes above are the verified product-screen source of truth for this slice. Foundations are represented by the existing local variable collections for semantic colors, spacing, radius, motion and typography.

## Production ownership

The implementation must not introduce a second product graph.

- `RouteChrome` remains the only owner of primary route navigation.
- `LexigoPremiumApp` retains Home state resolution and lesson orchestration.
- The backend remains authoritative for lesson position, completion and review persistence.
- The active lesson remains higher priority than the due queue, new study and manual configuration.
- The Dictionary route island remains isolated and must not regress.

The first implementation slice changes presentation and responsive composition only.

## Application Shell contract

Desktop from 1024 CSS pixels uses a persistent navigation rail. Compact mobile uses an edge-to-edge bottom navigation bar with safe-area padding. Focus order, route-focus restoration, browser history, scroll restoration and minimum 44×44 interaction targets remain blocking contracts.

Light and Dark appearances use the same information hierarchy. Optional transitions are disabled under `prefers-reduced-motion: reduce`.

## Home contract

Home owns one next-best action and a compact evidence surface. It does not duplicate Learn, Dictionary and Progress as secondary feature cards.

The next action resolves in this order:

1. resume the active lesson;
2. review due material;
3. start recommended new study;
4. open manual lesson configuration.

The desktop and mobile Figma frames intentionally preserve this order and keep the primary action above mobile bottom navigation.

## Next design slice

Issue #162 is the next product-screen slice. On mobile, Learn defaults to a recommended lesson with one primary action. Manual mode/source/size controls are disclosed through an explicit `Настроить урок` action. Desktop keeps the full composer visible.

The design must reuse the existing lesson API parameters and session lifecycle. Progressive disclosure is a presentation contract, not a new scheduling or composition algorithm.

## Verification gates

The implementation is not complete until all of the following pass:

- lint, typecheck, unit tests and production build;
- desktop 1440×1024 and mobile 390×844 browser geometry;
- Light/Dark computed appearance;
- 120–200% text reflow without horizontal overflow;
- keyboard navigation and blocking accessibility audit;
- reduced-motion computed styles;
- route bundle and low-end mobile performance budgets;
- visual review on the deployed stage build.
