# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Prior Active Lesson Issue #74 slice #435 is fully delivered through exact-SHA main CI and Stage/public validation.
- Current-task reset #437 restored canonical `.agents/current/**` templates.
- Repository-memory drift from #439 was corrected by #440; exact-SHA main CI #3034 / run `31236793082` succeeded.
- Concurrent #441 is an empty docs squash: commit `faf466e56e05b6d365b8a0acf14d63a25140a36b` and parent #440 share the exact tree `8e944c4bb8157938da631c426371da0fed824252`.
- PR #442 remains based exactly on `faf466e56e05b6d365b8a0acf14d63a25140a36b` and within the seven allowed files.
- Residual Phrases inventory confirms 36px topic-chip buttons and filter radio-row labels plus 44px controls without a coarse-pointer 48px owner.
- Existing Phrases search-clear is independently covered and excluded from this slice.
- Compact widths below 768px intentionally hide the desktop filter sidebar; coarse radio-row evidence uses an 820px touch viewport.
- CI #3038 / run `31237309890` on former live head `e39c252b2a8b6af185b47cb693807e20a4e4761c` proved frontend core, accessibility collection, performance budget, content security and controlled service-worker gates before exposing a deterministic Visual regression failure.
- Visual logs ran 141 tests and showed only Phrases catalog regressions: compact Light/Dark full-page height `1628 -> 1658`, desktop Light/Dark `1185 -> 1169`, plus 200% browser-zoom overlap between search and topic navigation.
- The retained log proves this is production layout drift, not a stale-baseline-only failure: `expectNoOverlap(search, topics)` also failed twice.

### Finding

The first topic-scrollport compensation accidentally replaced the canonical `margin-top: var(--ak-space-lg)` with a negative absolute margin instead of subtracting only the newly added padding delta.

### Root cause

`margin-top: -2px` / `-4px` removed the whole canonical topic spacing. The intended math is relative compensation: fine pointer changes top padding `2 -> 4` and therefore must use `calc(var(--ak-space-lg) - 2px)`; coarse changes `2 -> 6` and must use `calc(var(--ak-space-lg) - 4px)`. That preserves the original painted pill Y coordinate and the topic rail's total outer block contribution while still reserving unclipped hit-slop gutter.

### Changed files

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Exact live-tip ancestry and seven-file scope.
- New acceptance is explicitly collected by both `test:e2e:ui` and `test:e2e:a11y`; Accessibility audit on #3038 succeeded.
- Frontend lint/typecheck/unit/build/dependency audit on #3038 succeeded.
- Performance budget, content-security and controlled-service-worker gates on #3038 succeeded.
- No backend, dependency, lockfile, snapshot or catalog-semantic change.
- Failure classification uses retained Visual job `93052328695`; no baseline update or blind rerun is used.

### Checks failed

- CI #3038 Visual regression job `93052328695` failed on the former head because absolute negative topic margins changed canonical Phrases layout and caused real browser-zoom overlap.
- CI #3038 is diagnostic only after this remediation commit and cannot be merge evidence.

### Current branch head

- Resolve from live branch after the relative-margin remediation commit.

### Next action

Treat the remediation head as the new immutable candidate; require a fresh complete CI run, with unchanged Phrases content-addressed baselines and the 200% no-overlap contract both green before review/merge.
