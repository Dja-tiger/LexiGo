# Current Task Progress

## 2026-08-19 continuation

### Verified

- Live `main` is `cb51f7ae8ff4ce0b92c09719c3d7b1c2f5dc960c`, the squash merge of PR #606.
- Issue #603 is delivered/closed; its ordinary-route 720–767px repair and reviewed CDP-normalized evidence are now part of main.
- Draft PR #602 / Issue #601 was the only open PR when this continuation started.
- Old #602 head `d5189851787105168f6ee8e08a89d528543da12b` was based on `b1444d5e5153da9b8fe275b7f1f175e9bd25286b` and conflicted after #606.
- Branch synchronization was completed without force through merge commit `a13df2263c10b53aec604781f1e7ec087bc8d38c`.
- The merge tree is based on corrected main and preserves both consolidated parent owner `route-browser-zoom-parity.spec.ts` and delivered `issue-603-browser-zoom-reflow.spec.ts` in `playwright.visual.config.ts`.
- Old #602 evidence capture used direct Playwright `page.screenshot({ fullPage: true, scale: "css" })`; #603 proved that coordinate system incomplete at real 2× browser zoom.
- Corrected parent audit code is committed as `cd1fb0c36e1f8958ba89f6588df324aa899f5372` before this documentation synchronization.
- Parent evidence now uses `Page.getLayoutMetrics` + `Page.captureScreenshot`, multiplies CSS clip dimensions by `cssVisualViewport.zoom` and normalizes output with `scale: 1 / zoom`.
- Parent structural gate now requires exact `720px` effective viewport width.
- RouteChrome ownership at exact 720px is explicit: Home=`rail`; Learn/Progress/Dictionary/Word Detail/Phrases/Phrase Detail/Profile=`mobile`; Active Lesson/Onboarding=`none`.
- Parent audit now checks visible text-range clipping in addition to document/main/route/global/interactive containment.
- All 20 parent Light/Dark fingerprints remain `REVIEW_REQUIRED`.
- Runtime production source remains unchanged in #602.

### Current finding

Historical #601 focused-route screenshots cannot be trusted because they were captured through the same half-viewport Playwright path invalidated during #603. Issues #604/#605 must therefore be re-evaluated from corrected CDP evidence before any runtime CSS repair is attempted.

### Changed files in #602

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/route-browser-zoom-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/components/browser-zoom-collection-contract.test.ts`

### Checks completed

- Live main/open-PR/mergeability preflight.
- Branch-local harness/context inspection.
- Semantic conflict resolution against #606 without losing its visual owner.
- No-force two-parent branch synchronization.
- Source inspection confirming obsolete direct Playwright browser-zoom capture.
- Migration to the #603-proven CDP CSS↔DIP evidence contract.
- Exact-720 ownership and text-range structural assertions added.
- Source contract updated to reject regression to direct `page.screenshot(...)` in the parent audit.

### Checks pending

- Immutable-head Frontend core validation after this documentation commit.
- Full required CI matrix.
- Authoritative corrected Visual run.
- If Visual reaches only `REVIEW_REQUIRED`: download and manually inspect all 20 Linux PNG/JSON states before baseline approval.
- If structural/runtime assertions fail first: classify the exact route/root cause and use a separate runtime Issue/PR rather than weakening #602.
- Final exact-head CI after any reviewed fingerprint approval.
- Review-thread/review/main-drift audit before Ready/merge.

### Current branch head

Resolve from live branch after this documentation synchronization. Audit-code head before docs is `cd1fb0c36e1f8958ba89f6588df324aa899f5372`.

### Next action

Commit the synchronized current-task documentation, verify PR #602 is mergeable on corrected main, then classify the new immutable-head CI. Historical cropped fingerprints remain rejected.
