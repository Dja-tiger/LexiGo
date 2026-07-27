# Current Task Execution

## Task

- Branch: `perf/issue-250-home-island`
- Base SHA: `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`
- Head SHA: resolve from live branch ref after publication
- PR: Draft PR pending first implementation commit

## Skills used

### GitHub repository operations

Purpose: reconstruct live state and perform Issue #250 writes only on the isolated branch.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`, GitHub plugin skill.

Version or verification date: 2026-07-27.

Inputs: live `main`, Issue #250, branch ref, open PRs, PR #248/#249 evidence and Issue #12 deployment evidence.

Files inspected: mandatory Agent Harness documents, README, architecture, Home Figma handoff, bootstrap/router/navigation sources, Home/Active Lesson implementation, route bundle tests/config and relevant source/browser contracts.

Actions performed: resolved exact refs, compared current ownership boundaries, prepared an atomic Home route-island implementation and planned read-back/compare/CI evidence gates.

Commands or procedures: exact-ref connector reads; branch-only contents publication; per-path read-back; `compare_commits(main, branch)`; Draft PR CI and artifact inspection.

Artifacts produced: Issue #250 branch implementation, source/unit/browser contracts and populated current-task memory.

Result: implementation published to the branch; read-back and Draft CI pending.

Failures: local Git clone/raw download could not resolve `github.com`; branch search API did not enumerate the already valid branch ref; Git tree creation could not accept a commit SHA as `base_tree_sha`.

Root cause: outbound DNS is unavailable in the isolated execution container, search indexing is not authoritative for exact refs, and GitHub's tree API requires the actual tree object SHA.

Fallback: use exact GitHub connector file/ref operations and immutable GitHub Actions runs; verify the branch through direct ref reads rather than indexed search; publish branch files through sequential contents operations and rely on PR squash for the final atomic commit.

Limitations: complete frontend lint/typecheck/browser/build execution requires repository CI; local checks are limited to syntax and static source analysis.

Reusable lesson: route graph transitions should be driven by canonical pathname after App Router navigation, while transient cross-graph actions should reuse an existing owner action and remove their URL intent before execution.

### Frontend route-island and performance validation

Purpose: extract Home without duplicating session, outbox, PWA or lesson lifecycle ownership and establish an evidence-backed bundle budget.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md`, `.agents/AGENTS.issue-247-request-scoped-fixtures.md`, `docs/frontend-bundle-budgets.md`, Issue #250.

Version or verification date: 2026-07-27.

Inputs: original `/` monolithic baseline 238,257 JavaScript bytes, persistent bootstrap architecture, exact Home Figma nodes and existing Active Lesson resume action.

Files inspected: `lexigo-bootstrapped-app.tsx`, `lexigo-premium-app.tsx`, `route-primary-navigation.tsx`, `routed-lexigo-app.tsx`, `async-state.tsx`, production-entry tests, Home/browser fixtures and route-bundle measurement code.

Actions performed: separated Home reads/presentation, added canonical route graph handoff, added a one-time lesson resume intent, and prepared deterministic source/E2E evidence with exact request scoping.

Commands or procedures: source-boundary analysis, fixture endpoint decomposition, syntax transpilation, Draft CI measurement, then exact budget update and immutable-head rerun.

Artifacts produced: `LexigoHomeApp`, `lesson-resume-intent`, Home route-island source test and Playwright journey tests.

Result: implementation prepared; exact bundle number intentionally remains unmodified until measured.

Failures: none classified in production code at this stage.

Root cause: not applicable.

Fallback: if the first Draft run exposes a fixture-only failure, narrow the exact request matcher without weakening runtime contracts; if runtime ownership fails, fix the same atomic branch before measurement promotion.

Limitations: Figma plugin mutation is not required; approved production nodes are already recorded and implementation preserves them.

Reusable lesson: never set a route-specific baseline from an estimate. First capture an exact controlled artifact on the new route graph, then lock both baseline and ceiling strictly below the replaced monolith.
