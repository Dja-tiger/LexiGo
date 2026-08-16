# Current Task Progress

## 2026-08-16 Europe/Moscow

### Verified baseline

- Current Issue: #552.
- Branch: `agent/issue-552-openpencil-visual-acceptance`.
- Exact base/main SHA at task start: `e7d992ad6089aa6445017ea6ffff6280787b05d8`.
- Issue #550 is closed completed after PR #551, exact-main OpenPencil import and exact-main full CI #3594 succeeded.
- Native Figma archive identity remains SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`, size `1,191,055`.
- Deterministic OpenPencil candidate remains SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c`, size `2,309,061`, with 23 pages and 7,341 recursive nodes.
- Toolchain remains pinned to `ZSeven-W/openpencil` v0.8.2.

### Implemented on branch

- Replaced the stale current task contract with Issue #552 scope and fail-closed promotion rules.
- Added `docs/figma/openpencil-screen-map.json` with explicit canonical Figma-node to OpenPencil `fig_*` mappings for Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile and system states.
- Added `scripts/figma/openpencil-visual-acceptance.sh` to verify candidate identity, mapped node/page/name/geometry, start the pinned headless server, render Linux PNG evidence, capture variables/pages/node reads and probe editing on a disposable copy.
- Added `.github/workflows/openpencil-visual-acceptance.yml` to reproduce the candidate from the Git LFS `.fig`, execute the acceptance probe and upload the evidence for three days.

### Semantic finding

The imported candidate contains 83 nodes marked `reusable: true`, so component material is not reduced to one flat image. The JSON candidate does not expose a top-level variable/theme store. The workflow records `op vars` output so loss of Figma variable/token linkage is treated as an explicit semantic warning or blocker instead of being silently accepted.

### Process interruption and recovery

One attempted update of this progress file was rejected by the connector safety layer before any repository change. Per `.agents/AGENTS.tool-selection.md`, writes were stopped; live `main` was re-read and remained `e7d992ad6089aa6445017ea6ffff6280787b05d8`; this branch copy of `PROGRESS.md` was re-read unchanged at blob `5eda3cd7c837b9739b03703bd4e57b4181ab5a76`; and the exact `update_file` schema was reloaded before this retry.

### Validation pending

- Dedicated OpenPencil visual workflow has not run yet because the Draft PR is not open yet.
- No manual Linux render review has occurred yet.
- `design/openpencil/LexiGo Design System.op` has not been committed or promoted.
- No source-of-truth hierarchy has been switched yet.

### Next action

Update `EXECUTION.md`, compare the branch against live `main`, open a Draft PR, inspect the dedicated Linux evidence artifact and classify any render/editability/token failures before deciding whether the candidate can be promoted.
