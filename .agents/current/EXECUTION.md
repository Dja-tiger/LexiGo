# Current Task Execution

## Task

- Issue: #198 — canonical Word Detail route
- Branch: `feat/issue-198-word-detail`
- Base SHA: `72291d9351f3c565d13be7b3f9e9055258f98ac6`
- Head SHA: resolve from live branch ref
- PR: #235 — Draft

## Skills used

### GitHub repository operations

Purpose: reconstruct live production state, isolate the atomic Word Detail slice, preserve branch-safe writes and validate implementation through repository CI.

Instruction source: root `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md`, `docs/agent-harness.md` and installed GitHub connector procedures.

Version or verification date: 2026-07-26.

Inputs: repository `Dja-tiger/LexiGo`, exact base `72291d9351f3c565d13be7b3f9e9055258f98ac6`, Issue #198, stage Issue #12 and Draft PR #235.

Files inspected: mandatory harness documents, current project state, README, architecture, canonical route page, navigation/history owners, session/bootstrap graph, Dictionary island/catalog, backend word model/repository/handler, lesson HTTP contract, speech runtime, catalog CSS and quality-gate suites.

Actions performed: verified live `main`, stage and open PR state; created an exact-base feature branch; wrote the task boundary; opened Draft PR #235 before runtime changes; added strict Word Detail payload/scheduler helpers; separated catalog and detail controllers; added Figma-backed presentation; skipped catalog metadata/progress/page requests on detail; added bounded server-owned related phrase search; added exact single-word lesson creation; retired the temporary old-detail CSS boundary; added initial unit coverage.

Commands or procedures: connector exact-file reads/writes with explicit branch and blob SHA, post-write read-back, Figma node inspection, backend/frontend owner tracing and CI run polling.

Artifacts produced: branch `feat/issue-198-word-detail`, Draft PR #235, active harness memory, standalone Word Detail route controller/presentation/styles and strict scheduler unit contract.

Result: the first implementation checkpoint is published. Direct detail no longer requires a catalog page response, scheduler evidence is server-owned, related phrases preserve backend order and the practice CTA sends exactly one selected word ID.

Failures: no CI classification is available yet for the current checkpoint. Source review found one undefined CSS token before visual testing.

Root cause: Word Detail presentation remained coupled to the Dictionary catalog owner after routing and backend detail semantics had become canonical. The undefined token came from assuming Figma's action-foreground variable existed in the Foundation V1 CSS token set.

Fallback: keep session/API/history orchestration in the existing Dictionary island; add route-local presentation and validation instead of creating a second application root or changing backend contracts. Replace the missing action foreground with an explicit route-local Light/Dark token.

Limitations: focused browser/accessibility/PWA/visual/bundle contracts, final CI, manual Linux visual review, baseline promotion, Ready transition, squash merge, exact-SHA stage validation and post-merge repository-memory reconciliation remain pending.

Reusable lesson: Figma representative values are presentation evidence only. A production detail surface must bind status and scheduling copy to typed backend fields, and every visual variable must be resolved against the actual repository token source before baseline calibration.

### Figma design inspection

Purpose: reproduce the approved Word Detail information hierarchy without inferring unsupported product semantics.

Instruction source: Issue #198 and installed Figma design-to-code skill.

Version or verification date: 2026-07-26.

Inputs: LexiGo Design System `3xXmBWnf38jbvLjtziwber`, Mobile Dark `78:99`, Desktop Dark `78:274`.

Files inspected: Figma design context and variable definitions for both nodes, plus repository Foundation V1 tokens.

Actions performed: recorded compact/desktop hierarchy, spacing, cards, status, speech control, related phrases and action placement; compared representative Figma fields with actual API ownership; identified unsupported retention percentage and personal-note persistence; mapped Light/Dark to existing semantic tokens.

Commands or procedures: `get_design_context`, `get_variable_defs`, exact source comparison and ownership classification.

Artifacts produced: verified design/state matrix and bounded presentation contract recorded in `.agents/current/TASK.md`.

Result: the implementation follows the approved hierarchy while replacing representative percentage/note affordances with honest production scheduler/context data.

Failures: no Figma retrieval failure. The design variable `action/on-primary` is not formalized in repository Foundation V1 CSS and requires a route-local equivalent.

Root cause: Figma variable inventory is broader than the currently formalized global token subset.

Fallback: preserve global token ownership and define only the missing foreground value within the Word Detail route boundary for Light/Dark.

Limitations: Linux rendering still requires manual comparison before any content-addressed baseline is accepted.

Reusable lesson: compare Figma variables against checked-in semantic tokens explicitly; never assume matching names or widen global tokens inside a feature slice.
