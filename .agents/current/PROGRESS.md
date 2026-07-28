# Current Task Progress

## 2026-07-28 21:18 Europe/Berlin

### Verified

- Live base remains `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Draft PR #281 is the only active production slice.
- `frontend/docs/compatibility-cleanup.md` authorizes exactly one Phrases catalog/detail compatibility runtime deletion family and explicitly prohibits CSS deletion.
- Canonical `/phrases` and `/phrases/[slug]` remain owned by `LexigoPhrasesApp` before the compatibility fallback for guest and authenticated entry.
- Shared phrase lesson-domain behavior remains in `LexigoPremiumApp` and was protected by explicit source assertions.

### Finding

`LexigoPremiumApp` retained an unreachable route-level Phrases catalog/detail implementation after the canonical route island became authoritative. The dead family included state, filter synchronization, API loaders, lifecycle effects, navigation helpers and duplicated presentation markup.

### Root cause

The route island extraction intentionally deferred compatibility deletion until executable reachability and deletion-boundary proof existed. PR #277 supplied that proof; this slice consumes it without expanding into CSS or auth/account fallback ownership.

### Implemented

- Removed route-only Phrases imports, state, URL synchronization, derived catalog/detail values, catalog/detail API resources, lifecycle effects, reset writes, navigation handlers and `renderPhrases` branch.
- Removed route-only `itemKey`, `CatalogKindNavigation`, `SpeechPlayerButton` and volume icon ownership.
- Narrowed compatibility catalog sorting to the remaining `all-items` owner.
- Replaced source-contract candidate-presence assertions with exact absence assertions.
- Expanded shared-contract assertions for `DEFAULT_PHRASE_CATALOG`, `toLearningItem` and unauthenticated phrase browsing.
- Preserved phrase lesson source, mixed lesson fallback, conversion/cloze fallback, Active Lesson review and answer-suggestion behavior.
- Removed the transient edit workflow before review; it is absent from the final diff.

### Source metrics

- `frontend/components/lexigo-premium-app.tsx`: 3,108 → 2,788 lines, net reduction 320 lines.
- Runtime diff: 7 additions, 327 deletions.
- Source-contract diff: 11 additions, 2 deletions.
- Final branch-to-base tree: exactly five allowed files; no CSS, backend, API, deployment, baseline or workflow file.

### Checks passed

- Exact-base branch and single-PR pre-flight.
- Fail-closed source transformation; two rejected boundary attempts produced no runtime commit.
- Read-back of final source and test blobs.
- Exact absence markers for legacy Phrases route family.
- Exact presence markers for canonical route ownership and shared phrase lesson-domain contracts.
- Final diff allow-list and temporary-workflow absence.

### Checks pending

- Authoritative frontend lint, TypeScript, unit/source contracts and production build.
- Browser/device/accessibility/PWA/visual/performance/container matrix.
- Controlled bundle comparison and permanent budget verification.
- Review audit, immutable-head CI, squash merge and exact-SHA stage/public validation.

### Checks failed

- No product check has failed yet.
- The temporary transformer initially rejected two incorrect boundary markers before any source write; both were corrected using exact source read-back.

### Current implementation SHA

`169e8978588cfe3cd9adf22fe4b0dbf17bdbc6fd`

### Current branch head

Resolve from live branch ref after Agent Harness updates.

### Next action

Run and inspect authoritative CI on the final five-file diff. Address only failures attributable to this slice, then collect bundle/visual evidence and complete the review/merge/deployment gates.