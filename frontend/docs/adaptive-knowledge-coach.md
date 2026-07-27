# Adaptive Knowledge Coach — design and implementation handoff

This document records the source-of-truth contract for the first production slice of the approved Adaptive Knowledge Coach direction.

## Figma source

File: `LexiGo Design System`

File key: `3xXmBWnf38jbvLjtziwber`

A full plugin-level inventory confirms that the live file already contains:

- Foundations, Components and Interaction Components;
- Product Patterns for the daily recommendation, focused lesson, knowledge report, scenario and application shell;
- complete Home, Active Lesson, Progress, Scenario, Learn, Dictionary, Profile and resilient-state screen matrices;
- the Product Screen Map, native handoff and interactive accessibility prototype;
- 92 local variables and 92 components/component sets.

The file also contains broader concept matrices and parallel versions of several routes. Production implementation must therefore reference explicit page and node IDs instead of treating every screen in the file as equally canonical.

Selected nodes for PR #184:

- page `13 — Product Screens — Home`: node `70:2`;
- production desktop Home, Light, 1440×1024: node `194:249`;
- production mobile Home, Dark, 390×844: node `196:223`.

The existing Home matrix on the same page remains useful as product exploration and state coverage. PR #184 intentionally selects the production frames above because they enforce one dominant next-best action and a compact evidence surface.

Prepared design slice for Issue #162:

- page `20 — Production Slice — Learn Composer`: node `200:2`;
- mobile recommended/collapsed composer: node `202:6`;
- mobile manual-settings composer: node `203:5`;
- desktop full composer: node `204:2`.

Research and concept pages `01–08` currently act primarily as section shells in the live file. The approved direction and engineering contract are represented by the populated foundations, patterns, product-screen matrices, screen map and prototype. Do not infer missing production behavior from empty concept pages.

## Production ownership

The implementation must not introduce a second product graph.

- `RouteChrome` remains the only owner of primary route navigation.
- `LexigoBootstrappedApp` remains the sole session restoration, account runtime and dynamic route-entry owner.
- `LexigoHomeApp` owns Home progress/active-lesson reads, next-best-action presentation and creation of a lesson through the existing API.
- `LexigoPremiumApp` retains Learn, Phrases and Active Lesson compatibility orchestration while those routes remain unextracted.
- `ReviewOutboxRuntime`, Service Worker and appearance bootstrap remain persistent shared owners and are not imported by Home.
- The backend remains authoritative for lesson position, completion and review persistence.
- The active lesson remains higher priority than the due queue, new study and manual configuration.
- The Dictionary route island remains isolated and must not regress.

Issue #250 changes the client-entry boundary, not the approved Home visual hierarchy. A transient `/lesson/active?resume=1` URL reuses the existing Active Lesson resume action and removes the query before execution; it does not create another lesson lifecycle owner.

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

The desktop and mobile production frames preserve this order and keep the primary action above mobile bottom navigation.

Direct `/` entry and return navigation must use the dedicated Home island without repeating session restoration. Home-created or resumed lessons must reach the existing Active Lesson UI immediately, without exposing a second confirmation click.

## Next implementation slice

Issue #162 is the next product-screen slice. On mobile, Learn defaults to a recommended lesson with one primary action. Manual mode/source/size controls are disclosed through an explicit `Настроить урок` action. Desktop keeps the full composer visible.

The design reuses the existing lesson API parameters and session lifecycle. Progressive disclosure is a presentation contract, not a new scheduling or composition algorithm.

## Figma source-of-truth maintenance

The following cleanup remains necessary but must not block PR #184:

- identify concept-only and production-ready variants through explicit naming/status metadata;
- remove page-number collisions when new production slices are added;
- avoid duplicating route ownership across prototype, matrix and production frames;
- update the Screen Map when a production slice supersedes an exploratory composition;
- preserve old variants until their state coverage has been transferred or explicitly archived.

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
