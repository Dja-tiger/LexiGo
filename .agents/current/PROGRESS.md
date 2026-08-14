# Current Task Progress

## 2026-08-14 18:44 Europe/Moscow

### Verified

- Base/main remains `22c84c630a76384a02e1a785c44bc24b064895ff`.
- Approved Figma `79:93` SHA remains `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Focus-only candidate was rejected by CI #3491.
- `--disable-skia-runtime-opts` candidate was rejected by CI #3496: it changed approved Phrases compact hashes and `79:93` still flaked `dd2d... → e140...`.
- Same-run capture analysis localized original nondeterminism to a few 1-LSB pixels in the fixed reminder blur/shadow rather than Dictionary content/layout/data.
- Chromium primary source defines `num-raster-threads` as the number of worker threads used for raster tasks.

### Finding

The next narrower hypothesis is worker scheduling rather than a different Skia algorithm. `visual-compact` now uses `--num-raster-threads=1`; medium/desktop projects and all approved evidence remain unchanged.

### Root cause

Still under test. Raster-task scheduling is the active hypothesis; accepted only if the entire compact content-addressed set remains unchanged and `79:93` passes first attempt without flaky status.

### Changed files

- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- rejected Skia flag fully reverted before new candidate;
- `system-states-visual.spec.ts` remains equal to `main`;
- hashes/snapshots/product source remain unchanged;
- Chromium switch semantics verified from primary source.

### Checks failed

- CI #3496 rejected Skia baseline mode: Phrases detail Light/Dark compact hashes changed and `79:93` remained flaky.
- live Figma MCP remains quota-blocked.

### Current branch head

Resolve from live branch ref after final metadata write.

### Next action

Update execution/PR evidence, freeze head, then run the authoritative visual suite. Any changed baseline or retry rejects the single-raster-worker candidate.