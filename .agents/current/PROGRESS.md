# Current Task Progress

## 2026-07-28 21:24 Europe/Berlin

### Verified

- Live base remains `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Draft PR #281 is the only active production slice.
- `frontend/docs/compatibility-cleanup.md` authorizes exactly one Phrases catalog/detail compatibility runtime deletion family and explicitly prohibits CSS deletion.
- Canonical `/phrases` and `/phrases/[slug]` remain owned by `LexigoPhrasesApp` before the compatibility fallback for guest and authenticated entry.
- Shared phrase lesson-domain behavior remains in `LexigoPremiumApp` and is protected by explicit source assertions.

### Finding

`LexigoPremiumApp` retained an unreachable route-level Phrases catalog/detail implementation after the canonical route island became authoritative. The dead family included state, filter synchronization, API loaders, lifecycle effects, navigation helpers, duplicated presentation markup and one shared resource-stack notice that still referenced the removed loader/state.

### Root cause

The route island extraction intentionally deferred compatibility deletion until executable reachability and deletion-boundary proof existed. PR #277 supplied that proof; this slice consumes it without expanding into CSS or auth/account fallback ownership. The first deletion contract asserted declaration markers but did not initially forbid residual identifier consumers, which self-review caught before authoritative CI.

### Implemented

- Removed route-only Phrases imports, state, URL synchronization, derived catalog/detail values, catalog/detail API resources, lifecycle effects, reset writes, navigation handlers, resource notice and `renderPhrases` branch.
- Removed route-only `itemKey`, `CatalogKindNavigation`, `SpeechPlayerButton` and volume icon ownership.
- Narrowed compatibility catalog sorting to the remaining `all-items` owner.
- Replaced candidate-presence assertions with identifier-level absence assertions for all retired route state/resources.
- Expanded shared-contract assertions for `DEFAULT_PHRASE_CATALOG`, `toLearningItem` and unauthenticated phrase browsing.
- Preserved phrase lesson source, mixed lesson fallback, conversion/cloze fallback, Active Lesson review and answer-suggestion behavior.
- Removed every transient edit workflow before review; none is present in the final diff.

### Source metrics

- `frontend/components/lexigo-premium-app.tsx`: 3,108 → 2,787 lines, net reduction 321 lines.
- Runtime diff: 7 additions, 328 deletions.
- Source-contract diff: 23 additions, 2 deletions.
- Final branch-to-base tree: exactly five allowed files; no CSS, backend, API, deployment, baseline or workflow file.

### Checks passed

- Exact-base branch and single-PR pre-flight.
- Fail-closed source transformation; rejected boundaries produced no runtime commit.
- Full read-back of relevant final source/test regions.
- Exact absence of declarations and residual uses for 12 retired Phrases identifiers.
- Exact presence markers for canonical route ownership and shared phrase lesson-domain contracts.
- Manual diff-review found and removed the stale resource-stack consumer before final CI.
- Final diff allow-list and temporary-workflow absence.

### Checks pending

- Authoritative frontend lint, TypeScript, unit/source contracts and production build.
- Browser/device/accessibility/PWA/visual/performance/container matrix.
- Controlled bundle comparison and permanent budget verification.
- Review audit, immutable-head CI, squash merge and exact-SHA stage/public validation.

### Checks failed

- No product check has failed on the complete implementation head.
- Earlier transient transformer attempts rejected incorrect textual boundaries before creating runtime commits.

### Current implementation SHA

`2b607c37faabed4030b8c88f298d62ab8c0b5124`

### Current branch head

Resolve from live branch ref after Agent Harness updates.

### Next action

Run and inspect authoritative CI on the final five-file diff. Address only failures attributable to this slice, then collect bundle/visual evidence and complete the review/merge/deployment gates.