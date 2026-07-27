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

Result: branch remains 0 commits behind `main` and contains only declared test/tooling/documentation paths.

Failures: an attempted local clone could not resolve `github.com`; one mistaken PR metadata read targeted Issue #247 and returned 404 without mutation.

Root cause: the execution container has no outbound DNS, and Issue number #247 is not a PR number.

Fallback: use exact GitHub connector reads/writes and repository CI through Draft PR #248; no write was made by the failed PR lookup.

Limitations: targeted commands cannot run locally in the isolated container; GitHub Actions is the authoritative execution environment.

Reusable lesson: when local network access is unavailable, reduce replacement-write risk by adding focused source/E2E contracts as new allow-listed files and use immutable-head CI for executable evidence.

### Frontend route-island and performance validation

Purpose: close the Progress portion of Issue #115 without moving shared session, outbox or PWA ownership.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `docs/frontend-bundle-budgets.md`, Issue #247.

Version or verification date: 2026-07-27.

Inputs: `LexigoBootstrappedApp`, `LexigoProgressApp`, route navigation shell, current bundle baselines and existing deterministic quality-gate API fixtures.

Files inspected: `frontend/components/lexigo-bootstrapped-app.tsx`, `frontend/components/lexigo-progress-app.tsx`, `frontend/components/production-app-entry.test.ts`, `frontend/e2e/review-outbox-auth-lifecycle.spec.ts`, `frontend/e2e/route-bundle-budget.spec.ts`, `frontend/e2e/performance-global-teardown.ts`, `frontend/bundle-budgets.json`.

Actions performed: added an exclusive dynamic-entry/source ownership contract, added direct-entry plus repeated route-boundary refresh-count coverage, and added deterministic compact route measurement logging from the existing JSON report.

Commands or procedures: source-level import/owner assertions, Playwright route fallback counting for `/api/v1/auth/refresh`, deterministic route sorting and compact JSON stdout lines.

Artifacts produced: `progress-route-island-source.test.ts`, `progress-route-island.spec.ts`, updated performance global teardown.

Result: CI #2068 proved frontend lint, typecheck, unit, production build and dependency audit; production runtime, UI, API, CSS and deployment workflows remain unchanged.

Failures: UI shard 2/2 failed the existing correlated Dictionary error scenario on `ios-webkit`.

Root cause: the fixture used a path-only HTTP 503 switch for `/api/v1/words`; it failed both the prerequisite unfiltered catalog load and the intended `query=durable` request. The initial error remount raced with `fill()` and reset the controlled input.

Fallback: keep the successful baseline load, match the failure by exact query semantics and arm retry only for the same target request. The fix is isolated to `system-states.spec.ts`.

Limitations: `/progress` budget cannot be tightened before a completely successful immutable-head performance run provides exact bytes and request count.

Reusable lesson: failure fixtures are request-state contracts. When baseline and action share an endpoint, scope the failure by method/path/query/body fields rather than a broad endpoint switch.

### CI failure classification and prevention

Purpose: diagnose CI #2068 without changing correct production runtime and promote a reusable prevention rule.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, Agent Harness CI classification rules.

Version or verification date: 2026-07-27.

Inputs: job `89929756765`, artifact `frontend-playwright-report-ui-2` ID `8647220580`, Playwright trace and exact request sequence.

Files inspected: `frontend/e2e/system-states.spec.ts`, `frontend/components/lexigo-dictionary-app.tsx`, UI shard logs and trace.

Actions performed: classified the failure as stale fixture, repaired the request matcher, waited for baseline list readiness, created `.agents/AGENTS.issue-247-request-scoped-fixtures.md` and indexed it in `.agents/AGENTS.md`.

Commands or procedures: workflow job log read, artifact download, trace/network inspection, exact source read and branch-only test/documentation writes.

Artifacts produced: request-scoped fixture regression, mandatory specialized AGENTS rule and updated normative index.

Result: the repair preserves the intended 503/correlation/retry contract while eliminating the initial-load race; corrected full CI is required next.

Failures: no production defect was found.

Root cause: test fixture scope was broader than the application state under test.

Fallback: if corrected CI still fails, inspect the new trace and request parameters before any runtime change.

Limitations: the corrected browser result is pending the next CI head.

Reusable lesson: do not infer user-action failure semantics from endpoint identity alone; prove request identity and baseline readiness in the fixture.
