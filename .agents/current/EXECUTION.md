# Current Task Execution

## Task

- Branch: `perf/issue-250-home-island`
- Base SHA: `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`
- Head SHA: resolve from live branch ref after final budget commit
- PR: Draft PR #251

## Skills used

### GitHub repository operations

Purpose: reconstruct live state, publish Issue #250 only on its isolated branch and preserve immutable CI and measurement evidence.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`, GitHub plugin skill.

Version or verification date: 2026-07-27.

Inputs: live `main`, Issue #250, branch ref, Draft PR #251, PR #248/#249 evidence, Issue #12 deployment evidence, CI #2120 and controlled measurement CI #2122.

Files inspected: mandatory Agent Harness documents, README, architecture, Home Figma handoff, bootstrap/router/navigation sources, Home/Active Lesson implementation, route bundle tests/config, workflow upload conditions and relevant source/browser contracts.

Actions performed: resolved exact refs, compared ownership boundaries, published the Home route island, read changed paths back, opened Draft PR #251, classified CI failures, applied branch-only compatibility fixes, captured the exact Home route report and removed the temporary probe before final CI.

Commands or procedures: exact-ref connector reads; branch-only contents updates; per-path read-back; commit/run/job/artifact inspection; Playwright report extraction; exact report JSON parsing; source and budget contract updates.

Artifacts produced: Issue #250 branch implementation, source/unit/browser contracts, Draft PR #251, full behavioral CI #2120, controlled measurement artifact `8656783937` and populated current-task memory.

Result: the complete behavioral matrix is green on head `660983ec8773186a719c2f6a0f1317fa65723245`; exact Home measurement is 207,675 JavaScript bytes and 18 requests; permanent ceilings are 235,000 bytes and 21 requests; the measurement probe is absent from the final diff.

Failures: local Git clone/raw download could not resolve `github.com`; branch search API did not enumerate the valid exact ref; successful performance jobs did not upload the detailed report; route-island compatibility gaps affected PWA restore, lesson fixture state, Home header parity and Back/Forward history ownership.

Root cause: isolated-container DNS restrictions; non-authoritative branch search indexing; workflow report upload guarded by failure; persistent launch ownership remained in the old graph; one fixture was not server-stateful; one reviewed presentation control was omitted; scroll snapshot writers replaced shared LexiGo history ownership state.

Fallback: use exact GitHub connector operations and immutable Actions runs; obtain the report through one controlled post-report failure; restore the probe byte-for-byte; preserve server-like fixtures and shared History state construction.

Limitations: final full CI, Ready transition, squash merge and exact-SHA stage/public validation remain pending on the final developer-authored head.

Reusable lesson: a successful route extraction requires both graph-boundary ownership proof and exact transfer evidence. Temporary measurement instrumentation must execute after report persistence, be artifact-backed and be removed byte-for-byte before final CI.

### Frontend route-island and performance validation

Purpose: extract Home without duplicating session, outbox, PWA or lesson lifecycle ownership and establish an evidence-backed bundle budget.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md`, `.agents/AGENTS.issue-247-request-scoped-fixtures.md`, `docs/frontend-bundle-budgets.md`, Issue #250.

Version or verification date: 2026-07-27.

Inputs: original `/` monolithic baseline 238,257 JavaScript bytes, persistent bootstrap architecture, exact Home Figma nodes, reviewed visual baselines, existing Active Lesson resume action and controlled report artifact `8656783937`.

Files inspected: `lexigo-bootstrapped-app.tsx`, `lexigo-home-app.tsx`, `lexigo-premium-app.tsx`, `route-primary-navigation.tsx`, `routed-lexigo-app.tsx`, `navigation-history.ts`, `async-state.tsx`, production-entry tests, PWA/lesson/visual fixtures, route-bundle measurement code and budget invariants.

Actions performed: separated Home reads/presentation, added canonical graph handoff, added a one-time lesson resume intent, preserved standalone relaunch restoration, restored the reviewed streak control, made the lesson fixture persist the server-created active session, centralized History-owned graph preservation and locked the exact route budget.

Commands or procedures: source-boundary analysis; CI diagnostics; Playwright trace/error-context review; exact Figma/baseline comparison; full immutable-head run; controlled performance artifact capture; JSON report extraction; budget and documentation update; exact probe-blob restoration.

Artifacts produced: `LexigoHomeApp`, `lesson-resume-intent`, Home route-island source test, Home journey tests, History regression contract, exact route report and permanent Home budget.

Result: CI #2120 proved frontend core, complete browser matrix, backend, containers and existing performance limits. Controlled CI #2122 measured `/` at 207,675 bytes and 18 requests. The new 235,000-byte/21-request ceilings are below the original monolithic boundary and retain 13.2% JavaScript headroom.

Failures: the first successful performance pass exposed no downloadable report; PWA relaunch could not restore its route after Home extraction; a legacy lesson fixture returned 404 after POST; the Home header omitted the reviewed streak control; scroll snapshots removed `lexigoRouteGraph`.

Root cause: successful-report upload policy, ownership left in the compatibility graph, non-stateful cross-graph fixture, incomplete presentation extraction and multiple direct `replaceState` constructors.

Fallback: force one final assertion only after report persistence; move persistent launch restoration to `RoutedLexigoApp`; make fixtures server-like; restore reviewed presentation; require all History owners to use `createNavigationHistoryState`.

Limitations: final CI must confirm the permanent budget without the probe and stage must deploy the exact squash merge SHA.

Reusable lesson: preserve immutable original monolithic constants outside any extracted route key. Once `/` becomes an island, using it as the comparator silently weakens or invalidates contracts for other route islands.
