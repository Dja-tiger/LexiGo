# Current Task Execution

## Task

- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Skills used

### GitHub / CI root-cause analysis

Purpose:
Diagnose the Figma `79:93` visual flake without changing approved design evidence.

Instruction source:
Repository Agent Harness, GitHub skill and `gh-fix-ci` skill.

Version or verification date:
2026-08-14.

Inputs:
Issue #518; exact-main CI #3486; visual jobs `94801586389` and `94803997693`; approved/alternate PNG hashes.

Files inspected:
`frontend/e2e/system-states-visual.spec.ts`, `frontend/components/dictionary-catalog.tsx`, `frontend/components/lexigo-dictionary-app.tsx`, `frontend/components/async-state.tsx`, `frontend/app/system-states.css`, Figma offline findings and CI trace/artifacts.

Actions performed:
Proved source-tree/container equivalence, parsed failing trace timing, verified async requests complete before capture, inspected failed PNG/video frames, and identified programmatic Empty-state focus plus `:focus-visible` rendering as the narrow capture-state variable.

Commands or procedures:
GitHub exact-source/log/artifact reads plus private trace/image inspection; no baseline or product writes.

Artifacts produced:
Test-only change in `system-states-visual.spec.ts` that waits final semantic owners, waits auto-focus, removes only transient capture focus, settles two animation frames and preserves raw approved SHA equality.

Result:
Ready for immutable-head CI validation; hypothesis is not considered proven until the authoritative Linux visual job passes cleanly on the first Playwright attempt.

Failures:
Live Figma MCP remains blocked by Starter-plan quota.

Root cause:
Pending CI confirmation; current evidence points to transient `:focus-visible` capture rather than data/network readiness.

Fallback:
If the first authoritative visual attempt still receives `dd2d...`, keep the baseline unchanged and continue raster/process-level diagnosis; do not add sleeps, tolerances or alternate hashes.

Limitations:
No new Figma render can be pulled while quota is exhausted; existing node provenance and historical PR #239 approval remain authoritative.

Reusable lesson:
For content-addressed Figma states, accessibility focus and static design capture are separate contracts; capture normalization must be test-only and explicit rather than altering production focus behavior.