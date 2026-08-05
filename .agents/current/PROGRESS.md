# Current Task Progress

## 2026-08-06 02:27 Europe/Moscow

### Verified

- Live `main` remains `ecbb16dd42cd0567f3a9c760f2ea938aede8bb6b`.
- Draft PR #411 targets `main` from `agent/issue-74-word-detail-back-target`.
- PR #411 contains exactly eight allowed paths: three current-harness records and five frontend product/test paths.
- Canonical `/words/[id]` remains owned by `LexigoDictionaryApp` and `WordDetailPresentation`.
- `.lx-word-detail-back` remains a native button with desktop name `Словарь`, compact name `Слово` and existing `onBack` behavior.
- The new interaction stylesheet expands only the transparent block-axis event surface to 44px fine / 48px coarse while retaining the 42px painted border box.
- No runtime, API, History, storage, focus, visual baseline or existing Word Detail presentation owner changed.

### Finding

The canonical Word Detail Back action previously failed the Issue #74 minimum target-height contract because its 42px painted control had no separate interaction-only hit surface.

### Root cause

`frontend/app/word-detail.css` correctly owned the approved painted presentation, but no route-scoped interaction layer expanded the live text-only action to the input-modality minimum.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/word-detail-back-touch-targets.css`
- `frontend/components/word-detail-back-touch-target-source.test.ts`
- `frontend/e2e/word-detail-back-touch-targets.spec.ts`
- `frontend/package.json`

### Checks passed

Authoritative CI #2904, run `31052177676`, completed successfully on immutable product/test head `fd06113d9670ed67954043a98799bc5595fd1494`:

- change-scope classification and Agent Docs routing contract;
- backend formatting, static analysis, race unit tests, vulnerability scan and integration race tests;
- frontend lint, TypeScript, unit/source contracts, production build and dependency audit;
- lesson completion;
- accessibility audit;
- both UI shards, including the new desktop Chromium, Android Chromium and iOS WebKit Word Detail target proof;
- unchanged Linux visual regression baselines;
- performance budgets;
- controlled Service Worker;
- iOS PWA Dictionary;
- content security and Dictionary smoke;
- web and API container builds;
- final frontend quality aggregation.

The browser proof verified 42px painted geometry, 44/48px effective height, transparent pseudo styles, four perimeter hits, status separation, route-content clearance, existing visible focus, URL-backed Dictionary restoration and no horizontal overflow at 1440px, 390px and 320px.

### Checks failed

- None.

### Current branch head

- Product/test head validated by CI #2904: `fd06113d9670ed67954043a98799bc5595fd1494`.
- Final evidence-only head: resolve from live branch ref after the current-harness commit.

### Next action

Run full authoritative CI on the final evidence-only head, verify PR metadata/reviews and exact diff, mark PR #411 Ready, squash-merge with expected head, then validate exact merged SHA on `main` and stage before repository-memory reconciliation.
