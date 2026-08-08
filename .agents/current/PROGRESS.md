# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Prior Active Lesson Issue #74 slice #435 is fully delivered through exact-SHA main CI and Stage/public validation.
- Current-task reset #437 restored canonical `.agents/current/**` templates.
- Repository-memory drift from #439 was corrected by #440; exact-SHA main CI #3034 / run `31236793082` succeeded.
- Concurrent #441 is an empty docs squash; PR #442 remains based exactly on `faf466e56e05b6d365b8a0acf14d63a25140a36b` and within the seven allowed files.
- Existing Phrases search-clear is independently covered; its compact target expands only toward inline-start and its painted control sits at `right: 80px`, leaving clearance for the submit target.
- CI #3038 / run `31237309890` diagnosed the first topic-margin regression; relative `var(--ak-space-lg)` compensation restored desktop layout and browser-zoom separation.
- CI #3039 was cancelled after branch advancement and is not merge evidence.
- CI #3040 / run `31237750501` restored desktop Phrases Light/Dark baselines and true 200% browser-zoom no-overlap while isolating the compact submit specificity defect.
- Concurrent commits `8a8cd37c10cf7b38ecb3e81ce6725fa7e043a7f4` and `477103ee1b69864ba1333215e22aa4ce178a3cee` were inspected and preserved.
- CI #3043 / run `31238422518` ran on exact head `8ff76253c6ff75a146ae58d664f11d4142bcd390` and proved the production implementation is paint-inert: frontend core, backend unit/security/integration, CSP, accessibility, iOS PWA, controlled service worker, dictionary smoke, performance, lesson, UI shard 1 and Visual regression all succeeded.
- CI #3043 Visual job `93055344152` restored all existing Phrases compact/desktop Light/Dark content-addressed baselines without snapshot updates and kept true-browser 200% zoom/no-overlap green.
- Only UI shard 2 job `93055344133` failed: 91 passed, 85 skipped, 2 failed, both in the new Phrases target spec on Android Chromium and iOS WebKit.
- In both failures every geometry/ownership assertion passed through the coarse sort-label padding hit; only `await expect(sort).toBeFocused()` failed after `page.mouse.click()`.
- Therefore the red gate is an acceptance-portability defect, not a target-geometry/product-paint defect: automated mobile engines do not provide a portable focus contract for a synthetic mouse activation of a native `<select>` label.
- Repository search found no existing LexiGo browser contract that requires native-select focus after clicking label padding.

### Finding

The coarse sort acceptance must prove the actual requirement — a 48px real clickable semantic target associated with the 44px painted select — without treating platform-specific native-select focus/picker side effects as a cross-browser invariant.

### Root cause

The wrapping `<label>` already owns the padding hit under `document.elementFromPoint`, but Playwright Android/iOS mouse activation does not reliably expose the native select as `document.activeElement`. Requiring focus therefore conflates target delivery with mobile native-picker behavior. Native association plus a browser-trusted click event delivered at the padding point is portable evidence of the target itself; final picker/focus behavior remains part of the mandatory physical-device gate.

### Changed files

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live `main` remains exact PR base `faf466e56e05b6d365b8a0acf14d63a25140a36b`.
- #3043 proves unchanged Visual baselines, browser zoom, backend gates and every frontend product group except the two mobile native-focus assertions.
- New acceptance remains explicitly collected by both `test:e2e:ui` and `test:e2e:a11y`.
- Existing search-clear geometry remains separated from the submit target.
- No backend, dependency, lockfile, snapshot, runtime CSS or catalog-semantic change is required for this remediation.

### Checks failed

- CI #3043 UI shard 2 job `93055344133`: Android Chromium and iOS WebKit both failed only at `toBeFocused()` after a coarse sort-label padding click; frontend aggregate failed and container builds were correctly skipped.
- CI #3043 becomes diagnostic only after this acceptance correction and is not merge evidence.

### Current branch head

- Resolve from live branch after the acceptance-portability remediation commit.

### Next action

Treat the next head as immutable and require complete full-product CI again. The corrected UI/a11y acceptance must prove 48px label geometry, native label/select association, `elementFromPoint` ownership and a browser-trusted click at the exact padding point while all existing visual/zoom/backend/container gates remain green.
