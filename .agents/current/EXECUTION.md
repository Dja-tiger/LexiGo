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
Repository Agent Harness, GitHub/CI skills and Chromium primary switch sources.

Version or verification date:
2026-08-14.

Inputs:
Issue #518; exact-main #3486; PR #520 CI #3491/#3496; failed visual artifacts; approved SHA `e1405517...`.

Files inspected:
System State/Phrases visual owners, Dictionary async owners, AsyncStatePanel, reminder CSS, Playwright visual config, CI logs/traces/PNGs, Chromium compositor/raster switch sources.

Actions performed:
Rejected focus-state normalization; proved pixel-level raster noise; rejected `--disable-skia-runtime-opts` because it changed approved Phrases compact hashes and did not remove `79:93` flakiness; restored normal raster algorithm; narrowed the next experiment to `--num-raster-threads=1` on `visual-compact` only.

Commands or procedures:
Exact GitHub source/log/artifact reads; pixel-diff analysis; primary-source switch verification; fail-closed branch writes.

Artifacts produced:
Draft PR #520 now contains only a single-raster-worker launch flag for compact Chromium plus Agent Harness records. All product source, System State test source, hashes and snapshots equal `main`.

Result:
Third candidate ready for immutable-head CI. Passing requires all approved compact output unchanged and `79:93` clean on the first Playwright attempt.

Failures:
- CI #3491 rejected focus-only capture normalization.
- CI #3496 rejected Skia baseline algorithm mode: Phrases detail compact Light/Dark hashes changed and Dictionary Empty remained flaky.
- live Figma MCP remains quota-blocked.

Root cause:
Still under test; raster worker scheduling is the current narrow hypothesis.

Fallback:
If one raster worker still flakes or changes approved output, revert it and continue compositor/raster diagnosis without tolerances, sleeps, retries or baseline promotion.

Limitations:
Historical Figma/PR #239 approval remains authoritative until live Figma access returns.

Reusable lesson:
A deterministic visual fix must preserve all approved content-addressed output; renderer switches that alter legitimate baselines are evidence, not acceptable fixes.