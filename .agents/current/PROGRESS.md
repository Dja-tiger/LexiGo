# Current Task Progress

## 2026-07-27 11:34 Europe/Berlin

### Verified

- Live `main` remains `a0b6ce2bfa359ec232ad3c8df79f0bdfa624db1c`.
- Branch `perf/issue-247-progress-island-budget` remains based on that exact SHA, is 0 commits behind and has no parallel open PR.
- Issue #247 is the active atomic slice under parent Issue #115; Draft PR #248 owns the branch.
- Stage remains healthy on runtime image `426144d00a857f36be8a543553df5029ac49a454`; prior Agent Docs merges did not redeploy runtime images.

### Finding

- Dictionary, Progress, Profile and Scenario routes use separate dynamic client entries.
- `/`, `/learn`, `/phrases` and `/lesson/active` still use the monolithic `LexigoPremiumApp` graph.
- Progress runtime extraction already existed, but `/progress` still carried the original 238,257-byte monolithic baseline and 275,000-byte ceiling.
- The successful route-island graph measures 207,502 JavaScript bytes and 18 initial requests for cold `/progress` entry.

### Root cause

Issue #115 was implemented incrementally. Progress runtime extraction existed, while its exclusive ownership evidence, single-bootstrap browser proof and route-specific release budget were not promoted after extraction.

### Changed files

- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/bundle-budgets.json`
- `frontend/components/progress-route-island-source.test.ts`
- `frontend/e2e/performance-global-teardown.ts`
- `frontend/e2e/progress-route-island.spec.ts`
- `frontend/e2e/system-states.spec.ts`
- `frontend/lib/bundle-budgets.test.ts`
- `docs/frontend-bundle-budgets.md`

The temporary measurement probe in `frontend/e2e/route-bundle-budget.spec.ts` was removed byte-for-byte before the final candidate head, so that file is absent from the final branch diff.

### Checks passed

- Corrected PR #248 CI #2074/run `30252335806` completed successfully on head `03854f0601972d270bb052725548578cf11929e3`.
- CI #2074 passed classifier, backend unit/race/security, backend integration, frontend lint/typecheck/unit/build/dependency audit, Chromium/WebKit/Android/iOS/PWA groups, accessibility, Content Security, controlled service worker, visual regression and performance budgets.
- Progress source contract proves exclusive bootstrap loading and excludes monolithic/session/outbox/PWA ownership from `LexigoProgressApp`.
- Progress browser contract proves direct entry plus repeated Progress ↔ Home/Learn/Dictionary navigation with exactly one network `/api/v1/auth/refresh` request.
- Exact measurement artifact `8648042201` was produced by run `30253573827` on probe head `96479e0f07eda62cff5176f519e6294e005a451b`; the probe changed only the test and was removed after extraction.
- Exact `/progress` result: 207,502 JavaScript bytes, 18 initial requests, 30,755-byte reduction (12.9%) from the original 238,257-byte graph.
- Permanent budget is locked to baseline 207,502, JavaScript ceiling 240,000 and request ceiling 21.
- Budget tests require Progress baseline and both ceilings to remain below the monolithic route graph.
- Exact branch readback completed for every changed path; no production runtime, API, CSS, visual baseline or deployment workflow changed.

### Checks failed

- Initial CI #2068/run `30251200141` failed UI shard 2/2 job `89929756765` in the existing correlated Dictionary error scenario on `ios-webkit`.
- Artifact `frontend-playwright-report-ui-2` ID `8647220580` proved a stale fixture race: a path-only interceptor returned HTTP 503 for both initial load and `query=durable`, causing an initial error remount during `fill()`.
- The fixture now succeeds for baseline loading and fails only the exact `query=durable` request. The prevention rule is mandatory in `.agents/AGENTS.issue-247-request-scoped-fixtures.md`.
- Measurement run `30253573827` intentionally failed only the performance job after writing the exact report. It is measurement evidence, not merge evidence, and the probe has been removed.
- Local clone and targeted execution remain unavailable because the isolated execution environment cannot resolve `github.com`; GitHub Actions remains authoritative.

### Current branch head

Resolve after the final factual memory and PR-body updates.

### Next action

Freeze the next developer-authored head, run complete required CI with the permanent budget and no measurement probe, inspect reviews/threads, then Ready and expected-head squash merge only after every gate succeeds.
