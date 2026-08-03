# Current Task Execution

## Task

- Branch: `style/issue-70-resource-stack-width`.
- Base SHA: `7c3684a63e415c647f0b1c7a96ac86387f79cafd`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Skills used

### GitHub connector-first repository workflow

Purpose:

Read exact repository state, perform branch-only writes, preserve one-slice ownership boundaries and use authoritative CI for parser/browser evidence.

Instruction source:

`skills://plugins/github/github/skill.md`, repository `AGENTS.md`, `.agents/AGENTS.md`, Issue #70 compatibility/CSS instructions, tool-selection rules and `docs/agent-harness.md`.

Version or verification date:

Verified 2026-08-04 Europe/Moscow against base `7c3684a63e415c647f0b1c7a96ac86387f79cafd`.

Inputs:

- Issue #70 acceptance criteria;
- reconciled PR #368 delivery evidence;
- 71-item pre-slice exact-selector manifest;
- production root stylesheet order;
- mobile-PWA and adaptive-navigation resource-stack declarations;
- canonical routed application root;
- all live resource-stack renderer files;
- existing navigation/mobile-shell source and Chromium cascade contracts.

Files inspected:

- mandatory Agent Harness files and referenced specialized instructions;
- `.agents/PROJECT_STATE.md` and reset `.agents/current/**`;
- `frontend/app/layout.tsx`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/adaptive-navigation.css`;
- global overlap manifest/source contracts;
- `frontend/components/routed-lexigo-app.tsx`;
- Home, Learn, Progress, Dictionary, Active Lesson and compatibility fallback renderers;
- navigation/mobile-shell source and browser specs;
- frontend package scripts routing the focused spec through UI and responsive commands.

Actions performed:

- verified PR #368 product merge, exact-SHA main CI and exact-SHA stage/public success;
- reconciled that delivery through docs PR #369 and verified its exact-SHA lightweight main CI;
- created the product branch from the new exact main;
- bounded the slice to the one `.lx-resource-stack | width` parser item;
- split the tablet `.lx-resource-stack, .lx-async-state` selector group;
- scoped only resource-stack below `.lx-routed-app` inside the existing 720–1099px media range;
- left async-state text, value and specificity unchanged;
- added source evidence for all six live resource-stack renderer files;
- extended the three-order/six-width Chromium fixture to compare resource-stack and main-content bounding widths;
- changed expected manifest totals from 71/21 to 70/20 while intentionally leaving the manifest stale for parser-derived regeneration.

Commands or procedures:

- exact-ref connector fetches and read-backs;
- Issue #12 bot evidence for main/stage delivery;
- contents-API branch writes only;
- fail-closed parser plan using Draft CI before manifest synchronization;
- computed width comparison with a sub-pixel tolerance below 0.5px, without visual tolerance changes.

Artifacts produced:

- routed tablet resource-stack width owner;
- separate unchanged async-state owner;
- six-renderer source inventory;
- three-order × six-width resource-stack computed-cascade proof;
- expected post-slice inventory boundary: 70 total, 50 intentional, 20 requires-proof, 0 protected.

Result:

The source mechanism removes the equal-selector mobile/adaptive resource-stack conflict while preserving the effective production values at every responsive range. Authoritative CI is still required to generate and synchronize the exact manifest and to validate the complete product matrix.

Failures:

None yet. The next Draft CI is intentionally expected to fail only because the committed manifest still contains the removed 71st item.

Root cause:

Resource-stack and async-state were grouped for convenience despite different runtime ownership. Equal specificity made tablet resource width depend on root stylesheet order, while canonical `.lx-routed-app` ancestry provides an existing, bounded owner mechanism for resource-stack only.

Fallback:

If computed browser evidence shows drift, revise only the routed resource-stack selector or fixture ancestry. Do not change values, breakpoints, snapshots, hashes, tolerances, timeouts or budgets.

Limitations:

This slice does not address async-state, Scenario/Learning switch, Phrases grid, adaptive layout, Account Security or semantic non-identical selector overlaps.

Reusable lesson:

A grouped CSS rule does not imply shared ownership. Split selectors before raising specificity so each runtime concern can be corrected and delivered as an independent atomic slice.
