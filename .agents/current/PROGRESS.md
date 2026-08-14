# Current Task Progress

## 2026-08-14 23:28 Europe/Moscow

### Verified

- Base/main remains `22c84c630a76384a02e1a785c44bc24b064895ff`.
- Approved Figma `79:93` SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Focus-only candidate was rejected by CI #3491.
- `--disable-skia-runtime-opts` candidate was rejected by CI #3496 because approved Phrases compact hashes changed and `79:93` still flaked.
- `--num-raster-threads=1` candidate was rejected by CI #3501 because Dictionary remained `dd2d...` and approved Lessons compact output regressed.
- CI #3503 rejected double-rAF/layout stabilization alone: first Dictionary attempt produced stable `dd2d...`, retry produced approved `e140...`, final summary reported `1 flaky`.
- Candidate `23843e3bb3180b6390654623a37741cf587506c8` removed only screenshot-time `animations: "disabled"`. CI #3504 attempt 1 was clean, but the mandatory identical-head Visual rerun (job `94886550359`) rejected it: first compact Dictionary lifecycle produced `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`, retry produced approved `e140...`, final summary was `1 flaky`, `56 passed`, `84 skipped`.
- Pairwise raw-capture equality still did not fail, so each lifecycle remains internally stable; the hash switch occurs between browser/test lifecycles rather than adjacent screenshots.
- `installDeterministicRuntime()` already injects `animation: none`, `transition: none`, `scroll-behavior: auto` and transparent caret before page load.
- Code commit `50d100e715ed57ba3c598820a7c5c7f61f504391` removes only screenshot-time `caret: "hide"`; its commit diff is exactly one deletion in `captureSystemState()`.
- Agent Harness reconciliation is on top of that code change. Resolve the immutable candidate head from the live branch ref before evaluating CI.

### Finding

Removing screenshot-time animation mutation was insufficient across independent browser lifecycles. The remaining screenshot-time state mutation is caret hiding, while the deterministic init CSS already owns caret visibility with `caret-color: transparent !important`. The current candidate lets that pre-load deterministic owner remain authoritative and removes only the redundant screenshot-time caret mutation.

### Root cause

Still under test. Current evidence rules out focus normalization, global Skia/raster switches, paint/layout readiness alone, and screenshot-time animation mutation as complete fixes. The unstable output remains a cross-lifecycle 1-LSB raster selection around the unchanged fixed reminder shadow. Screenshot-time caret mutation is the next local lifecycle variable under test.

### Changed files

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- `frontend/playwright.visual.config.ts` remains byte-identical to `main` and absent from the PR diff;
- hashes/snapshots/product source remain unchanged;
- CI #3504 attempt 1 proved `23843e3b...` can produce a clean first-attempt approved capture, but that single run was not accepted without the required rerun;
- code commit `50d100e7...` readback confirms only `caret: "hide"` was removed.

### Checks failed

- CI #3504 attempt 2 / Visual job `94886550359` rejected `23843e3b...`: Dictionary first attempt `dd2d...`, retry approved `e140...`, `1 flaky`.
- live Figma MCP remains quota-blocked.

### Current branch head

Resolve from live branch ref; do not move it again until current candidate CI and mandatory same-head Visual rerun are evaluated.

### Next action

Run authoritative Linux CI for the frozen live head. Any first-attempt non-approved SHA, pairwise mismatch or flaky classification rejects the candidate. If the first Visual run is clean, rerun the critical Visual job on the same immutable head before acceptance.
