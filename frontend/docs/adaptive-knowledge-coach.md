# Adaptive Knowledge Coach — design and implementation handoff

This document records the source-of-truth contract for the approved Adaptive Knowledge Coach production direction.

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

The repository also preserves provenance for the 2026-08-13 offline `LexiGo Design System.fig` snapshot in `docs/figma/`. The native snapshot is supplementary evidence only. OpenPencil is the active AI-native design owner; `docs/figma/openpencil-screen-map.json` records the reviewed imported mappings plus the stable OpenPencil-native First Use `activeScreens` keys delivered by PR #556.

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

Approved production design slice for Issue #199:

- page `21 — Production Slice — Phrases`: node `253:2`;
- production source-of-truth wrapper: node `253:3`;
- mobile catalog, Light/default: node `255:10`;
- mobile catalog, Dark/search + Travel filter: node `257:2`;
- mobile Phrase Detail, Dark/daily: node `255:55`;
- mobile Phrase Detail, Light/travel: node `257:47`;
- desktop catalog, Light/default: node `255:81`;
- desktop catalog, Dark/empty search: node `257:74`;
- desktop Phrase Detail, Dark/technical: node `255:162`;
- desktop Phrase Detail, Light/daily: node `257:159`;
- loading, empty and error hooks: node `257:212`;
- Product Screen Map handoff entry: node `261:2` inside canonical map `82:3`.

The catalog contract keeps query and topic state visible and URL-backed while the results surface moves between default, loading, empty and error states. Phrase Detail preserves a direct-entry hierarchy of meaning, cloze prompt, working example, usage note and one lesson-configuration action. Technical, daily and travel content variants change phrase content, not application ownership or navigation semantics.

Research and concept pages `01–08` currently act primarily as section shells in the live file. The approved direction and engineering contract are represented by the populated foundations, patterns, product-screen matrices, screen map and prototype. Do not infer missing production behavior from empty concept pages.

## Canonical production route map

This mapping is the repository-side handoff required by Issue #203. A route is production-ready only when the mapping points to explicit canonical nodes or to reviewed stable OpenPencil-native screen keys. Theme counterparts described as token-derived must preserve the same hierarchy and geometry and require separate visual verification; they are not permission to select another concept frame.

| Route / state | Canonical mobile source | Canonical desktop source | Theme/state coverage | Delivery source |
| --- | --- | --- | --- | --- |
| `/` Home | `196:223` — Mobile / Home / Dark | `194:249` — Desktop / Home / Light | opposite appearance is semantic-token derived | PR #184 / Home production slice |
| `/learn` Lesson Composer | `202:6` recommended/collapsed; `203:5` manual settings | `204:2` full composer | Light/Dark use the same composer ownership | Issue #162 |
| `/lesson/active` Active Lesson | `75:6` Recall/Default; `75:30` Recall/Correct; `75:89` Choice/Incorrect; `75:57` Recall/Offline | `75:120` Study/Light; `75:150` Recall/Correct | canonical state matrix on page `75:2` | Issue #193; offline presentation #202 |
| `/lesson/active` Lesson Result | `217:5–217:9` | `217:10–217:14` | normal, daily-goal, next-block, due-review and sync-pending/offline | Issue #194; matrix `217:2` |
| `/lesson/active?scenario` | `76:100` Light; `76:127` Dark | `76:219` Dark | scenario variants share the Active Lesson runtime owner | Issue #196 |
| `/progress` | `76:6` Light; `76:53` Dark | `76:154` Light | desktop Dark is semantic-token derived | Issue #195 |
| `/dictionary` | `78:54` Light | `78:193` Light | Dark is semantic-token derived | Issue #197 |
| `/words/[id]` | `78:99` Dark | `78:274` Dark | Light is semantic-token derived | Issue #198 |
| `/phrases` | `255:10` Light/default; `257:2` Dark/search + Travel | `255:81` Light/default; `257:74` Dark/empty search | loading/empty/error hooks `257:212` | Issue #199; handoff `261:2` |
| `/phrases/[slug]` | `255:55` Dark/daily; `257:47` Light/travel | `255:162` Dark/technical; `257:159` Light/daily | content variants do not change route ownership | Issue #199 |
| `/profile` | `79:6` Light | `79:129` Light | Dark is semantic-token derived | Issue #200 |
| shared system states | `79:69` Home Loading/Dark; `79:93` Dictionary Empty/Light; `79:117` Error/Dark | `79:194` Offline/Dark | lesson-specific offline source is `75:57` | Issue #202 |
| `/` Guest Home / `/onboarding` First Use | `docs/figma/openpencil-screen-map.json` `activeScreens` keys under `firstuse.*` | same reviewed `firstuse.*` matrix, including desktop Guest Home and diagnostics | PR #556 reviewed Guest Home, role, diagnostic pre/reveal/resume, skip/skipped, complete, loading/error/recovery in Light/Dark across mobile/desktop | Issue #201 / PR #556 |

### Route-selection rules

- `82:3` remains the historical Figma Product Screen Map & Handoff entry point.
- Production code and visual reviews use the node IDs in this document or the reviewed stable keys in `docs/figma/openpencil-screen-map.json`; a later reviewed mapping may supersede either source.
- Concept/exploration matrices are reference-only unless explicitly promoted into this map.
- A token-derived appearance means the same production composition rendered through semantic variables; it does not authorize a parallel layout.
- Historical frames must not be deleted until prototype links, component references and useful state coverage have been checked.
- First Use implementation uses the PR #556-reviewed `activeScreens` matrix. It must not reopen design scope or silently substitute legacy concept frames.
- Figma Cloud remains provenance/reference for retained historical mappings; normal AI-native First Use design maintenance is owned by OpenPencil and its repository screen map.

## Production ownership

The implementation must not introduce a second product graph.

- `RouteChrome` remains the only owner of primary route navigation outside focused First Use and Active Lesson surfaces.
- `LexigoBootstrappedApp` remains the sole session restoration, account runtime and dynamic route-entry owner.
- `LexigoGuestHomeApp` owns unauthenticated `/` and does not load account progress, scheduler state or fake authenticated status.
- `LexigoHomeApp` owns authenticated Home progress/active-lesson reads, next-best-action presentation and creation of a lesson through the existing API.
- `LexigoOnboardingApp` owns authenticated First Use state and the existing server onboarding contract; `frontend/app/onboarding/page.tsx` is the canonical App Router page that prevents the client owner from mounting over a server not-found subtree.
- Guest Home and `/onboarding` suppress ordinary route chrome through scoped First Use CSS without introducing a second navigation owner.
- `LexigoPremiumApp` retains only Phrases compatibility orchestration until the approved Issue #199 catalog/detail slice is fully extracted into its route island.
- `ReviewOutboxRuntime`, Service Worker and appearance bootstrap remain persistent shared owners and are not imported by Home.
- The backend remains authoritative for lesson position, completion, review persistence and onboarding `status/start/mark/complete/skip` state.
- Diagnostic translation/reveal is presented only after a successful server mark mutation; reload/direct entry resumes authoritative server state.
- The active lesson remains higher priority than the due queue, new study and manual configuration.
- The Dictionary route island remains isolated and must not regress.

Issue #250 changes the client-entry boundary, not the approved Home visual hierarchy. A transient `/lesson/active?resume=1` URL reuses the existing Active Lesson resume action and removes the query before execution; it does not create another lesson lifecycle owner.

## Application Shell contract

Desktop from 1024 CSS pixels uses a persistent navigation rail. Compact mobile uses an edge-to-edge bottom navigation bar with safe-area padding. Focus order, route-focus restoration, browser history, scroll restoration and minimum 44×44 interaction targets remain blocking contracts.

Light and Dark appearances use the same information hierarchy. Optional transitions are disabled under `prefers-reduced-motion: reduce`.

First Use is an intentional focused-route exception: Guest Home and onboarding remove ordinary route chrome from layout and the accessibility tree while their dedicated route island is active; the global navigation owner itself is not duplicated or refactored.

## Home contract

Authenticated Home owns one next-best action and a compact evidence surface. It does not duplicate Learn, Dictionary and Progress as secondary feature cards.

The next action resolves in this order:

1. resume the active lesson;
2. review due material;
3. start recommended new study;
4. open manual lesson configuration.

The desktop and mobile production frames preserve this order and keep the primary action above mobile bottom navigation.

Direct `/` entry and return navigation must use the dedicated Home island without repeating session restoration. Home-created or resumed lessons must reach the existing Active Lesson UI immediately, without exposing a second confirmation click.

Unauthenticated `/` is a separate truthful Guest Home surface: it explains the product and routes into authentication/onboarding or the existing guest-compatible demo path without synthesizing progress or account scheduler data.

## Current design delivery status

All nine previously canonical route parity contracts under Issue #205 are delivered:

| Route | Parity Issue | Merge PR | Status |
| --- | --- | --- | --- |
| Home | #522 | #523 | ✅ merged |
| Learn Composer | #525 | #526 | ✅ merged |
| Active Lesson | #528 | #529 | ✅ merged |
| Progress | #515 | #517 | ✅ merged |
| Dictionary | #531 | #532 | ✅ merged |
| Word Detail | #533 | #535 | ✅ merged |
| Phrases catalog | #536 | #538 | ✅ merged |
| Phrase Detail | #540 | #541 | ✅ merged |
| Profile | #542 | #543 | ✅ merged |

Additional design-linked deliveries:

- System States (Dictionary Empty renderer-equivalent): Issue #545 / PR #546 — scoped exact alternate fingerprint for hosted-runner rendering nondeterminism.
- Native Figma binary preservation: Issue #487 / PR #547 — `design/figma/LexiGo Design System.fig` stored via Git LFS, SHA-256 verified.
- First Use design gate: Issue #201 / PR #556 — reviewed OpenPencil 40-state First Use matrix, stable `activeScreens` mappings and design acceptance are merged.

Issue #201 runtime now consumes that reviewed First Use matrix rather than reopening the design gate. Repository visual tests own deterministic Linux Guest Home/onboarding evidence and require manual PNG review before any new baseline hash can be accepted.

Issue #203 remains the maintenance owner for one-route/one-production-source reconciliation. Issue #205 remains the final route-by-route visual parity audit; neither changes the runtime ownership described above.

## Figma/OpenPencil source-of-truth maintenance

The following cleanup remains necessary and is tracked by Issue #203:

- identify concept-only and production-ready variants through explicit naming/status metadata;
- remove page-number collisions when new production slices are added;
- avoid duplicating route ownership across prototype, matrix and production frames;
- update the screen map when a production slice supersedes an exploratory composition;
- preserve old variants until their state coverage has been transferred or explicitly archived;
- keep this route map synchronized after each promoted or superseded production source.

## Verification gates

The implementation is not complete until all of the following pass:

- lint, typecheck, unit tests and production build;
- desktop 1440×1024 and mobile 390×844 browser geometry;
- Light/Dark computed appearance;
- 120–200% text reflow without horizontal overflow;
- keyboard navigation and blocking accessibility audit;
- reduced-motion computed styles;
- route bundle and low-end mobile performance budgets;
- deterministic Linux visual baselines after manual PNG review;
- visual review on the deployed Stage build for runtime-changing delivery.
