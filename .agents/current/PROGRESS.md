# Current Task Progress

## 2026-08-16

### Started #201 design slice

- Verified `main` at `14558e726cb64c59b21437832bef3c6277c978b6` with no open PRs.
- Created `design/issue-201-first-use-openpencil` from exact `main`.
- Owner decision: continue operating OpenPencil v0.8.2 in GitHub Actions; persistent VPS deployment is not required for design work.
- Closed infrastructure Issue #554 as `not planned`; merged self-host tooling remains an optional fallback.

### Contract reconstructed

Issue #201 still requires canonical design states before frontend implementation:

- Guest Home mobile/desktop;
- desktop onboarding;
- diagnostic pre-reveal and post-mark/reveal;
- in-progress/resume;
- skip and completion;
- loading/error/retry/recovery;
- Light/Dark coverage and stable node IDs in Screen Map.

Backend #18 already fixes the interaction semantics: `not_started / in_progress / completed / skipped`, up to 12 diagnostic items, and `known / unsure / new` self-mark before reveal.

### Execution mode

- Active design source remains `design/openpencil/LexiGo Design System.op`.
- Use pinned ZSeven OpenPencil v0.8.2 on Linux runner.
- First runner pass is inspection-only to resolve exact imported nodes/tree/geometry and render evidence.
- Canvas mutation will use semantic OpenPencil MCP operations, not hand-edited raw `.op` JSON.
- Temporary branch-only workflows are allowed during execution but must be removed before final CI.

### Next gate

Run the inspection job, review its node/tree/screenshot artifact, then define the smallest deterministic mutation plan for the missing #201 production state matrix.
