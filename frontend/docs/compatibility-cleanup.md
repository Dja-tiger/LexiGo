# Compatibility cleanup delivery plan

## Verification

- Repository: `Dja-tiger/LexiGo`.
- Issue: #70 — remove unused application implementations and conflicting global styles.
- Phrases runtime deletion base: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Phrases CSS consolidation base: `986ab18f4faa2f8a0581133e976cb104a3e4434a`.
- Runtime deletion PR: #282.
- CSS ownership PR: #284.
- Canonical route selector: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Canonical Phrases runtime owner: `frontend/components/lexigo-phrases-app.tsx`.
- Canonical Phrases visual owner: `frontend/app/phrases.css`.
- Compatibility fallback: `frontend/components/lexigo-premium-app.tsx`.
- This document records completed bounded route-runtime/CSS work and executable reachability boundaries. It does not claim that the complete compatibility fallback or unrelated global CSS is dead.

## Reachability proof

`LexigoBootstrappedApp` resolves Phrases before the final compatibility fallback:

1. `isPhrasesRoute` accepts `/phrases` and `/phrases/[slug]`.
2. `usePhrasesIsland` depends on the product route graph and pathname, not on session presence.
3. The render branch for `LexigoPhrasesApp` appears before the final `LexigoPremiumApp` branch.
4. Guest and authenticated direct entry, reload, new tab and Browser Back/Forward therefore use the dedicated Phrases island.
5. `LexigoPremiumApp` remains reachable for guest authentication, account recovery and other fallback states; deleting the complete component remains outside these slices.

The executable proof is `frontend/components/phrases-route-island-source.test.ts`.

## Canonical Phrases ownership

`LexigoPhrasesApp` owns the route-level contracts that replaced the compatibility implementation:

- local guest catalog derived from approved technical/expanded phrase content;
- authenticated bounded catalog reads through `/api/v1/words?kind=phrase&source=phrases`;
- server-order rendering without client reordering;
- independent `/api/v1/phrases/{slug}` detail lookup;
- URL-backed `topic`, `query`, `sort`, `page` and detail state;
- History state, scroll snapshot and Back/Forward restoration;
- catalog loading, empty, correlated error/retry and offline presentation;
- direct Phrase Detail loading/error/presentation;
- speech action and the existing `/learn?source=phrases` handoff.

`frontend/app/phrases.css` owns the route-specific Phrases visual system and the scoped computed-cascade overrides required over the shared catalog base.

## Completed Phrases compatibility runtime deletion

PR #282 removes the following unreachable route-level family from `LexigoPremiumApp`.

### State

- `phraseCatalog` / `setPhraseCatalog`;
- `phraseCatalogStatus` / `setPhraseCatalogStatus`;
- `remotePhraseDetail` / `setRemotePhraseDetail`;
- `phraseDetailStatus` / `setPhraseDetailStatus`;
- `phraseCatalogPageInfo` / `setPhraseCatalogPageInfo`;
- `phrasePage` / `setPhrasePage`;
- `phraseSearchInput` / `setPhraseSearchInput`;
- `phraseSearch` / `setPhraseSearch`;
- `phraseTopic` / `setPhraseTopic`;
- `phraseSortMode` / `setPhraseSortMode`.

### Derived catalog/detail values

- `phraseTopics` route-catalog derivation;
- `guestPhrasePage`;
- `sortedVisiblePhrases`;
- `activePhrasePageInfo`;
- compatibility-only `selectedPhrase`.

### URL/filter synchronization

- the effect guarded by `navigation.view !== "phrases"`;
- `openPhraseDetail`;
- `backToPhraseCatalog`;
- `changePhrasePage`;
- `applyPhraseSearch`;
- `clearPhraseSearch`;
- phrase-specific catalog-sort wiring;
- the compatibility `navigation.view === "phrases"` render branch.

### API and lifecycle

- `loadPhraseCatalogResource`;
- `loadPhraseDetailResource`;
- the compatibility `/api/v1/phrases/${slug}` request;
- phrase-catalog and phrase-detail effects;
- phrase catalog/detail reset writes in hydration and logout;
- the route-level Phrases `AsyncResourceNotice`.

### Presentation and route-only dependencies

- `renderPhrases`;
- compatibility Phrases `CatalogKindNavigation`;
- compatibility topic filter, search, sort, loading/error, pagination and detail UI;
- compatibility-only `SpeechPlayerButton` and volume icon branch;
- `phraseCatalogFilters` and `phraseCatalogTarget` imports;
- the `CatalogKind` branch used only to distinguish Phrases from all-items sorting;
- route-only `itemKey`.

The all-items sort control remains, but its API is narrowed to the remaining all-items owner.

## Live shared phrase contracts preserved

The deletion audit found that some symbols used by the retired route were also live lesson-domain owners. They remain intentionally:

- `LessonSource` support for `"phrases"`;
- the Lesson Composer option “Технические фразы”;
- mixed lessons containing words and phrases;
- `DEFAULT_PHRASE_CATALOG` for phrase `slug` and `cloze` fallback in `toLearningItem`;
- `sortLearningItems` and `sortCatalogEntries` for guest phrase browsing in the shared all-items lesson flow;
- phrase conversion and answer fields used by Active Lesson/review flows;
- `mixedLessonFallbackMessage` word/phrase composition messaging;
- cloze judgement and submitted-answer behavior;
- answer suggestions using `exerciseKind: "cloze"` for phrase items;
- backend lesson preview/create/review contracts that accept or return phrase items;
- shared `TECHNICAL_PHRASES` / `EXPANDED_PHRASES` content.

The source contract asserts both sides of the boundary: retired route markers must be absent, while these shared lesson markers must remain.

## Runtime source reduction

Against base `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`, PR #282 changed `frontend/components/lexigo-premium-app.tsx` by 11 additions and 334 deletions, net `-323` lines, without stylesheet, visual baseline, backend, API, migration or bundle-budget changes.

## Phrases CSS ownership consolidation

PR #284 removes an obsolete ownership boundary, not live declarations.

Before consolidation:

- `frontend/app/catalog-enhancements.css` owned the shared catalog-sort base;
- `frontend/app/phrases.css` owned the canonical Phrases route visual system;
- `frontend/app/phrases-compat.css`, imported immediately after `phrases.css`, owned seven live route-scoped override groups introduced after a computed-contrast failure.

After consolidation:

- root layout imports `catalog-enhancements.css` before `phrases.css` and no longer imports `phrases-compat.css`;
- the exact selector text, specificity and declaration values from `phrases-compat.css` live once in `phrases.css` under `Issue #70: canonical Phrases computed-cascade ownership`;
- `phrases-compat.css` is deleted;
- catalog-sort border/text/surface/elevation, selected-topic contrast, results spacing and forced-colors values remain unchanged;
- no selector rename, specificity increase, redesign or baseline promotion is permitted.

The executable ownership proof is `frontend/components/phrases-css-ownership.test.ts`. It validates compatibility-file absence, layout import order, selector uniqueness and exact preserved declarations.

## Authoritative visual boundary

Pure CSS consolidation requires unchanged content-addressed images. `frontend/e2e/phrases-visual.spec.ts` protects eight approved compact/desktop Light/Dark catalog/detail images.

Any changed Phrases visual hash stops PR #284. A baseline may not be promoted merely to complete cleanup; the actual must first be compared with the exact approved Figma node and the computed-cascade difference explained.

## Required validation for PR #284

- Agent Harness and change-scope classification;
- Phrases CSS ownership source contract;
- frontend lint, TypeScript, all unit/source contracts, production build and dependency audit;
- direct `/phrases` and `/phrases/[slug]` guest/auth entry;
- catalog search/filter/sort/pagination, reload and Back/Forward;
- keyboard, axe, reduced motion, forced colors and 200% reflow;
- all eight authoritative Phrases Linux visual hashes without baseline updates;
- complete desktop Chromium/WebKit and Android/iOS browser matrix;
- existing performance budgets without ceiling changes;
- full backend/frontend/browser/container CI;
- review audit, expected-head squash merge and exact-SHA stage/public validation.

## Remaining Issue #70 work

After each bounded slice is fully validated and deployed, choose the next minimal compatibility or selector family only from fresh reachability, markup-consumer and computed-cascade evidence.

Do not combine:

- auth fallback extraction;
- broad `LexigoPremiumApp` removal;
- unrelated global selector cleanup;
- redesign or baseline promotion.

A later selector can be removed only if:

- executable TS/TSX and comment-stripped CSS search proves no remaining consumer;
- specificity and import-order ownership are understood;
- effective declarations are preserved in the canonical owner where required;
- authoritative Linux visual hashes remain unchanged for pure cleanup;
- any changed image is reviewed against the exact approved Figma node before baseline promotion.

## Stop conditions

Do not broaden a slice if any of the following is true:

- the fallback is still selected for the target pathname;
- a candidate marker has a non-route lesson/auth consumer;
- a CSS selector remains in canonical markup;
- a visual hash changes without a computed-cascade explanation and Figma review;
- bundle or browser evidence is unavailable;
- the branch expands into auth fallback extraction, unrelated CSS consolidation or redesign.

## Completed Progress compatibility presentation deletion

The dedicated `LexigoProgressApp` is selected for `/progress` before the compatibility fallback for both guest and authenticated entry. The bounded deletion removes only the unreachable route-level Progress presentation from `LexigoPremiumApp`:

- `renderProgress`;
- the `navigation.view === "progress"` render branch;
- the Progress-only suppression of the shared resource notice;
- the Progress-only calendar-card condition;
- presentation-only helpers `normalizedProgressModes`, `objectiveSuccessRate`, `GOAL_OPTIONS` and `nextDueLabel`.

Shared progress-domain consumers remain intentionally live: `progress` and `progressStatus`, hydration and refresh, Home summary and next action, header streak, Profile daily goal, Dictionary context, lesson completion snapshots, navigation to the canonical Progress route, and the shared calendar dialog trigger. The executable two-sided boundary is `frontend/components/progress-route-island-source.test.ts`.

## Scenario catalog/detail reachability boundary

The dedicated Scenario entries are selected before the compatibility fallback for authenticated sessions:

1. `isScenarioCatalogRoute` accepts exactly `/scenarios`.
2. `isScenarioDetailRoute` accepts `/scenarios/[slug]`.
3. `useScenarioCatalogIsland` and `useScenarioIsland` require a restored authenticated session.
4. Both `LexigoScenarioCatalogApp` and `LexigoScenarioApp` render before the final `LexigoPremiumApp` fallback.
5. Guest direct entry is a live authentication boundary, not dead Scenario presentation: bootstrap rewrites the route to `/profile?session=required&return_to=...` before presenting guest auth/recovery.

Canonical ownership is split deliberately:

- `LexigoScenarioCatalogApp` owns authenticated catalog reads, payload validation and progress-backed recommendation evidence;
- `LexigoScenarioApp` owns direct detail loading, attempt lifecycle, optimistic submissions, draft/sessionStorage recovery and safe exit;
- `LexigoBootstrappedApp` remains the sole session restoration and guest redirect owner;
- `LexigoPremiumApp` remains live for guest authentication, account recovery and unknown-route fallback.

This slice proves reachability only. It does not delete runtime, alter auth behavior or claim the complete compatibility fallback is dead. The executable two-sided proof is `frontend/components/scenario-route-island-source.test.ts`.

## Completed Home compatibility presentation deletion

PR #311 established the two-sided root-route boundary: `isHomeRoute` forces `/` onto the Home graph and `LexigoHomeApp` renders before the final `LexigoPremiumApp` fallback. PR #313 removes only the now-unreachable Home presentation family from `LexigoPremiumApp`:

- `renderHome`;
- the `navigation.view === "home"` dispatch branch;
- Home-only `WORD_PREVIEW`;
- Home-only `russianPlural`, `goalPercent` and `RETAINED_COPY` dependencies.

Shared compatibility owners remain intentionally live: guest authentication, password recovery, unknown-route fallback, persistent navigation, progress and active-lesson resource loading, Lesson Composer, Dictionary compatibility, Profile, Active Lesson, Lesson Result, `startLesson`, `resumeLesson`, and transitions whose destination is Home. No CSS, visual baseline, API, backend, workflow, deployment or bundle-ceiling contract changes are part of this deletion.

The executable absence/preservation proof is `frontend/components/home-route-island-source.test.ts`.
