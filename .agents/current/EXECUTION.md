# Current Task Execution

## Task

- Issue: #603
- Parent visual-parity umbrella: #205
- Discovered by audit: #601 / Draft PR #602
- Branch: `fix/issue-603-browser-zoom-720-ordinary-routes`
- Base SHA: `b1444d5e5153da9b8fe275b7f1f175e9bd25286b`
- PR: #606
- Final head SHA: resolve from live branch after this documentation commit
- Reviewed evidence source: CI run `32190243698` / head `78239dce1ed0cbbf0f4bb7496481accdb07f6906` / artifact `9344156521`

## Skills used

### GitHub repository and CI workflow

Purpose:

Deliver the atomic ordinary-route 200% browser-zoom repair, preserve the reviewed 768px tablet contract, maintain fail-closed Linux visual evidence and avoid approving screenshots that do not represent the real CSS viewport.

Instruction sources:

Repository `AGENTS.md`, `.agents/**`, `docs/agent-harness.md`, GitHub workflow skill, CI repair skill, parent #205, audit #601 and Issue #603.

Verification date:

2026-08-18/19 live repository state.

## Inputs

- branch base `main@b1444d5e5153da9b8fe275b7f1f175e9bd25286b`;
- #601 browser-zoom audit evidence;
- existing exact 719px compact and 768×1024 tablet contracts;
- #606 immutable CI runs #3828, #3832, #3833 and #3836;
- authoritative Linux Visual artifacts, including final reviewed artifact `9344156521`;
- Chrome DevTools Protocol layout metrics and screenshot coordinate contract.

## Execution

1. Re-checked live open PRs and selected Draft PR #606 before parent audit PR #602 because #606 is the runtime/evidence dependency for the audit.
2. Confirmed the shared responsive ownership defect: ordinary routed content switched to rail/medium ownership at 720px while the first reviewed tablet anchor is 768px.
3. Preserved the atomic runtime repair that continues compact/mobile RouteChrome ownership through `720–767px` for only the seven ordinary route families.
4. Preserved exclusions for Home, Active Lesson and Onboarding so #603 did not become an umbrella CSS patch.
5. Added/maintained a true browser-owned zoom proof from `1440×900` at factor `2.0`, requiring exact `window.innerWidth = 720` and internal containment of route owners, interactive boxes and visible text ranges.
6. CI #3828 exposed stale standalone Learn/Phrases expectations that still required rail navigation at exact 720px. Updated only those test owners: rail/header hidden, mobile navigation visible with four links; content, focus and overflow assertions remained active.
7. Manual review of the first Issue #603 screenshots exposed an evidence contradiction: DOM geometry passed, but `page.screenshot` showed only about half of the CSS viewport.
8. Rejected those fingerprints instead of modifying production CSS to match a bad screenshot.
9. Tested Playwright device-scale capture; CI #3833 proved it remained byte-equivalent to the cropped evidence, so those fingerprints were rejected again.
10. Reworked Issue #603 evidence to use raw CDP `Page.captureScreenshot` with `Page.getLayoutMetrics`:
    - read `cssVisualViewport.zoom`;
    - convert CSS content/layout dimensions to device-independent clip coordinates by multiplying by zoom;
    - normalize output with `scale: 1 / zoom`;
    - assert the encoded PNG width equals the exact CSS layout width.
11. Added a source contract that requires the CDP-normalized evidence path and prevents regression back to `page.screenshot` for this true-browser-zoom proof.
12. CI #3836 validated the implementation: all substantive gates passed and Visual failed only on the intentional Light/Dark `REVIEW_REQUIRED` gate.
13. Downloaded Visual artifact `9344156521` from exact head `78239dce1ed0cbbf0f4bb7496481accdb07f6906`.
14. Manually inspected all 14 Linux screenshots, seven routes in Light and Dark. Evidence is now full-width 720px, all four mobile navigation items are visible, and no horizontal clipping/truncation was found.
15. Pinned all 14 reviewed dimensions/SHA-256 fingerprints in the Issue #603 proof with immutable `sourceRun` and `sourceHeadSha` provenance.
16. Updated branch-local progress/execution records before the final immutable-head CI gate.

## Files changed during the follow-up

- `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts`
- `frontend/e2e/learn-browser-zoom.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/components/issue-603-browser-zoom-reflow-source.test.ts`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

The follow-up did not change production CSS; runtime layout was already structurally correct after the original #603 repair.

## Reviewed evidence

CI #3836 / run `32190243698`, artifact `9344156521`, head `78239dce1ed0cbbf0f4bb7496481accdb07f6906`:

- Learn Light/Dark: `720×995`
- Progress Light/Dark: `720×1664`
- Dictionary Light/Dark: `720×1058`
- Word Detail Light/Dark: `720×1676`
- Phrases Light/Dark: `720×1363`
- Phrase Detail Light/Dark: `720×1589`
- Profile Light/Dark: `720×4086`

Exact SHA-256 values are stored beside those dimensions in `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts`.

## CI result before baseline approval

CI #3836:

- frontend core quality: passed;
- backend unit/security: passed;
- backend integration: passed;
- iOS PWA dictionary: passed;
- lesson completion: passed;
- accessibility audit: passed;
- UI shard 1/2: passed;
- UI shard 2/2: passed;
- controlled service worker: passed;
- dictionary smoke: passed;
- content security: passed;
- performance budgets: passed;
- Visual regression: only the two intentional Issue #603 `REVIEW_REQUIRED` failures;
- aggregate frontend quality: failed only because Visual remained intentionally fail-closed before fingerprint approval.

## Failures and root causes

### Stale standalone navigation expectations

Learn/Phrases tests still encoded the old 720px rail owner after #603 intentionally moved that gap to compact ownership.

Resolution: update only owner/navigation assertions and retain all behavioral, focus and containment assertions.

### Invalid browser-zoom screenshot coordinate system

Playwright full-page screenshot capture under browser-owned zoom did not represent the same CSS coordinate space as DOM geometry; at zoom 2 it captured approximately half of the effective CSS width.

Resolution: use CDP layout metrics and normalize the screenshot clip from CSS pixels into DIP, then back to a one-pixel-per-CSS-pixel artifact. The result is a 720px-wide full route image consistent with the structural geometry checks.

## Guardrails preserved

- no writes to `main`;
- exact 768px tablet/rail behavior remains outside the 720–767px compatibility repair;
- no Home selectors added to #603;
- no Active Lesson/Onboarding selectors added to #603;
- no blind snapshot acceptance;
- every Linux fingerprint is tied to an exact CI run/head and manual image review;
- production CSS was not changed in response to a screenshot-tooling defect.

## Remaining gate

Run full required CI on the final developer-authored head after baseline approval and documentation synchronization. Then re-check PR #606 mergeability, unresolved review threads, reviews/comments and required checks. Only after those are satisfied may the PR be moved out of Draft/merged according to repository policy.

After #606 is completed, return to Draft PR #602. Its parent browser-zoom audit still inherits `page.screenshot({ scale: "css" })`; replace that evidence path with the validated CDP-normalized capture before any #602 fingerprints are approved.
