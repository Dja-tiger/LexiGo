# Current Task Progress

## 2026-07-28 04:16 Europe/Moscow

### Verified

- live `main`: `32d36a6cc4eaefc553e893fcd1942519441d647b`;
- no open PR and no parallel current slice;
- stage remains healthy on product image `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`, run `30318351607`;
- Phrases #199/#115 remains blocked on exact production nodes and is not bypassed;
- Issue #70 remains open specifically for feature-style import-order independence and final dead-client evidence;
- Issue #261 and branch `agent/issue-261-system-state-css-ownership` were created from exact live main;
- exact Figma contexts `79:69`, `79:117` and `79:194` were re-read from file `3xXmBWnf38jbvLjtziwber`.
- pre-flight contract was committed and pushed at `ad15f562024e8eded82495b00427b7ed2b6b4ab5`;
- Draft PR #262 was opened against the unchanged exact base;
- legacy async/skeleton and outbox presentation owners are removed; their still-effective declarations now live in `system-states.css`;
- root layout no longer imports `review-outbox.css`, and a source contract prevents its return;
- durable architecture documentation records the runtime/presentation/PWA ownership boundary.

### Finding

`system-states.css` is the canonical Issue #202 owner, but exact selectors still also exist in `mobile-pwa-fixes.css` and `review-outbox.css`. Higher-specificity status modifiers, offline indicator color and pending motion remain effective only from those older files, so current presentation depends on cross-file cascade behavior.

### Root cause

Issue #202 added a late canonical presentation layer without retiring the earlier Issue #44 async block or the first connectivity stylesheet. Equal and higher specificity made the old code partially effective despite import ordering.

### Changed files

- `frontend/app/layout.tsx` — removed the retired outbox stylesheet import.
- `frontend/app/mobile-pwa-fixes.css` — removed the duplicate async/skeleton block.
- `frontend/app/review-outbox.css` — deleted the retired connectivity presentation owner.
- `frontend/app/system-states.css` — retained the effective state tones, stack geometry, offline indicator, pending pulse and reduced-motion behavior.
- focused CSS source contracts — enforce sole canonical ownership.
- `docs/architecture.md` — records the durable ownership boundary.
- `.agents/current/**` — task, validation and execution evidence.

### Checks passed

- mandatory repository harness and applicable GitHub/Figma skills read;
- live main/PR/Issues/branches/CI/stage reconciliation completed;
- repository-wide selector/import/runtime-owner audit completed;
- exact Figma loading, error and offline nodes inspected;
- existing visual SHA contract and system-state runtime consumers inspected;
- focused Vitest: 2 files, 10 tests;
- frontend lint (0 errors; 3 pre-existing warnings), TypeScript, 69 files / 442 unit tests and production build;
- functional system-state Playwright matrix: 20 tests across desktop Chromium/WebKit and Android/iOS;
- outbox/offline Playwright matrix: 24 tests across the same four projects.

### Environment limitation

The local Apple Silicon Playwright Docker run produced mismatches for untouched Profile/Scenario baselines and non-deterministic retry hashes. This is not accepted as product or baseline evidence. No visual baseline was changed; the immutable-head x86 Linux GitHub job remains authoritative.

### Authoritative CI finding

Run `30319926639` passed core, backend and 43/44 executed visual cases, but `desktop-offline-dark` changed from approved SHA `8f3b6192ba542969101166997046d92df0dc041ed9c8ec0fc7f588e951931f7a` to `4603e4d35e823b5feb0ea9f687912a38d0c54fb48a874a79640567fe4d9e5791`.

The removed `.lx-review-sync span:not(.lx-review-sync__indicator)` selector had higher specificity than the canonical copy selector, so its effective `#cbd5e1`, `13px` and `1.45` typography was lost. These effective values are now restored in the canonical owner and protected by the source contract; no baseline is promoted.

### Current branch head

Local implementation commit: `0dce967`.

### Next action

Validate the specificity correction locally, push a new immutable head and require a fresh complete authoritative GitHub matrix without baseline promotion.
