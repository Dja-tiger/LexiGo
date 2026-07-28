# Current Task Progress

## 2026-07-28 21:43 Europe/Berlin

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
- Removed every transient edit and measurement workflow before final review; none is present in the final diff.

### Source metrics

- `frontend/components/lexigo-premium-app.tsx`: 3,108 → 2,787 lines, net reduction 321 lines.
- Runtime diff: 7 additions, 328 deletions.
- Source-contract diff: 23 additions, 2 deletions.
- Final branch-to-base tree: exactly five allowed files; no CSS, backend, API, deployment, baseline or workflow file.

### Authoritative CI evidence

- CI #2323/run `30387297239` completed successfully on immutable head `5152776d04e4902a17966931687deeec2987b479` before the final evidence-only Agent Docs update.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit passed.
- Backend formatting, static analysis, race-enabled unit tests, coverage, vulnerability scan and integration tests passed.
- Both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, content security, accessibility audit, performance budgets and authoritative Linux visual regression passed.
- Frontend aggregate quality and both API/web container builds passed.
- No visual baseline or permanent budget file changed.

### Controlled bundle evidence

- Dedicated measurement run `30388331928` completed successfully on current PR merge-ref `01776b209334007eb1f54f2e0d5e178bd40535b7` using Pixel 5 Chromium, disabled cache, 4x CPU throttle and simulated 3G.
- `/phrases`: 226,093 JavaScript bytes and 19 initial requests against permanent ceilings 235,000 bytes and 22 requests.
- Compared with the committed `/phrases` baseline of 226,149 bytes, current transfer is 56 bytes lower.
- All ten canonical routes remained within their existing permanent ceilings; no budget increase is required.

### Checks passed

- Exact-base branch and single-PR pre-flight.
- Fail-closed source transformation; rejected boundaries produced no runtime commit.
- Full read-back of relevant final source/test regions.
- Exact absence of declarations and residual uses for 12 retired Phrases identifiers.
- Exact presence markers for canonical route ownership and shared phrase lesson-domain contracts.
- Manual diff-review found and removed the stale resource-stack consumer before authoritative CI.
- Final diff allow-list and transient-workflow absence.
- Full runtime CI and controlled bundle measurement.

### Checks pending

- Final immutable-head CI after this evidence-only Agent Docs update.
- Ready-for-review transition and final review-thread audit.
- Expected-head squash merge.
- Exact-SHA stage deployment, public smoke and public browser validation.
- Separate post-merge Agent Docs reconciliation and current-context reset.

### Checks failed

- No product check failed on the complete implementation.
- Earlier transient transformer attempts rejected incorrect textual boundaries before creating runtime commits.
- The unrelated `Actions storage cleanup` workflow can fail independently and is not a required product gate; authoritative CI and measurement jobs succeeded.

### Current implementation SHA

`2b607c37faabed4030b8c88f298d62ab8c0b5124`

### Current branch head

Resolve from live branch ref after the final execution-record update.

### Next action

Publish the final execution record, verify the five-file diff, and require one last full CI on the resulting immutable head. Do not modify the branch after that CI succeeds.