# Current Task Progress

## 2026-08-14 18:36 Europe/Moscow

### Verified

- Base/main: `22c84c630a76384a02e1a785c44bc24b064895ff`.
- Figma source: `79:93`; approved SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Exact-main #3486 reproduced alternate `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` with identical source tree/container image; controlled retry later reached approved hash.
- PR #520 first candidate (focus-only capture normalization) was rejected by authoritative visual CI #3491: first capture `31cc4854...`, retry `4f0632fd...`; therefore focus state is not the root determinant.
- Pixel diff between those two captures contains only 3 pixels, each differing by at most 1 RGB level, bounding box `x=272..321, y=7..18` on the blur/shadow edge of the fixed calendar reminder action, outside Dictionary content.
- Dictionary words, metadata and progress requests finish before capture; layout/data readiness is not the late variable.
- Chromium primary source documents `--disable-skia-runtime-opts` as disabling runtime-detected high-end CPU optimizations to force a baseline Skia path useful for web/layout tests.

### Finding

The remaining nondeterminism is raster-level, not route/data/layout-level. Raw full-viewport PNG SHA is sensitive to tiny Skia blur raster differences in the reminder shadow. The rejected focus experiment has been restored exactly to `main`. The next candidate forces only `visual-compact` Chromium onto Skia's baseline CPU path and keeps every existing approved hash/snapshot strict.

### Root cause

Current root-cause boundary: runtime CPU-dispatched Skia rasterization is a stronger candidate than DOM timing. This remains a hypothesis until the full compact visual set passes unchanged and `79:93` succeeds on the first Playwright attempt.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/playwright.visual.config.ts`

`frontend/e2e/system-states-visual.spec.ts` is restored byte-for-byte to `main` and is no longer part of the branch diff.

### Checks passed

- Focus-only hypothesis rejected fail-closed; no baseline promotion occurred.
- Failed captures inspected at pixel level.
- Source owner of the differing shadow identified as `calendar-reminder-entry.css` (`box-shadow: 0 12px 30px rgba(0,0,0,0.24)`), but production CSS remains untouched.
- Chromium primary-source switch semantics verified.
- Current branch compare: `0 behind`; exactly four files differ (three harness files + visual config); no product CSS/React/hash/snapshot/workflow changes.

### Checks failed

- PR #520 visual job `94811360746` rejected the focus-only candidate.
- Live Figma MCP remains quota-blocked; no new canvas approval is claimed.

### Current branch head

Resolve from live branch ref after final execution metadata write.

### Next action

Update execution evidence and PR description, freeze the new head, then use authoritative visual CI as a compatibility experiment. Accept only if all existing compact baselines remain unchanged and `79:93` passes on the first Playwright attempt without flaky classification.