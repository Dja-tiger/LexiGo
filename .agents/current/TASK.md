# Current Task

## Identity

- Issue: #601
- Parent visual-parity umbrella: #205
- Branch: `test/issue-601-route-browser-zoom-parity`
- Reconstructed base: `main@cb51f7ae8ff4ce0b92c09719c3d7b1c2f5dc960c`
- PR: #602 (Draft)
- Head SHA: resolve from live branch ref

## Objective

Close the consolidated true browser-owned 200% zoom/reflow audit for all ten canonical routes in explicit Light and Dark without changing product runtime unless corrected structural evidence proves a separate defect.

## Current context

Issue #603 / PR #606 delivered the ordinary-route 720–767px runtime ownership repair and, independently, proved that Playwright `page.screenshot({ fullPage: true, scale: "css" })` does not capture the complete CSS viewport under browser-owned zoom. The authoritative evidence path is now CDP `Page.getLayoutMetrics` + `Page.captureScreenshot` with CSS→DIP conversion through `cssVisualViewport.zoom` and output normalization with `scale: 1 / zoom`.

PR #602 was reconstructed on corrected `main` with a true merge commit so the delivered #603 visual owner remains collected. Historical #601 screenshots from the old Playwright capture path must not be approved or used as runtime-defect proof.

## Scope

- Exercise the ten canonical routes from a `1440×900` Chromium source viewport at true browser zoom factor `2.0`.
- Require exact effective `720 CSS px` layout width.
- Prove browser-owned zoom through the extension/controller and CDP `cssVisualViewport.zoom`.
- Require exact RouteChrome ownership at 720px:
  - Home: `rail`;
  - Learn, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile: `mobile`;
  - Active Lesson and Onboarding: no ordinary RouteChrome.
- Validate document/main/route containment, global chrome, interactive boxes, visible text ranges, keyboard-originated focus-visible behavior, reduced motion and runtime errors.
- Capture full-width Linux PNG/JSON evidence through CDP for all 20 route/theme states.
- Keep every parent-audit fingerprint `REVIEW_REQUIRED` until exact-head Linux artifacts are manually reviewed.

## Non-goals

- Runtime CSS/React changes in this audit PR.
- Treating the obsolete cropped #601 screenshots as proof for Issues #604/#605.
- Backend/API/schema/session changes.
- Figma/OpenPencil changes.
- Replacing delivered standalone browser-zoom owners.
- Synthetic root-font scaling.
- Blind fingerprint approval or tolerance widening.

## Allowed paths

- `frontend/e2e/route-browser-zoom-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/components/browser-zoom-collection-contract.test.ts`
- `.agents/current/**`

## Prohibited paths

- `frontend/app/**` runtime source unless a corrected audit proves a defect and a separate atomic Issue/PR is created first
- `backend/**`
- `deploy/**`
- database/schema/migrations
- design sources
- `.github/workflows/**`
- direct writes to `main`

## Invariants

- `window.innerWidth` and root `clientWidth` must both be exactly 720 after 2× browser zoom.
- `cssVisualViewport.zoom` must remain approximately 2 while structural checks and evidence capture execute.
- Parent evidence must use `Page.captureScreenshot`; direct `page.screenshot(...)` is prohibited for this true-browser-zoom proof.
- PNG width must equal the CDP CSS layout viewport width and therefore equal 720.
- All 20 structural/runtime states must pass before fingerprints may be approved.
- Existing reviewed 320×700, 768×1024, 1440×1024 and Issue #603 evidence stays unchanged.
- Any genuine Active Lesson/Onboarding reflow defect is split into a separate runtime PR; audit assertions are not weakened.

## Acceptance criteria

- Ten canonical routes × Light/Dark execute at true browser zoom 2.
- Exact 720px responsive ownership is enforced, not a permissive `rail|mobile|header` union.
- No document horizontal overflow or clipped main/route/global/interactive surface.
- No visible text-range clipping inside route/container owners.
- Keyboard-originated focus-visible evidence is contained.
- Runtime error capture is clean.
- Corrected CDP Linux PNG/JSON evidence exists for all 20 states.
- Exact artifact is manually reviewed before any SHA-256 baseline is committed.
- Final immutable-head CI and review-thread audit are green before Ready/merge.

## Required checks

- Agent Harness validation.
- Browser-zoom collection/source contract tests.
- Frontend lint/typecheck/unit/build/dependency audit.
- Authoritative Visual run reaching deliberate `REVIEW_REQUIRED` only after structural/runtime assertions.
- Manual review of all 20 corrected Linux captures.
- Final immutable-head full CI after fingerprint approval.
- Review threads/reviews/main drift audit.

## Rollback

Revert the test/docs-only squash merge. Runtime/deployed product code remains the #603-corrected `main` state.
