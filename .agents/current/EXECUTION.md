# Current Task Execution

## Task

- Branch: `perf/issue-250-home-island`
- Base SHA: `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`
- Head SHA: resolve from live branch ref after the current compatibility commits
- PR: Draft PR #251

## Skills used

### GitHub repository operations

Purpose: reconstruct live state, publish Issue #250 only on its isolated branch and preserve immutable CI evidence.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`, GitHub plugin skill.

Version or verification date: 2026-07-27.

Inputs: live `main`, Issue #250, branch ref, Draft PR #251, PR #248/#249 evidence, Issue #12 deployment evidence and CI runs #2088/#2090/#2092.

Files inspected: mandatory Agent Harness documents, README, architecture, Home Figma handoff, bootstrap/router/navigation sources, Home/Active Lesson implementation, route bundle tests/config, workflow upload conditions and relevant source/browser contracts.

Actions performed: resolved exact refs, compared ownership boundaries, published the Home route island, read every changed path back, opened Draft PR #251, classified each CI failure from artifacts and applied branch-only compatibility fixes.

Commands or procedures: exact-ref connector reads; branch-only contents updates; per-path read-back; `compare_commits(main, branch)`; workflow job/step inspection; artifact download and Playwright report analysis; Figma screenshot verification for reviewed visual ownership.

Artifacts produced: Issue #250 branch implementation, source/unit/browser contracts, Draft PR #251 and populated current-task memory.

Result: core quality and most browser shards are green; PWA, lesson fixture and visual compatibility fixes are published for the next immutable-head run.

Failures: local Git clone/raw download could not resolve `github.com`; branch search API did not enumerate the valid exact ref; Git tree creation required a tree SHA rather than a commit SHA; successful performance jobs do not upload the detailed report under the current workflow condition.

Root cause: isolated-container DNS restrictions; non-authoritative branch search indexing; GitHub Git Data API contract; workflow report upload is guarded by `if: failure()`.

Fallback: use exact GitHub connector operations and immutable Actions runs; verify exact refs through direct file reads; rely on PR squash for the final atomic commit; obtain the final performance report through a controlled measurement-only failure rather than infer a number.

Limitations: complete frontend execution is available only in repository CI; successful performance runs do not expose the exact route report without a controlled failure.

Reusable lesson: route graph transitions must be driven by canonical pathname after App Router navigation, while persistent launch behavior such as standalone PWA restoration belongs above individual route islands.

### Frontend route-island and performance validation

Purpose: extract Home without duplicating session, outbox, PWA or lesson lifecycle ownership and establish an evidence-backed bundle budget.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md`, `.agents/AGENTS.issue-247-request-scoped-fixtures.md`, `docs/frontend-bundle-budgets.md`, Issue #250.

Version or verification date: 2026-07-27.

Inputs: original `/` monolithic baseline 238,257 JavaScript bytes, persistent bootstrap architecture, exact Home Figma nodes, reviewed visual baselines and existing Active Lesson resume action.

Files inspected: `lexigo-bootstrapped-app.tsx`, `lexigo-home-app.tsx`, `lexigo-premium-app.tsx`, `route-primary-navigation.tsx`, `routed-lexigo-app.tsx`, `async-state.tsx`, production-entry tests, PWA/lesson/visual fixtures and route-bundle measurement code.

Actions performed: separated Home reads/presentation, added canonical graph handoff, added a one-time lesson resume intent, preserved standalone relaunch restoration, restored the reviewed streak control and made the lesson fixture persist the server-created active session.

Commands or procedures: source-boundary analysis; CI diagnostics; Playwright trace/error-context review; exact Figma/baseline comparison; immutable-head reruns; controlled performance artifact capture; final budget update and immutable-head validation.

Artifacts produced: `LexigoHomeApp`, `lesson-resume-intent`, Home route-island source test, Home journey tests and compatibility updates to PWA/lesson contracts.

Result: CI #2092 proved lint, typecheck, 418 unit tests, build, audit, backend, dependency review, accessibility and performance. Three browser compatibility gaps were classified and fixed without weakening production behavior.

Failures: the first performance pass had no uploaded exact report; PWA relaunch could not restore its route after Home extraction; a legacy lesson fixture returned 404 after POST; the Home header omitted the reviewed streak control.

Root cause: ownership remained in the old compatibility graph, the fixture was not stateful across route graphs, and the extracted presentation missed one header element.

Fallback: move persistent launch restoration to `RoutedLexigoApp`; make fixtures server-like; restore reviewed presentation rather than promote a new visual hash; force a single measurement-only failure after behavioral CI is green.

Limitations: Figma mutation is not required; approved production nodes remain unchanged. Final budget values remain intentionally unset until the exact report is captured.

Reusable lesson: cross-graph browser fixtures must preserve server-owned state between POST and subsequent GET. Never set a route-specific baseline from an estimate; capture the exact controlled artifact first.
