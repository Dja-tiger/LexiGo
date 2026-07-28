# Compatibility cleanup delivery plan

## Verification

- Repository: `Dja-tiger/LexiGo`.
- Issue: #70 — remove unused application implementations and conflicting global styles.
- Verified base: `3d4a8dd49255da11f25fd38f92b2a8637d443517`.
- Canonical route selector: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Canonical Phrases owner: `frontend/components/lexigo-phrases-app.tsx`.
- Compatibility fallback: `frontend/components/lexigo-premium-app.tsx`.
- This document defines one deletion boundary only. It does not claim that the complete compatibility fallback or its CSS is dead.

## Reachability proof

`LexigoBootstrappedApp` resolves Phrases before the final compatibility fallback:

1. `isPhrasesRoute` accepts `/phrases` and `/phrases/[slug]`.
2. `usePhrasesIsland` depends on the product route graph and pathname, not on session presence.
3. The render branch for `LexigoPhrasesApp` appears before the final `LexigoPremiumApp` branch.
4. Therefore guest and authenticated direct entry, reload, new tab and Browser Back/Forward use the dedicated Phrases island.
5. `LexigoPremiumApp` remains reachable for guest authentication, account recovery and other fallback states; deleting the complete component is outside this slice.

The executable proof is `frontend/components/phrases-route-island-source.test.ts`.

## Canonical Phrases ownership

`LexigoPhrasesApp` owns the route-level contracts that replace the compatibility implementation:

- local guest catalog derived from the approved technical/expanded phrase content;
- authenticated bounded catalog reads through `/api/v1/words?kind=phrase&source=phrases`;
- server-order rendering without client reordering;
- independent `/api/v1/phrases/{slug}` detail lookup;
- URL-backed `topic`, `query`, `sort`, `page` and detail state;
- History state, scroll snapshot and Back/Forward restoration;
- catalog loading, empty, correlated error/retry and offline presentation;
- direct Phrase Detail loading/error/presentation;
- speech action and existing `/learn?source=phrases` handoff.

## Exact Phrases compatibility deletion candidates

The next runtime cleanup PR may remove only the following route-level family from `LexigoPremiumApp`, subject to compilation and source-contract evidence.

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
- `phraseSortMode` / `setPhraseSortMode` when no remaining non-route consumer exists after removal.

### Derived catalog/detail values

- `phraseTopics` route-catalog derivation;
- `guestPhrasePage`;
- `sortedVisiblePhrases`;
- `activePhrasePageInfo`;
- `selectedPhrase` when used only by compatibility Phrase Detail;
- route-only use of `DEFAULT_PHRASE_CATALOG` when all remaining lesson-domain fallbacks are separately preserved or replaced.

### URL/filter synchronization

- the effect guarded by `navigation.view !== "phrases"` that copies `phraseCatalogFilters(navigation)` into compatibility state;
- `openPhraseDetail`;
- `backToPhraseCatalog`;
- `changePhrasePage`;
- `applyPhraseSearch`;
- `clearPhraseSearch`;
- phrase-specific `updateCatalogSort("phrases", ...)` wiring;
- compatibility navigation branches whose only target is the Phrases catalog/detail presentation.

### API and lifecycle

- `loadPhraseCatalogResource`;
- `loadPhraseDetailResource`;
- compatibility `/api/v1/phrases/${slug}` request;
- compatibility phrase-catalog load effect;
- compatibility phrase-detail load effect;
- phrase catalog/detail reset writes in hydration and logout when those state owners have been removed.

### Presentation

- `renderPhrases`;
- compatibility Phrases `CatalogKindNavigation` branch;
- compatibility Phrases topic filter, search, sort, loading/error and pagination UI;
- compatibility Phrase Detail loading/error/content UI;
- compatibility Phrases-only calls to `CatalogSearchForm`, `CatalogSortControl`, `CatalogPagination`, `AsyncSkeletonGrid`, `AsyncStatePanel` and `SpeechPlayerButton` when no other compatibility state consumes the same import.

### Imports and types

After the route family is removed, the cleanup PR must let TypeScript identify which of these become unused rather than deleting them by name alone:

- `EXPANDED_PHRASES` and `TECHNICAL_PHRASES` route-catalog imports;
- `CatalogKindNavigation`;
- phrase-only `CatalogPagination` / `CatalogSearchForm` use;
- phrase-only `SpeechPlayerButton` use;
- `phraseCatalogFilters` and `phraseCatalogTarget`;
- `CatalogKind = "phrases" | "all-items"` narrowing or replacement;
- route-only catalog page/result/status types.

## Live shared phrase contracts that must remain

The following are not dead-code candidates merely because canonical Phrases routes were extracted:

- `LessonSource` support for `"phrases"`;
- the Lesson Composer source option “Технические фразы”;
- mixed lessons that can contain words and phrases;
- phrase conversion in `toLearningItem` when lesson payloads contain phrase items;
- phrase `slug`, `cloze` and answer fields used by active lesson/review flows;
- `mixedLessonFallbackMessage` word/phrase composition messaging;
- cloze judgement and submitted-answer behavior;
- answer suggestions using `exerciseKind: "cloze"` for phrase items;
- backend lesson preview/create/review contracts that accept or return phrase items;
- shared `TECHNICAL_PHRASES` / `EXPANDED_PHRASES` content if still consumed by the canonical Phrases guest route or tests;
- shared topic/interface copy used outside the retired compatibility presentation.

A symbol appearing in both lists must be split by consumer before removal. The route-only consumer may be deleted, but the shared-domain owner must remain or move to a canonical helper in a separate declared scope.

## CSS boundary

This proof slice does not authorize CSS deletion.

The runtime cleanup PR must first collect every class removed from `renderPhrases`, then scan all `frontend/app/*.css` and executable TS/TSX for each selector after comments are stripped. A selector can be removed only if:

- no canonical Phrases, Dictionary, Learn, auth or shared shell consumer remains;
- computed specificity/import-order behavior is understood;
- authoritative Linux visual hashes remain unchanged for a pure cleanup;
- a changed image is reviewed against the exact Figma node before any baseline promotion.

Phrases-specific canonical files such as `phrases.css` and `phrases-compat.css` are not legacy merely because the compatibility component contains old Phrases markup.

## Next atomic runtime cleanup slice

Permitted objective:

> Remove the unreachable Phrases catalog/detail compatibility family from `LexigoPremiumApp` while preserving guest/auth fallback and all shared phrase lesson-domain behavior.

Required implementation discipline:

1. Update the task allow-list before editing `lexigo-premium-app.tsx`.
2. Remove the smallest complete route family, not unrelated auth, lesson, all-items or CSS code.
3. Replace the current candidate-presence assertions with absence assertions for every retired marker.
4. Keep the canonical Phrases reachability and ownership assertions.
5. Let lint/typecheck identify unused imports and types; verify each removal against the live shared-contract list.
6. Add selector absence evidence only for classes actually removed from executable markup.
7. Record the exact branch-to-base line/byte reduction and route bundle result without raising any release budget.

## Required validation for the runtime cleanup PR

- Agent Harness source contract;
- frontend lint and TypeScript;
- all unit/source contracts and production build;
- direct `/phrases` and `/phrases/[slug]` guest/auth entry;
- catalog search/filter/sort/pagination, reload and Back/Forward;
- Learn handoff and phrase lesson creation;
- phrase-containing Active Lesson review, cloze answer and suggestion behavior;
- desktop Chromium/WebKit and Android/iOS projects;
- keyboard, axe, reduced motion, forced colors and 200% reflow;
- authoritative Linux visual regression without baseline updates for pure dead-code removal;
- controlled bundle comparison and existing permanent budgets;
- full backend/frontend/browser/container CI;
- review audit, expected-head squash merge and exact-SHA stage/public validation.

## Stop conditions

Do not proceed with removal if any of the following is true:

- the fallback is still selected for a Phrases pathname;
- a candidate marker has a non-route lesson/auth consumer;
- a CSS selector remains in canonical markup;
- a visual hash changes without a computed-cascade explanation and Figma review;
- bundle evidence is unavailable;
- the branch expands into auth fallback extraction or broad CSS consolidation.
