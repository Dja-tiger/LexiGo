# Current Task Execution

## Task

- Branch: `style/issue-70-resource-stack-width`.
- Base SHA: `7c3684a63e415c647f0b1c7a96ac86387f79cafd`.
- Head SHA: resolve from live branch ref.
- PR: #370 (Draft).

## Skills used

### GitHub connector-first repository workflow

Purpose:

Preserve compatibility boundaries while proving deterministic production CSS ownership.

Instruction source:

GitHub skill, repository Agent Harness, Issue #70 CSS instructions and `docs/agent-harness.md`.

Version or verification date:

Verified 2026-08-04 Europe/Moscow against the exact base SHA.

Inputs:

- Issue #70 acceptance criteria;
- reviewed 71-item overlap manifest;
- mobile-PWA and adaptive resource-stack declarations;
- canonical routed root and six live resource-stack renderers;
- source and Chromium cascade contracts;
- diagnostic CI #2645 output.

Files inspected:

Mandatory harness files, root stylesheet order, relevant CSS owners, overlap contracts, routed root, renderer files and browser proof.

Actions performed:

- created the slice from exact reconciled main;
- verified the parser behavior with a diagnostic Draft CI;
- preserved the unscoped resource/async compatibility fallback;
- added only `.lx-routed-app .lx-resource-stack { width: 100%; }` inside 720–1099px;
- kept `.lx-async-state` unchanged;
- retained the reviewed 71-item manifest;
- added six-renderer source evidence and three-order/six-width browser evidence;
- removed a non-authoritative intermediate manifest commit before finalizing the branch.

Commands or procedures:

Exact-ref connector reads, branch-only writes, Draft CI log inspection, parser verification and computed bounding-width comparison.

Artifacts produced:

- canonical routed tablet width owner;
- unchanged compatibility fallback;
- six-renderer ownership inventory;
- three-order/six-width computed cascade proof.

Result:

Production resource-stack width is deterministic without narrowing compatibility or changing async-state ownership. Full immutable-head CI remains required.

Failures:

The first diagnostic mechanism removed the fallback and therefore disagreed with the reviewed manifest. It was replaced before final validation.

Root cause:

The compatibility fallback was valid; the missing element was a stronger canonical production owner.

Fallback:

Adjust only the routed selector or fixture ancestry if browser evidence detects drift. Do not change values, breakpoints, snapshots, tolerances, timeouts or budgets.

Limitations:

Async-state and the other Issue #70 CSS clusters remain separate slices.

Reusable lesson:

Preserve a valid compatibility fallback when a stronger routed owner can make production behavior deterministic and independently provable.
