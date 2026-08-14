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
Issue #518; exact-main #3486; PR #520 CI #3491/#3496/#3501/#3503; visual job logs; approved SHA `e1405517...`.

Files inspected:
System State/Phrases visual owners, Dictionary async owners, AsyncStatePanel, reminder CSS, Playwright visual config, deterministic runtime helper, CI logs/traces/PNGs and historical Figma evidence.

Actions performed:
Rejected focus-state normalization; rejected `--disable-skia-runtime-opts`; rejected `--num-raster-threads=1`; replaced arbitrary screenshot delay with font/scroll/layout double-rAF stabilization; added pairwise raw-PNG equality proof; inspected CI #3503 logs and proved first-attempt stable `dd2d...` followed by retry `e140...` with `1 flaky`; narrowed the next candidate to removing only screenshot-time `animations: "disabled"`.

Commands or procedures:
Exact GitHub source/log/artifact reads; fail-closed branch writes; immutable-head CI; Playwright screenshot API verification.

Artifacts produced:
Draft PR #520 contains only Agent Harness records plus `frontend/e2e/system-states-visual.spec.ts`. Product source, visual config, approved hashes and snapshots remain unchanged.

Result:
Double-rAF/layout stabilization alone is rejected. Pairwise proof shows each test lifecycle is internally deterministic; variability is cross-lifecycle. Next candidate removes screenshot-time animation mutation while keeping deterministic CSS and pairwise proof.

Failures:
- CI #3491 rejected focus-only capture normalization.
- CI #3496 rejected Skia runtime mode and changed approved Phrases output.
- CI #3501 rejected one raster worker and regressed approved Lessons output.
- CI #3503 first Dictionary attempt produced `dd2d...`, retry produced `e140...`; Playwright reported `1 flaky`.
- live Figma MCP remains quota-blocked.

Root cause:
Still under test; current evidence places the switch between browser/test lifecycles, with screenshot-time animation state mutation as the next local hypothesis.

Fallback:
If removing screenshot-time animation handling still yields `dd2d...` or flaky output, preserve the pairwise proof and continue lifecycle/compositor diagnosis without tolerances, retries, sleeps, renderer flags or baseline promotion.

Limitations:
Historical Figma/PR #239 approval remains authoritative until live Figma access returns.

Reusable lesson:
A green CI job can still violate visual acceptance when Playwright reports a flaky retry; exact-hash Figma gates must inspect test-attempt provenance, not only job conclusion.
