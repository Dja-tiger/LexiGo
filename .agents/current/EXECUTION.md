# Current Task Execution

## Task

- Issue: #201.
- Branch: `design/issue-201-first-use-openpencil`.
- Base SHA: `14558e726cb64c59b21437832bef3c6277c978b6`.
- Runtime: ZSeven OpenPencil v0.8.2 in GitHub Actions Linux runners.

## Pre-flight

Read and reconciled before implementation writes:

- root `AGENTS.md`;
- `.agents/AGENTS.md` and base rules;
- `.agents/SKILLS.md`;
- `docs/agent-harness.md`;
- live `main`, open PR state, Issue #201 and its design/backend comments;
- promoted OpenPencil source contract and screen map;
- merged OpenPencil v0.8.2 MCP/self-test implementation;
- upstream v0.8.2 MCP schemas for semantic copy/update/batch/screenshot operations.

At task start:

- `main = 14558e726cb64c59b21437832bef3c6277c978b6`;
- no open PRs;
- branch was created from exact `main`;
- #554 self-host deployment was closed `not planned` after owner decision to continue CI-native OpenPencil operation;
- #201 is the only selected atomic product-design slice.

## Issue contract reconstruction

Existing source audit proves canonical mobile onboarding Light exists in the archived Figma source as `79:46`, with role selection and Continue. The missing production design gate remains Guest Home, desktop onboarding, diagnostic pre/post reveal and resume states, skip/completion, loading/error/recovery, and complete appearance/form-factor coverage.

Delivered backend #18 provides the state semantics, so design must not invent a different interaction model: `not_started`, `in_progress`, `completed`, `skipped`; self-mark `known / unsure / new` occurs before reveal; diagnostic selection is bounded to 12; skip does not mutate scheduler state.

## CI-native OpenPencil strategy

The promoted `.op` is too large to safely transform through repository text APIs. The accepted execution path is therefore:

1. branch-only inspection job checks out the real source and starts pinned v0.8.2 file-backed MCP on Linux;
2. semantic reads locate the imported onboarding/system-state frames and emit JSON/tree/screenshot evidence;
3. after evidence review, a branch-only writer job performs explicit `copy_node` / `batch_design` / `update_node` / text operations against the checked-out `.op`;
4. writer readback and screenshots prove the resulting state matrix;
5. only intended source/map/handoff files are committed back to the feature branch;
6. temporary execution workflows are deleted before final CI;
7. permanent OpenPencil visual/token/source acceptance plus full repository CI run on the immutable final developer-authored head.

No VPS is required and no public MCP endpoint is introduced.

## Initial semantic-tool findings

Upstream v0.8.2 exposes the required operations:

- `copy_node`: copy a complete existing node subtree while preserving style/structure, optionally overriding x/y/name;
- `batch_design`: insert/update/delete/copy operations in one design transaction;
- `update_node`: semantic property update without replacing node identity/type/children;
- `set_node_text`: text mutation;
- `get_screenshot`: deterministic node PNG evidence;
- `list_pages`, `set_active_page`, `find_node_by_name`, `read_nodes`, `get_node` for discovery/readback.

The next operation is inspection-only: resolve exact OpenPencil IDs and tree structure before any canvas mutation.

## Validation ladder

semantic source inspection → deterministic design write/readback → node screenshots → Screen Map registration → permanent OpenPencil acceptance → full CI → Draft PR review → final-head CI → Ready/squash merge → exact-main verification and harness reconciliation.
