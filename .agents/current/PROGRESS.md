# Current Task Progress

## 2026-08-14 21:18 Europe/Moscow

### Verified

- Base/main remains `22c84c630a76384a02e1a785c44bc24b064895ff`.
- Approved Figma `79:93` SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Focus-only candidate was rejected by CI #3491.
- `--disable-skia-runtime-opts` candidate was rejected by CI #3496 because approved Phrases compact hashes changed and `79:93` still flaked.
- `--num-raster-threads=1` candidate was rejected by CI #3501 because Dictionary remained `dd2d...` and approved Lessons compact output regressed.
- CI #3503 proves the double-rAF/layout candidate is not sufficient: first Dictionary attempt produced `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`, retry produced approved `e1405517...`, and Playwright summary reported `1 flaky`.
- Pairwise raw-capture equality did not fail, so each lifecycle is internally stable; the hash switch occurs between browser/test lifecycles rather than between adjacent screenshots.
- `installDeterministicRuntime()` already injects `animation: none`, `transition: none`, `scroll-behavior: auto` and transparent caret before page load.

### Finding

The remaining local screenshot helper also passes `animations: "disabled"`. Playwright documents that option as an active animation-state mutation. The next narrow candidate removes only this screenshot-time mutation while retaining deterministic runtime CSS, font/scroll/layout paint barriers and pairwise SHA proof.

### Root cause

Still under test. Renderer output is stable within a lifecycle but can select one of two 1-LSB shadow rasters across lifecycles. Screenshot-time animation state mutation is the active hypothesis.

### Changed files

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- `frontend/playwright.visual.config.ts` is byte-identical to `main` and absent from the PR diff;
- hashes/snapshots/product source remain unchanged;
- CI #3503 visual job ran all 141 scheduled entries and all non-Dictionary visual evidence passed;
- pairwise capture proof classified the first Dictionary attempt as stable `dd2d...`, not an intra-attempt race.

### Checks failed

- CI #3503 is unacceptable despite job conclusion `success`: Playwright retried `compact Dictionary empty light`, first attempt was `dd2d...`, final summary was `1 flaky`.
- live Figma MCP remains quota-blocked.

### Current branch head

Resolve from live branch ref after the next atomic candidate commit.

### Next action

Remove only `animations: "disabled"` from the content-addressed raw screenshot helper, freeze the new head, and run authoritative Linux visual CI. Any first-attempt non-approved SHA, pairwise mismatch or flaky classification rejects the candidate.
