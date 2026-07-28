# Compatibility cleanup delivery plan

## Verification

- Repository: `Dja-tiger/LexiGo`.
- Issue: #70 — remove unused application implementations and conflicting global styles.
- Current CSS cleanup base: `986ab18f4faa2f8a0581133e976cb104a3e4434a`.
- Completed Phrases runtime PR: #282.
- Canonical route selector: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Canonical Phrases owner: `frontend/components/lexigo-phrases-app.tsx`.
- Compatibility fallback: `frontend/components/lexigo-premium-app.tsx`.
- Shared speech stylesheet: `frontend/app/speech-player.css`.
- This document records independently bounded runtime and CSS deletion families. It does not claim that the complete compatibility fallback or all compatibility CSS is dead.

## Reachability proof

`LexigoBootstrappedApp` resolves Phrases before the final compatibility fallback:

1. `isPhrasesRoute` accepts `/phrases` and `/phrases/[slug]`.
2. `usePhrasesIsland` depends on the product route graph and pathname, not on session presence.
3. The render branch for `LexigoPhrasesApp` appears before the final `LexigoPremiumApp` branch.
4. Guest and authenticated direct entry, reload, new tab and Browser Back/Forward therefore use the dedicated Phrases island.
5. `LexigoPremiumApp` remains reachable for guest authentication, account recovery and other fallback states; deleting the complete component remains outside these slices.

The executable route proof is `frontend/components/phrases-route-island-source.test.ts`.

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

The runtime deletion audit found symbols used by the retired route that are also live lesson-domain owners. They remain intentionally:

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

The route source contract asserts both sides of the boundary: retired route markers must be absent, while shared lesson markers must remain.

## Runtime source reduction

Against base `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`, PR #282 reports:

- `frontend/components/lexigo-premium-app.tsx`: 11 added lines, 334 deleted lines;
- net reduction: 323 lines;
- no stylesheet, visual baseline, backend, API, migration or bundle-budget change.

Existing route budgets were not increased.

## CSS ownership rule

Runtime deletion does not authorize broad CSS changes. A selector can be removed only if:

- executable TS/TSX and comment-stripped CSS search proves no remaining consumer;
- specificity and import-order ownership are understood;
- declarations shared with a live sibling selector are preserved;
- authoritative Linux visual hashes remain unchanged for pure cleanup;
- any changed image is reviewed against the exact approved Figma node before baseline promotion.

Phrases-specific canonical files such as `phrases.css` and `phrases-compat.css` are not legacy merely because the old compatibility markup was removed.

## Selected legacy speech layout CSS family

The next bounded selector family contains exactly:

- `.lx-detail-speech-row` — the retired compatibility Phrase Detail heading/speech row;
- `.lx-test-prompt-row` — the retired compatibility lesson prompt/speech row.

Fresh repository evidence shows both class contracts only in `frontend/app/speech-player.css` before deletion. They are absent from executable `frontend/app` and `frontend/components` TS/TSX.

Canonical speech presentation uses independent owners:

- Phrase Detail: `.lx-phrase-detail-title-row` and `.lx-phrase-listen`;
- Word Detail: `.lx-word-detail-hero` and `.lx-word-detail-speech`;
- Active Lesson: `.lx-active-lesson__utilities` and route-owned Active Lesson styles;
- shared runtime state/feedback: `.lx-speech-player`, `.lx-speech-feedback`, loading, error, unsupported and reduced-motion rules.

The deletion removes only declarations whose selector lists contain the two retired classes:

- flex row geometry and heading `min-width`;
- retired prompt width, alignment, margins and typography;
- retired prompt child sizing;
- legacy 48 px speech-button geometry scoped to the two rows;
- the compact 10 px gap override scoped to the two rows.

No live sibling selector is discarded. `frontend/app/legacy-speech-layout-style-ownership.test.ts` scans comment-stripped CSS and executable TS/TSX, requires both retired contracts to remain absent and protects the canonical speech owners and import order.

## Required validation for the legacy speech CSS slice

- Agent Harness source contract;
- frontend lint and TypeScript;
- all unit/source contracts and production build;
- Phrase Detail, Word Detail and Active Lesson Study speech behavior;
- desktop Chromium/WebKit and Android/iOS projects;
- keyboard, axe, reduced motion, forced colors and 200% reflow;
- authoritative Linux visual regression without baseline updates;
- existing performance budgets;
- full backend/frontend/browser/container CI;
- review audit, expected-head squash merge and exact-SHA stage/public validation.

## Remaining Issue #70 work

After this selector family is fully validated and deployed, choose the next minimal compatibility or CSS family only from fresh reachability, consumer and computed-cascade evidence. Do not combine auth fallback extraction, broad `LexigoPremiumApp` removal or CSS consolidation with this slice.

## Stop conditions

Do not broaden a deletion if any of the following is true:

- the fallback is still selected for the target pathname;
- a candidate marker has a non-route lesson/auth consumer;
- a CSS selector remains in canonical or generated markup;
- a grouped declaration has a live sibling selector;
- a visual hash changes without a computed-cascade explanation and Figma review;
- bundle/performance evidence is unavailable;
- the branch expands into auth fallback extraction or broad CSS consolidation.
