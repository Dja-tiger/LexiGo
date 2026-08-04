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
- `public-runtime-smoke.spec.ts` executes only in the post-merge stage workflow, so pure classification boundaries were moved into a Vitest-covered module before merge.
- No intersecting Issue #70 product PR is open; only unrelated Dependabot PRs #304–#306 remain open.

### Finding

The stage failure is a public-test classification gap rather than a runtime regression. WebKit can surface cancellation of the build-scoped service-worker load while the guard unregisters stale runtime state and replaces the document. The public test correctly proved all recovery invariants but lacked the narrow recovery-scoped diagnostic handling already used by local guard coverage.

### Root cause

`captureFatalRuntimeErrors` had no knowledge of the browser engine, active guard-recovery window or expected current-build service-worker URL. Consequently the known WebKit cancellation remained in `fatalErrors` even when the replacement service worker and application recovered successfully.

### Changed files

- `frontend/lib/public-runtime-errors.ts`
- `frontend/lib/public-runtime-errors.test.ts`
- `frontend/e2e/public-runtime-smoke.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Diagnostic artifact `8889938105` downloaded and inspected; both error contexts contain the same exact failure and successful application state.
- Failed stage job `91971692028` and previous successful stage job `91936700171` were compared from decoded logs.
- Branch `agent/issue-70-public-webkit-sw-guard` created from exact main SHA.
- Classifier normalizes WebKit's split `Error.name`/`Error.message` diagnostic.
- Exemption requires WebKit, an explicitly active recovery window and exact equality with the same-origin current-build `sw.js` URL.
- Vitest adversarial coverage preserves failure behavior for Chromium, inactive recovery, another build, another origin and API requests.
- Public recovery additionally requires the exact current-build service-worker registration and absence of service-worker error UI.
- New module, unit test and public integration were read back from the isolated branch.
- Draft PR #383 opened.
- Initial CI #2704 on superseded head `076a977989ef6830638372a540bbea9e21653017` passed frontend core, but is no longer authoritative after adding pre-merge unit evidence.

### Checks failed

- Exact-image stage run `30903056155`: public iOS WebKit stale-build recovery failed after one Playwright retry because the known service-worker cancellation was classified as fatal.
- No product runtime, deploy, public smoke, CSP, route-state or stale-cache cleanup assertion failed.

### Current branch head

Resolve from live branch ref; latest known task-record commit: `7e0d4ab349c61c4e161242c2f07e4b80f7b02b0c`.

### Next action

Complete execution provenance, verify the six-file diff and track only CI on the newest immutable head. Merge only after the full matrix is green.
