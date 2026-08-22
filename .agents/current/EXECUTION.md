# Current Task Execution

## Task

- Issue: #652
- Branch: `fix/issue-652-first-use-loading-note-cascade`
- Base SHA: `3f60ebf36bee55843936fcf76acd5be1bc3d5a5f`
- Head SHA: resolve from live branch ref after commit
- PR: create after atomic commit

## Skills used

### GitHub repository operations

Purpose: split a runtime defect discovered by fail-closed visual evidence into an isolated repair branch without contaminating the evidence PR.

Instruction source: root `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.tool-selection.md`, `docs/agent-harness.md`.

Version or verification date: live repository state verified 2026-08-22.

Inputs: current `main`, Issue #652, parent #642/#645 evidence, #647/#648 runtime history and exact CI artifacts.

Files inspected: `frontend/app/first-use.css`, `frontend/components/first-use-route-contract.test.ts`, #645 exact Linux visual artifact and active OpenPencil renders.

Actions performed: created a dedicated runtime issue and branch from clean `main`; isolated CSS source-order root cause; prepared one media-scoped CSS change plus a fail-closed source contract and task-local harness records.

Commands or procedures: GitHub connector live reads, issue/branch operations, Git Data blob/tree/commit workflow, full immutable-head CI and protected merge lifecycle.

Artifacts produced: Issue #652 and its runtime Draft PR.

Result: pending atomic commit and CI.

Failures: none in the runtime branch before CI. Parent evidence CI #3969 intentionally failed Visual regression and exposed this defect.

Root cause: equal-specificity source order allowed the later generic `.lx-first-use-note` display declaration to override the earlier compact-note hide rule on desktop.

Fallback: if full CI exposes compact regression, do not broaden the fix globally; preserve separate desktop/compact media owners and correct only selector/order ownership.

Limitations: this PR does not approve or carry any First Use loading/error runtime fingerprints.

Reusable lesson: a source contract that proves both selectors exist does not prove effective cascade ownership. When display state depends on equal specificity, protect declaration order or reassert the state inside the owning media boundary.

### Visual failure classification

Purpose: determine whether #645's new hashes were safe to approve.

Instruction source: Issue #642 delivery policy, active OpenPencil evidence rules and computed-cascade ownership guidance.

Inputs: CI #3969 / run `32539008972`, Visual job `96945407446`, artifact `9466508067`, exact runtime screenshots and OpenPencil nodes `n442/n614`.

Actions performed: verified all eight new cases reached `REVIEW_REQUIRED`; confirmed retry-stable SHA-256 values; manually compared exact Linux actuals against active design renders; rejected desktop loading hashes because runtime contained an extra compact-only note surface.

Result: product mismatch proven; #645 remains fail-closed and Issue #652 owns repair.

Failures: desktop loading Light/Dark do not satisfy active design hierarchy.

Root cause: CSS cascade, not fixture instability or screenshot nondeterminism.

Fallback: deliver runtime repair, validate exact-main/Stage, then recollect all eight actuals from corrected runtime.

Limitations: pre-repair hashes are forensic evidence only and must not be promoted after any runtime CSS change.

Reusable lesson: retry-stable screenshot hashes prove determinism, not correctness. Manual source-of-truth review remains mandatory before fingerprint approval.