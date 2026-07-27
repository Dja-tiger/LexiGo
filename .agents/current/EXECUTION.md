# Current Task Execution

## Task

- Branch: `perf/issue-247-progress-island-budget`
- Base SHA: `a0b6ce2bfa359ec232ad3c8df79f0bdfa624db1c`
- Head SHA: resolve from live branch ref
- PR: #248

## Skills used

### GitHub repository operations

Purpose: reconstruct live state, isolate Issue #247 and perform branch-scoped writes without changing `main`.

Instruction source: `AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`.

Version or verification date: 2026-07-27.

Inputs: live `main`, open PR search, Issue #115, Issue #247, Issue #12 stage evidence and current branch compare.

Files inspected: mandatory Agent Harness documents, architecture, bundle budget documentation/configuration, bootstrap shell, Progress island, existing production-entry and PWA/session lifecycle tests.

Actions performed: verified `main` and stage, created Issue #247 and an isolated branch, defined exact scope, opened Draft PR #248, read every changed path back and compared the branch with `main`.

Commands or procedures: exact-ref reads, issue/branch/PR creation, explicit branch Contents API writes, workflow job/log/artifact inspection and `compare_commits(main, branch)`.

Artifacts produced: Issue #247, branch `perf/issue-247-progress-island-budget`, Draft PR #248 and populated current-task memory.

Result: branch remains 0 commits behind `main` and contains only declared source-contract, browser-test, budget and documentation paths.

Failures: an attempted local clone could not resolve `github.com`; one mistaken PR metadata read targeted Issue #247 and returned 404 without mutation.

Root cause: the execution container has no outbound DNS, and Issue number #247 is not a PR number.

Fallback: use exact GitHub connector reads/writes and repository CI through Draft PR #248; no write was made by the failed PR lookup.

Limitations: targeted commands cannot run locally in the isolated container; GitHub Actions is the authoritative execution environment.

Reusable lesson: when local network access is unavailable, reduce replacement-write risk by adding focused source/E2E contracts as new allow-listed files and use immutable-head CI for executable evidence.

### Frontend route-island and performance validation

Purpose: close the Progress portion of Issue #115 without moving shared session, outbox or PWA ownership.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `docs/frontend-bundle-budgets.md`, Issue #247.

Version or verification date: 2026-07-27.

Inputs: `LexigoBootstrappedApp`, `LexigoProgressApp`, route navigation shell, current bundle baselines and deterministic quality-gate API fixtures.

Files inspected: `frontend/components/lexigo-bootstrapped-app.tsx`, `frontend/components/lexigo-progress-app.tsx`, `frontend/components/production-app-entry.test.ts`, `frontend/e2e/review-outbox-auth-lifecycle.spec.ts`, `frontend/e2e/route-bundle-budget.spec.ts`, `frontend/e2e/performance-global-teardown.ts`, `frontend/bundle-budgets.json`, `frontend/lib/bundle-budgets.test.ts`.

Actions performed: added exclusive dynamic-entry/source ownership coverage, direct-entry plus repeated route-boundary refresh-count coverage, deterministic compact route measurement logging, exact Progress baseline evidence and a permanent reduction invariant.

Commands or procedures: source-level import/owner assertions, Playwright route fallback counting for `/api/v1/auth/refresh`, deterministic route sorting, compact JSON stdout lines and cold Pixel 5 Chromium transfer measurement.

Artifacts produced: `progress-route-island-source.test.ts`, `progress-route-island.spec.ts`, updated performance global teardown, Progress route budget and documented evidence.

Result: corrected CI #2074/run `30252335806` completed successfully on head `03854f0601972d270bb052725548578cf11929e3`, including all backend, frontend core, Chromium/WebKit/mobile/PWA, accessibility, visual and performance gates. Production runtime, UI, API, CSS and deployment workflows remain unchanged.

Failures: the existing successful performance workflow did not retain its report artifact because CI uploads browser diagnostics only on failure.

Root cause: the report existed inside the isolated frontend volume after a successful performance job, but the generic failure-only extraction path was not executed.

Fallback: a removable test-only measurement probe was run on the same production graph to force diagnostic extraction after the report was written. Run `30253573827` on head `96479e0f07eda62cff5176f519e6294e005a451b` produced artifact `8648042201`; the probe was then removed byte-for-byte before the final candidate head.

Limitations: the measurement probe run is provenance for exact bytes, not merge evidence. Final merge evidence must be a separate completely green head with the permanent budget and no probe.

Reusable lesson: promote route-specific budgets only from exact report evidence; temporary measurement instrumentation must be allow-listed, isolated to tests and removed before final CI.

### Progress budget promotion

Purpose: convert the measured Progress island reduction into a blocking release contract.

Instruction source: `docs/frontend-bundle-budgets.md`, Issue #247 and existing `schemaVersion: 2` route evidence rules.

Version or verification date: 2026-07-27.

Inputs: original shared baseline 238,257 bytes, exact artifact `8648042201`, successful CI #2074 and exact measurement execution `30253573827`.

Files inspected: extracted `test-results/route-bundle-budget-report.json`, `frontend/bundle-budgets.json`, `frontend/lib/bundle-budgets.test.ts`, `docs/frontend-bundle-budgets.md`.

Actions performed: recorded baseline 207,502 bytes and 18 requests; selected bounded ceilings 240,000 bytes and 21 requests; added baseline evidence and required Progress to remain strictly below the monolithic graph.

Commands or procedures: artifact download, ZIP/JSON inspection, before/after calculation and existing 16% headroom invariant validation.

Artifacts produced: permanent `/progress` budget, configuration regression and architecture evidence section.

Result: Progress transfer is lower by 30,755 bytes, or 12.9%; both permanent ceilings remain below the monolithic 275,000-byte/24-request limits.

Failures: no product failure occurred during promotion.

Root cause: not applicable.

Fallback: revert budget/test/documentation commits to the prior shared ceiling if final CI proves the measurement contract invalid; do not raise the new ceiling to absorb an unexplained regression.

Limitations: final immutable-head CI and post-merge stage validation are still required.

Reusable lesson: a route extraction is incomplete until ownership, navigation bootstrap behavior, exact transfer evidence and a strictly tighter release ceiling are all enforced together.

### CI failure classification and prevention

Purpose: diagnose CI #2068 without changing correct production runtime and promote a reusable prevention rule.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, Agent Harness CI classification rules.

Version or verification date: 2026-07-27.

Inputs: job `89929756765`, artifact `frontend-playwright-report-ui-2` ID `8647220580`, Playwright trace and exact request sequence.

Files inspected: `frontend/e2e/system-states.spec.ts`, `frontend/components/lexigo-dictionary-app.tsx`, UI shard logs and trace.

Actions performed: classified the failure as stale fixture, repaired the request matcher, waited for baseline list readiness, created `.agents/AGENTS.issue-247-request-scoped-fixtures.md` and indexed it in `.agents/AGENTS.md`.

Commands or procedures: workflow job log read, artifact download, trace/network inspection, exact source read and branch-only test/documentation writes.

Artifacts produced: request-scoped fixture regression, mandatory specialized AGENTS rule and updated normative index.

Result: the repair preserves the intended 503/correlation/retry contract while eliminating the initial-load race; corrected CI #2074 passed the full browser matrix.

Failures: no production defect was found.

Root cause: test fixture scope was broader than the application state under test.

Fallback: if a future scenario fails, inspect the request identity and baseline readiness before any runtime change.

Limitations: none beyond the final PR lifecycle gates.

Reusable lesson: do not infer user-action failure semantics from endpoint identity alone; prove request identity and baseline readiness in the fixture.
