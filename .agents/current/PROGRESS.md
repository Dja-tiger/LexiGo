# Current Task Progress

## 2026-07-26 15:14 Europe/Berlin

### Verified

- Live `main` remains `72291d9351f3c565d13be7b3f9e9055258f98ac6`; the feature branch is still based on that exact SHA and PR #235 remains Draft.
- Issue #198 is the active atomic product slice. Approved Figma sources are Mobile Dark `78:99` and Desktop Dark `78:274`; Light appearance is derived from Foundation V1 tokens and separately reviewed Linux evidence.
- `/words/[id]` stays inside the existing Dictionary client island and independently loads authenticated `GET /api/v1/words/{wordID}` without catalog metadata, Progress or catalog-page warm-up.
- Scheduler fields `easiness`, `intervalDays`, `repetitions`, `dueAt` and optional `lastReviewedAt` are strictly validated before presentation.
- Related phrases use bounded server-owned phrase search (`limit=3`) and preserve exact API order.
- Practice creation uses the existing Lesson API with exactly `wordIds: [selectedWordId]`.
- Cold-route performance baseline is `212877` JavaScript bytes and `18` requests, with enforced ceilings `245000`/`20`.

### Implemented

- Separate Word Detail controller and presentation component with direct-entry loading/error/retry states.
- Canonical compact/desktop Light/Dark presentation, 320 px and 200% reflow, reduced-motion and forced-colors contracts.
- Accessible browser pronunciation with unsupported/error fallback that preserves the visible word and practice path.
- Dictionary URL-state, Back/Forward and scroll/history ownership remain in the existing route island.
- Exact single-word lesson journey is protected by browser request-body and destination assertions.
- Route-local dark foreground `#9fb7ff` corrects the two confirmed WCAG contrast defects for the «Пример» heading and active desktop Dictionary rail.
- Cross-island handoff now keeps the Dictionary island mounted until App Router has actually changed `window.location.pathname`; a cancelable `requestAnimationFrame` route predicate replaces the failed synchronous/fixed-delay graph swap.

### CI findings and classification

- CI #1952 on head `feb32051352fdcfa80d1bb864fa1bd66bd81878f` confirmed frontend core and backend gates but exposed two production contrast defects and one production route-handoff race.
- Axe measured 3.29:1 for the «Пример» heading and 3.73:1 for the active Dictionary rail. Both are fixed route-locally; the replacement foreground is documented at 4.99:1 and 5.65:1 on the actual dark surfaces.
- UI shard 1/2 showed that lesson creation succeeded with the exact request body but the Dictionary island unmounted before `router.push` committed `/lesson/active`.
- CI #1955 on checkpoint head `7f00019d372a3daf2fd7bd14bac39c3abc69d27c` passed frontend core and produced corrected Linux visual actuals, but proved `setTimeout(0)` was still an invalid lifecycle proxy. The implementation now waits for the actual pathname transition.
- The failure category and prevention rule are recorded in `.agents/AGENTS.progress-pr214.md`.

### Reviewed Linux visual evidence

Source: CI #1955, visual artifact `8632306006`, head `7f00019d372a3daf2fd7bd14bac39c3abc69d27c`.

- compact Light: `390 × 1745`, SHA-256 `0d9eade831f96bcdf7b55132ebce75c69cf22bd4be9761d28e0ce98595968f7b`;
- compact Dark: `390 × 1745`, SHA-256 `f985ac2cce5ae144e09dbe296de886de10b3fe31b01e175cd579f85812ca8088`;
- desktop Light: `1440 × 1160`, SHA-256 `64258a07b5010045dcc4929110f5635d072c995bfaf315d9140aee0e6a3abf72`;
- desktop Dark: `1440 × 1160`, SHA-256 `0d5f69b6b4ecb530bd51b421e20f5fcd66f4bc01d60bb20969b592e9a95fde24`.

All four actuals were manually reviewed against the approved Word Detail hierarchy before promotion into the content-addressed visual contract.

### Changed owners

- Runtime/presentation: `frontend/components/word-detail-route.tsx`, `frontend/components/word-detail-presentation.tsx`.
- Session/API/history/route handoff: `frontend/components/lexigo-dictionary-app.tsx`, bounded clarification in `frontend/components/lexigo-bootstrapped-app.tsx`.
- Validation: `frontend/lib/word-detail.ts` and unit tests.
- Styling: `frontend/app/word-detail.css`, `frontend/app/dictionary-detail-compatibility.css`, global import only through `frontend/app/layout.tsx`.
- Regression protection: App Router, PWA, accessibility, ownership, performance and visual tests/fixtures.
- Harness: current task records and the confirmed route-island failure lesson.

### Current state

- Baselines and regression contracts are committed.
- Final developer-authored branch head must be resolved from live GitHub after this documentation update.
- Required full CI, Ready transition, squash merge, exact-SHA stage validation, Issue #198 closure and separate post-merge repository-memory reconciliation remain pending.

### Next action

Run and analyze the complete required CI on the final head. Do not mark Ready or merge until every required frontend/backend/browser/PWA/accessibility/visual/performance gate is green and the PR diff/review state is clean.
