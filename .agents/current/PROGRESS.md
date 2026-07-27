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

- `.agents/current/TASK.md`
- `frontend/components/progress-route-island-source.test.ts`
- `frontend/e2e/progress-route-island.spec.ts`
- `frontend/e2e/performance-global-teardown.ts`

### Checks passed

- Exact branch readback completed for every changed path.
- Source inspection confirms no production runtime, API, CSS, visual or workflow file changed.
- Branch compare contains only declared paths and remains 0 commits behind `main`.

### Checks failed

- Local clone and local targeted execution are unavailable because the isolated execution environment cannot resolve `github.com`; no product or test failure has been observed.

### Current branch head

`0ef9d22f45a88268487d49385ec57703d5a3ed1c`

### Next action

Open a Draft PR and use the first full CI run to validate source/E2E contracts and capture the exact `/progress` cold-route measurement before changing `bundle-budgets.json`.
