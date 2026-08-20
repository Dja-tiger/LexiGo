# Current Task Progress

## 2026-08-20 15:15 Europe/Moscow

### Verified

- Live `main` remains exact SHA `b40bbbfde951797ba712e63b9d940fbdb30d9694`, the squash merge of PR #625.
- Post-merge exact-main CI #3892 / run `32324897382` failed only because `Frontend UI tests (shard 2/2)` job `96294381319` contained two final unexpected failures.
- Playwright artifact `frontend-playwright-report-ui-2` / artifact `9391193804` proves both final failures are `route-history-parity.spec.ts` `learn` Light/Dark on `ios-webkit`; each failed on initial run and retry with `pageerror: /127.0.0.1:3000/api/v1/lessons/preview due to access control checks.`
- The separate Phrases search failure in the same artifact passed its retry and is classified by Playwright as flaky; it is not the blocking failure for Issue #626.
- The failing trace contains the exact `frontend/e2e/support/quality-gates.ts` source snapshot. Its local Git blob SHA is `636db392a1abac26c4056b803827c6a37e778429`, exactly matching the live GitHub blob on `b40bbbf...`; source provenance is therefore confirmed.
- Issue #626 and branch `test/issue-626-webkit-preview-cors-fixture` were created from exact `b40bbbf...`.
- Draft PR #627 is published against `main`; its original publication head was `4d0b5663c67b30bca426ee68a20bbfa751e4b270`. Subsequent current-context synchronization commits are part of the same allow-listed task branch, so the authoritative final head must be resolved live before CI acceptance.

### Finding

PR #625 fixed interception ownership but not the response metadata of the remaining canonical owner. The earlier CORS-header experiment attached headers to a page route that called `fallback`; the actual HTTP 200 was fulfilled later by `installQualityGateAPI(context)`, so WebKit validated a response that did not contain those headers.

### Root cause

The canonical context fixture fulfilled `POST /api/v1/lessons/preview` without request-derived CORS response metadata. Under the reproduced iOS WebKit interception path, Fetch performs access-control validation on that synthetic response and emits a pageerror even though the application URL is same-origin. The defect is in the Playwright fixture transport contract, not production runtime/API/navigation.

### Changed files

- `frontend/e2e/support/quality-gates.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Implemented

- `fulfillJSON` accepts optional response headers.
- The canonical preview fixture derives `Access-Control-Allow-Origin` from the intercepted request `Origin`, adds credential/header/method metadata and `Vary: Origin`, and handles preview `OPTIONS` at the same canonical owner.
- No page-level preview route/fallback/Fetch wrapper was reintroduced.
- Source contract now proves both single preview ownership and canonical exact-origin response metadata, and rejects wildcard origin.
- Agent Harness fixture rule now records the confirmed response-owner failure category and regression gate.
- Draft PR #627 documents evidence, non-goals, rollback and required immutable-head validation.

### Checks passed

- Exact failing source snapshot Git blob identity matches live GitHub source.
- Modified `quality-gates.ts` transpiles with zero TypeScript syntax diagnostics in the available local TypeScript runtime.
- Every written file has been read back from the explicit working branch and its new blob SHA verified.
- Branch compare is based on exact `b40bbbf...`, behind by zero, and contains only the six allow-listed paths.

### Validation pending

- Frontend source/unit contract in GitHub CI.
- iOS WebKit `learn` Light/Dark route-history cases in generic UI shard 2.
- Full immutable-head required CI on the final developer-authored head.
- Review/thread audit, Ready and expected-head squash merge.
- Exact-main CI after merge.

### Next action

Resolve PR #627's final developer-authored head after current-context synchronization, inspect its immutable-head workflow and require explicit green iOS WebKit `learn` evidence before Ready/merge.
