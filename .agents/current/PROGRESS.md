# Current Task Progress

## 2026-08-20 Europe/Berlin

### Verified

- Live `main` remains exact SHA `b63b6a88b49faf6114870f39e6b7473a28ca1e9d`, the squash merge of PR #621 (`next` 16.3.0 → 16.3.1).
- PR #621 exact-head CI #3906 / run `32373102988` passed fully on `8b0e762a6075a636530b8510667b40e4216f53ff`, including both generic UI shards and both container builds.
- Post-merge exact-main run `32374318211` first failed `UI tests (shard 1/2)` during Playwright image preparation because `mcr.microsoft.com` reset the TCP connection. The same diagnostics path then pulled the image successfully, proving an external transient registry failure.
- A same-SHA rerun passed workspace preparation, dependency installation and production build, then failed the phrase new-tab E2E in `frontend/e2e/app-router-routes.spec.ts`.
- Exact rerun artifact `frontend-playwright-report-ui-1` / artifact `9409322176`, digest `sha256:4df85fd6a649e11e036ca5498d66c6c7f8919a8a57ed832535faab9db1151dd8`, was downloaded and inspected.
- Attempt 1 timed out at `context.waitForEvent("page")` after native middle-click.
- Retry 1 created a new page and fetched the exact target document with HTTP 200 in ~26 ms, but the background tab never surfaced `domcontentloaded`; `tab.waitForLoadState("domcontentloaded")` timed out.
- The same spec already contains separate native Chromium middle-click/new-tab coverage for the `/learn` semantic route.

### Finding

The phrase-specific acceptance duplicates a native browser gesture whose lifecycle is not deterministic in headless Chromium. Its unique product contract is different: the rendered backend phrase anchor must carry the canonical filtered href, and that href must load in an independent tab without target-tab catalog warm-up.

### Root cause

The test couples backend phrase deep-link acceptance to native middle-click/background-tab scheduling. The target server route is healthy and returns 200; the nondeterminism is page creation/background renderer lifecycle, not Next.js 16.3.1 runtime behavior.

### Implemented

- Issue #628 created with exact CI/artifact evidence.
- Branch `test/issue-628-phrase-new-tab-stability` created from exact `main` SHA `b63b6a88...`.
- Phrase test preserves the exact semantic href assertion.
- Duplicate native middle-click handshake is replaced by an explicit independent `context.newPage()` plus direct `goto(href)`.
- Target-tab API requests are captured and asserted to exclude catalog metadata, progress and word-catalog warm-up.
- Existing separate native middle-click/new-tab coverage remains byte-identical.
- Production code and canonical API fixture ownership remain unchanged.

### Validation pending

- Open draft PR and resolve immutable developer-authored head.
- Full exact-head CI, especially generic UI shard 1/2 plus all remaining browser/container gates.
- Review/thread audit and fresh-main check.
- Squash merge and exact-main CI.
- Only after exact-main green: repository-memory reconciliation and Dependabot PR #622.
