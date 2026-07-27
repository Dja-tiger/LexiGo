# Current Task Progress

## 2026-07-27 10:44 Europe/Berlin

### Verified

- Live `main` remains `a0b6ce2bfa359ec232ad3c8df79f0bdfa624db1c`.
- Branch `perf/issue-247-progress-island-budget` is based on that exact SHA, is 0 commits behind and has no parallel open PR.
- Issue #247 is the active atomic slice under parent Issue #115.
- Stage remains healthy on runtime image `426144d00a857f36be8a543553df5029ac49a454`; prior Agent Docs merges did not redeploy runtime images.

### Finding

- Dictionary, Progress, Profile and Scenario routes already use separate dynamic client entries.
- `/`, `/learn`, `/phrases` and `/lesson/active` still use the monolithic `LexigoPremiumApp` graph.
- Progress already has a dedicated island, but `/progress` still carries the original 238,257-byte monolithic baseline and 275,000-byte ceiling.
- Existing source contracts prove partial ownership, but no focused contract records the exact dynamic-entry consumer and no browser contract counts repeated refresh requests across route boundaries.

### Root cause

Issue #115 was implemented incrementally. Progress runtime extraction exists, while its release evidence and route-specific performance budget were not promoted after the extraction.

### Changed files

- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/progress-route-island-source.test.ts`
- `frontend/e2e/progress-route-island.spec.ts`
- `frontend/e2e/performance-global-teardown.ts`
- `frontend/e2e/system-states.spec.ts`

### Checks passed

- PR #248 Draft CI #2068/run `30251200141` passed classifier, backend unit/security, backend integration, frontend lint/typecheck/unit/build/dependency audit, Content Security, controlled service worker, visual regression, Dictionary smoke and other completed browser gates.
- New Progress source contract compiled and passed frontend unit tests.
- Exact branch readback completed for every changed path.
- Source inspection confirms no production runtime, API, CSS, visual or workflow file changed.
- Branch compare remains 0 commits behind `main`.

### Checks failed

- UI shard 2/2 job `89929756765` failed the existing correlated Dictionary error scenario on `ios-webkit`.
- Artifact `frontend-playwright-report-ui-2` ID `8647220580` and trace showed a stale fixture race: the path-only interceptor returned HTTP 503 for both the initial catalog request and `query=durable`, so the initial error remount reset the controlled input during `fill()`.
- This is a stale test fixture, not a production defect. The fixture now allows successful baseline loading and fails only the exact `query=durable` request.
- Local clone and local targeted execution remain unavailable because the isolated execution environment cannot resolve `github.com`.

### Current branch head

Resolve from live branch ref after the request-scoped fixture rule and index update.

### Next action

Run corrected full PR CI. After the first completely successful immutable-head performance run, read the exact `/progress` bytes/request count and promote them into the route-specific budget and documentation.
