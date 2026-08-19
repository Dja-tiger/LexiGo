# Current Task Execution

## Task

- Issue: #601
- Parent: #205
- Branch: `test/issue-601-route-browser-zoom-parity`
- PR: #602 (Draft)
- Original base: `b1444d5e5153da9b8fe275b7f1f175e9bd25286b`
- Reconstructed base: `cb51f7ae8ff4ce0b92c09719c3d7b1c2f5dc960c`
- Branch synchronization merge commit: `a13df2263c10b53aec604781f1e7ec087bc8d38c`
- Corrected audit-code commit: `cd1fb0c36e1f8958ba89f6588df324aa899f5372`
- Head SHA: resolve from live branch after documentation synchronization

## Purpose

Finish the evidence/test-only consolidated 200% browser-zoom audit after Issue #603 corrected both the ordinary-route responsive boundary and the browser-zoom screenshot coordinate contract.

## Inputs verified

- Live `main@cb51f7ae8ff4ce0b92c09719c3d7b1c2f5dc960c` contains merged PR #606 / closed Issue #603.
- Draft PR #602 was the only open PR at continuation start.
- #602 old head `d5189851787105168f6ee8e08a89d528543da12b` conflicted with corrected main.
- The old parent audit used `page.screenshot({ fullPage: true, scale: "css" })` under browser-owned 2× zoom.
- #603 proved that path captured only about half of the effective CSS viewport even when DOM geometry was correct.
- #603 established and manually validated the correct CDP evidence contract using `Page.getLayoutMetrics`, `Page.captureScreenshot`, CSS→DIP conversion by `cssVisualViewport.zoom` and `scale: 1 / zoom`.

## Actions performed

1. Re-read repository workflow and CI-repair instructions and checked live main/open PR state.
2. Confirmed #602 was the only open PR, remained Draft, and was non-mergeable only because #606 had landed after its old base.
3. Read branch-local `.agents/current/**`, the parent audit spec/source contract and current-main #603 visual owner.
4. Confirmed the #602 visual config overlap could not be resolved by copying the old file because that would remove the delivered `issue-603-browser-zoom-reflow.spec.ts` collection owner.
5. Built a semantic merge tree from corrected main, overlaid #602 audit files, and preserved both `route-browser-zoom-parity.spec.ts` and `issue-603-browser-zoom-reflow.spec.ts` in the authoritative Visual config.
6. Created a real two-parent merge commit `a13df2263c10b53aec604781f1e7ec087bc8d38c` with old #602 head and corrected main as parents; updated the branch without force.
7. Replaced the obsolete parent screenshot path with the validated CDP capture contract.
8. Strengthened the parent structural contract from permissive responsive ownership to exact 720px ownership:
   - Home `rail`;
   - seven ordinary route families `mobile`;
   - Active Lesson/Onboarding `none`.
9. Added exact `window.innerWidth === 720` and root `clientWidth === 720` assertions.
10. Added visible text-range clipping detection alongside document/main/route/global/interactive containment.
11. Kept keyboard-originated focus-visible and runtime-error gates active.
12. Preserved fixture lifetime cleanup: every non-Active-Lesson iteration removes the Active Lesson page-level `**/api/v1/**` catch-all before opening the next canonical route.
13. Updated the source contract so regression to direct `page.screenshot(...)` fails and the consolidated owner must contain active CDP `Page.getLayoutMetrics`/`Page.captureScreenshot`, zoom-normalized clip math and exact-720 ownership evidence.
14. Kept all 20 parent fingerprints at `REVIEW_REQUIRED`; no historical cropped fingerprint was approved.

## Result so far

The parent audit is reconstructed on corrected main without runtime source changes. Its next authoritative Visual run will produce full-width 720px Linux evidence rather than the historical half-viewport captures. Old #601 images must not be used to justify runtime changes in Active Lesson or Onboarding.

## Known historical failures

- Initial #601 Visual run exposed an Active Lesson page-fixture lifetime leak into later routes; that was corrected test-only by removing the page catch-all before non-Active-Lesson owners.
- Historical parent screenshots suggested clipping in focused routes, but those images were produced by the now-invalid Playwright browser-zoom capture path. Their runtime conclusion is therefore untrusted until corrected CDP evidence is collected.

## Guardrails

- No production CSS/React/backend/deploy files changed in this continuation.
- No force-push.
- No direct write to main.
- No blind snapshot/fingerprint acceptance.
- #603 visual owner remains collected after resolving the config conflict.
- Issues #604/#605 are not repaired from obsolete evidence; corrected parent audit must establish a real structural/runtime defect first.

## Next action

Run immutable-head CI on the documentation-synchronized head. If Frontend core fails, repair only the test/source contract. If Visual reaches only `REVIEW_REQUIRED`, download the exact Linux artifact and manually inspect all 20 full-width Light/Dark captures plus metrics. Approve fingerprints only from that immutable reviewed head. If corrected structural checks expose a genuine focused-route defect before review, split it into its own atomic runtime Issue/PR and keep #602 fail-closed.
