# Current Task Execution

## Task

- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Skills used

### GitHub / CI root-cause analysis

Purpose:
Make Figma `79:93` raw-PNG capture deterministic without changing approved design evidence.

Instruction source:
Repository Agent Harness, GitHub/CI skills, Playwright API documentation and historical Figma approval evidence.

Version or verification date:
2026-08-14.

Inputs:
Issue #518; exact-main #3486; PR #520 CI #3491/#3496/#3501/#3503/#3504; visual job logs; approved SHA `e1405517...`.

Files inspected:
System State/Phrases visual owners, Dictionary async owners, AsyncStatePanel, reminder CSS, Playwright visual config, deterministic runtime helper, CI logs/traces/PNGs and historical Figma evidence.

Actions performed:
Rejected focus-state normalization; rejected `--disable-skia-runtime-opts`; rejected `--num-raster-threads=1`; replaced arbitrary screenshot delay with font/scroll/layout double-rAF stabilization; added pairwise raw-PNG equality proof; rejected screenshot-time `animations: "disabled"` removal after CI #3504 passed once but failed the mandatory same-head rerun with first-attempt `dd2d...`, retry `e140...`, and `1 flaky`; removed only the remaining screenshot-time `caret: "hide"` mutation while keeping deterministic pre-load caret CSS.

Commands or procedures:
Exact GitHub source/log/artifact reads; fail-closed branch writes; immutable-head CI; same-head Visual rerun; Playwright screenshot API verification.

Artifacts produced:
Draft PR #520 contains only Agent Harness records plus `frontend/e2e/system-states-visual.spec.ts`. Product source, visual config, approved hashes and snapshots remain unchanged. Current code delta from the preceding candidate is exactly one deletion: `caret: "hide"`.

Result:
Animation screenshot-state mutation is not sufficient as the cross-lifecycle trigger: CI #3504 was clean once but its mandatory same-head rerun flaked. The current candidate removes only redundant screenshot-time caret hiding because `installDeterministicRuntime()` already owns caret invisibility before page load.

Failures:
- CI #3491 rejected focus-only capture normalization.
- CI #3496 rejected Skia runtime mode and changed approved Phrases output.
- CI #3501 rejected one raster worker and regressed approved Lessons output.
- CI #3503 first Dictionary attempt produced `dd2d...`, retry produced `e140...`; Playwright reported `1 flaky`.
- CI #3504 attempt 2 / Visual job `94886550359` rejected animation-only removal: first Dictionary attempt `dd2d...`, retry `e140...`, final `1 flaky`, `56 passed`, `84 skipped`.
- live Figma MCP remains quota-blocked.

Root cause:
Still under test. Evidence places the switch between independent browser/test lifecycles; focus, paint/layout readiness and screenshot-time animation mutation are insufficient explanations. Screenshot-time caret mutation is the remaining narrow local capture-state variable currently under test.

Fallback:
If removing screenshot-time caret handling still yields `dd2d...` or flaky output, preserve deterministic runtime CSS, pairwise proof and approved baseline, then continue compositor/lifecycle diagnosis without tolerances, retries, sleeps, renderer flags or product CSS changes.

Limitations:
Historical Figma/PR #239 approval remains authoritative until live Figma access returns.

Reusable lesson:
A single clean exact-hash visual run is insufficient for a known lifecycle flake. The same immutable developer-authored head must pass an independent Visual lifecycle with zero retries before acceptance.
