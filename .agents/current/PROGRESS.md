# Current Task Progress

## 2026-08-20 Europe/Berlin

### Verified

- PR #629 exact-head CI #3908 / run `32378296969` was fully green on `6c50ad774e2f20b6d455fde45ec5dd703f54d806` and merged as main SHA `651a35541061cd9d667e440a1a57fffa4cf5cb56`.
- PR head and merge commit have the same Git tree `226462030efdaffdfae454d59c73dbe8366a83e2`.
- Exact-main CI run `32386739134` failed only in `Frontend E2E (UI tests (shard 1/2))`, job `96483659178`; all independent core/backend/shard2/visual/a11y/PWA/CSP/performance gates passed.
- Artifact `frontend-playwright-report-ui-1` / `9413582203`, digest `sha256:27aa3d8539d8de1323dcdc1501c8d5eb9486641b6c1c9783e6bda645312bac4d`, identifies the older test `semantic route links support a real new tab and browser Back/Forward` as the final failure.
- Initial attempt created the tab but timed out waiting for `domcontentloaded` after Playwright logged `networkidle`; retry timed out waiting for `context.page` after the same middle-click.
- The trace source snapshot Git blob `42f252b1cd55b402ed013c62d61a95f7ec6daa1e` exactly matches the live branch file.

### Root cause

The acceptance couples application routing/history verification to Chromium native middle-click background-tab creation and lifecycle. That browser behavior is nondeterministic in headless CI and is not a LexiGo-owned contract.

### Implemented

- Created Issue #630 and branch `test/issue-630-semantic-route-independent-tab` from exact main `651a3554...`.
- Preserved the exact `/learn` semantic href assertion.
- Replaced native middle-click + `context.waitForEvent("page")` with an explicit independent `context.newPage()` and navigation to the asserted href.
- Preserved Learn heading verification and the complete primary-page Back/Forward journey.
- Removed all middle-click/page-event references from this acceptance; no production source changed.

### Validation pending

- Publish Draft PR from the developer-authored head.
- Full immutable-head CI, especially UI shard 1.
- Review/thread audit, Ready, expected-head squash merge and exact-main CI.
- Only after green exact-main: Agent Docs reconciliation, then Dependabot PR #622.
