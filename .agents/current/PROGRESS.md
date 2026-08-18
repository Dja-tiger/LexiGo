# Current Task Progress

## 2026-08-19 01:10 +03:00

### Verified

- Active delivery is Issue #603 / Draft PR #606 on `fix/issue-603-browser-zoom-720-ordinary-routes`.
- Base `main` for this branch is `b1444d5e5153da9b8fe275b7f1f175e9bd25286b`; refresh live main before any future integration decision.
- Runtime repair keeps the unreviewed `720–767px` gap on compact RouteChrome ownership while preserving 768px as the first reviewed tablet/rail anchor.
- Scope remains limited to the seven ordinary route families: `/learn`, `/progress`, `/dictionary`, `/words/[id]`, `/phrases`, `/phrases/[slug]`, `/profile`.
- Home, Active Lesson and Onboarding remain outside #603 scope; focused follow-ups are #604/#605 where applicable.
- Standalone Learn and Phrases true-browser-zoom owners are aligned with the compact/mobile RouteChrome contract at exact 720px.
- Structural true-browser-zoom proof verifies exact `window.innerWidth = 720`, no document horizontal overflow, route/main containment, no clipped interactive boxes, no clipped visible text ranges and exactly one visible `mobile` RouteChrome owner.
- The initial Playwright `page.screenshot` evidence path was invalid under browser-owned zoom: it rendered only about half of the CSS viewport even while DOM geometry passed.
- Evidence capture is now owned by CDP `Page.captureScreenshot` with CSS→DIP conversion from `cssVisualViewport.zoom`, then normalized back to one output pixel per CSS pixel.
- Immutable CI #3836 / run `32190243698` on head `78239dce1ed0cbbf0f4bb7496481accdb07f6906` completed with every substantive gate green except the intentional Issue #603 `REVIEW_REQUIRED` Visual gate.
- Visual CI #3836 executed 154 passing tests with only the two Light/Dark Issue #603 review-gate failures; standalone Learn and Phrases browser-zoom tests passed.
- Exact Visual artifact `9344156521` was downloaded and all 14 authoritative Linux screenshots were manually reviewed: seven routes × Light/Dark.
- Reviewed evidence is full-width 720px and shows all four mobile navigation items; no horizontal clipping or route-owner truncation was found.
- The 14 reviewed Linux fingerprints from CI #3836 are pinned in `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts` with source run/head provenance.
- Follow-up evidence/test work did not change production CSS.

### Current finding

The original runtime defect was a real 720–767px responsive ownership gap. After the route-scoped compact continuation was implemented, structural geometry became correct. A second, independent defect was then found in the visual-evidence capture path: Playwright screenshot coordinates under browser-owned zoom did not represent the full CSS viewport. CDP-normalized capture fixed the evidence coordinate system without requiring further production CSS changes.

### Changed files in the current follow-up

- `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts`
- `frontend/e2e/learn-browser-zoom.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/components/issue-603-browser-zoom-reflow-source.test.ts`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

Production runtime files from the earlier #603 repair remain unchanged during the evidence follow-up.

### Checks passed

- Live GitHub PR/Issue/CI preflight.
- Exact 719/720/768 ownership inspection.
- Runtime structural containment at exact 720px true 2× browser zoom.
- Standalone Learn/Phrases exact-720 ownership regressions.
- Frontend lint, typecheck, unit tests, production build and dependency audit in CI #3836.
- Backend unit/security and integration in CI #3836.
- iOS PWA, lesson completion, accessibility, controlled service worker, dictionary smoke, content security, performance budgets and both UI shards in CI #3836.
- Manual review of all 14 authoritative Linux Issue #603 screenshots from artifact `9344156521`.

### Checks pending

- Final immutable-head CI after reviewed fingerprints and current task documentation are committed.
- Final PR #606 review-thread/status audit.
- Ready/merge decision only after the final exact head is fully green and repository merge requirements are satisfied.

### Current branch head

Resolve from the live branch after the final task-document synchronization. The reviewed evidence source head is `78239dce1ed0cbbf0f4bb7496481accdb07f6906`; the baseline-approval commit is `501db0ad5168b3ea568473dbd46448d4bc78420e`.

### Next action

Finish current execution documentation, then require full CI on the resulting immutable head. If Visual fingerprints remain stable, audit review threads/status and complete PR #606 according to repository merge policy. After #606 is landed, return to parent Draft PR #602 and replace its inherited `page.screenshot({ scale: "css" })` browser-zoom evidence path with the validated CDP-normalized capture before approving any parent fingerprints.
