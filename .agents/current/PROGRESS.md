# Current Task Progress

## 2026-08-04 14:08 Europe/Moscow

### Verified

- Live `main` before branch creation: `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`.
- Exact-SHA main CI run `30902346811` succeeded and published immutable web/API images.
- Exact-image stage run `30903056155` deployed successfully and public smoke passed.
- Public browser validation failed only in the iOS WebKit stale-build recovery test; 11/12 checks passed.
- Both the initial attempt and Playwright retry emitted the same current-build `sw.js` access-control page error.
- The recovery itself completed: current build marker restored, recovery marker cleared, stale cache deleted, route/search/hash preserved and CSP violations remained empty.
- Previous exact-image stage run `30892205056` emitted the same WebKit diagnostic once and passed on retry, proving the failure category predates the final Issue #70 acceptance slice.
- Local `build-version-recovery.spec.ts` already classifies narrowly scoped WebKit guard cancellations, while the public equivalent treated every page error as fatal.
- No intersecting Issue #70 product PR is open; only unrelated Dependabot PRs #304–#306 remain open.

### Finding

The stage failure is a public-test classification gap rather than a runtime regression. WebKit can surface cancellation of the build-scoped service-worker load while the guard unregisters stale runtime state and replaces the document. The public test correctly proved all recovery invariants but lacked the narrow recovery-scoped diagnostic handling already used by local guard coverage.

### Root cause

`captureFatalRuntimeErrors` had no knowledge of the browser engine, active guard-recovery window or expected current-build service-worker URL. Consequently the known WebKit cancellation remained in `fatalErrors` even when the replacement service worker and application recovered successfully.

### Changed files

- `frontend/e2e/public-runtime-smoke.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Diagnostic artifact `8889938105` downloaded and inspected; both error contexts contain the same exact failure and successful application state.
- Failed stage job `91971692028` and previous successful stage job `91936700171` were compared from decoded logs.
- Branch `agent/issue-70-public-webkit-sw-guard` created from exact main SHA.
- Public runtime test now normalizes WebKit's split `Error.name`/`Error.message` diagnostic.
- Exemption requires WebKit, an explicitly active recovery window and exact equality with the same-origin current-build `sw.js` URL.
- Adversarial assertions preserve failure behavior for Chromium, inactive recovery, another build and API requests.
- Recovery additionally requires the exact current-build service-worker registration and absence of service-worker error UI.
- Functional test write was read back from the isolated branch.

### Checks failed

- Exact-image stage run `30903056155`: public iOS WebKit stale-build recovery failed after one Playwright retry because the known service-worker cancellation was classified as fatal.
- No product runtime, deploy, public smoke, CSP, route-state or stale-cache cleanup assertion failed.

### Current branch head

Resolve from live branch ref; latest known task-record commit: `cced2fca9b2fc554ed46abcdd6442bddb38ba177`.

### Next action

Complete current execution provenance, verify the four-file diff and unchanged main, then publish a Draft PR and treat only the newest immutable-head CI as merge evidence.
