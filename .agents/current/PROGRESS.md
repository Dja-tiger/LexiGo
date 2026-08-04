# Current Task Progress

## 2026-08-04 Europe/Moscow

### Verified

- Exact reconciled base: `c51b1d0ff41ec9cc3dfcfdfd1f7a8b1304937fb4`.
- No intersecting Issue #70 product PR was open before this slice.
- The reviewed overlap manifest contains exactly four `.lx-phrase-grid` premium → Phrases conflicts: one `gap` and three `grid-template-columns` items.
- `PhrasesCatalog` is the only production renderer found for `lx-phrase-grid` and renders below `data-route-client-island="phrases"`.
- Premium fallback values remain 13px / three columns globally, two columns through 1040px and one column through 760px.
- The canonical Phrases values remain 10px / one column at every width.

### Finding

The unscoped `.lx-phrase-grid` rule in `phrases.css` had the same specificity as the premium fallback. It was correct only because `phrases.css` currently loads later than `premium-ui.css`; a fallback-last order changed the live route grid.

### Root cause

The Phrases route extraction established a dedicated runtime island but retained an unscoped compatibility class selector for grid geometry. Equal-specificity rules therefore still depended on global stylesheet order.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/phrases.css`;
- `frontend/components/phrases-css-ownership.test.ts`;
- `frontend/e2e/phrases-grid-cascade.spec.ts`;
- `frontend/package.json`.

### Checks passed

- Mandatory Phrases, compatibility reachability and CSS specificity instructions read on the exact base.
- Exact manifest and renderer ownership audit completed.
- Source contract, lint, TypeScript, unit suite, production build and dependency audit passed in CI #2675.
- Backend unit/security/integration, CSP, accessibility, performance, iOS PWA, Dictionary and controlled service-worker gates passed on the first implementation head.
- Visual diagnostics proved all non-Phrases visuals and all Phrases detail baselines remained unchanged.

### Checks failed

- CI #2675 visual regression found four deterministic Phrases catalog differences: compact/desktop Light/Dark screenshots were exactly 24px shorter.
- Root cause: the first route-scoped grid block copied `padding: 0`, overriding the existing canonical `.lx-phrases-results { padding-top: 24px; }` on the dual-class result list.
- The baseline was not changed. The grid owner now excludes padding, and the browser proof explicitly requires `padding-top: 24px` under all three stylesheet orders.

### Current branch head

`1a2bb2785db88dbe203e72b1e1d5155569281590` before this progress update; resolve final head from live branch ref.

### Next action

Run authoritative full product CI on the corrected immutable head, verify both UI shards and unchanged Linux visual hashes, then perform review-surface checks and expected-head squash merge.
