# Current Task Execution

## Task

- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Skills used

### GitHub / CI root-cause analysis

Purpose:
Make Figma `79:93` capture deterministic without changing approved design evidence.

Instruction source:
Repository Agent Harness, GitHub/CI skills, Chromium primary switch source.

Version or verification date:
2026-08-14.

Inputs:
Issue #518; exact-main #3486; PR #520 CI #3491; failed capture artifacts; approved SHA `e1405517...`.

Files inspected:
System State visual test; Dictionary async owners; `AsyncStatePanel`; System State CSS; calendar-reminder component/CSS; Playwright visual config; CI logs/traces/PNGs.

Actions performed:
Proved async data completes before capture; tested and rejected focus-only normalization; compared same-run PNGs pixel-by-pixel; localized remaining variance to three 1-LSB pixels on the calendar reminder blur shadow; restored System State test exactly to `main`; added `--disable-skia-runtime-opts` only to the compact visual Chromium project.

Commands or procedures:
Connector exact source/log/artifact reads, local pixel-diff analysis, Chromium primary-source verification, branch-only writes with read-back.

Artifacts produced:
Draft PR #520 now contains only the compact Skia baseline launch flag plus Agent Harness records. Approved hashes, snapshots and product source are unchanged.

Result:
Second root-cause candidate is ready for immutable-head CI. It is accepted only if all existing compact baselines remain unchanged and `79:93` passes first attempt with no flaky classification.

Failures:
First #520 candidate failed authoritative visual job `94811360746`: focus normalization produced `31cc...` then `4f06...`, rejecting that hypothesis. Live Figma MCP remains quota-blocked.

Root cause:
Current boundary is raster-level Skia blur variation. CPU runtime-dispatch is the active hypothesis, not yet proven.

Fallback:
If baseline Skia mode changes approved renders or still flakes, reject it and continue raster/process diagnosis; never add sleeps/tolerances/alternate hashes or promote an unreviewed baseline.

Limitations:
No new Figma render can be pulled while quota is exhausted. Historical PR #239 approval remains authoritative.

Reusable lesson:
For raw content-addressed screenshots, a handful of 1-LSB blur pixels can fail SHA equality even when DOM/layout/data are identical; renderer determinism must be tested at the rasterizer boundary rather than hidden with retries.