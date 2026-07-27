# Current Task Execution

## Task

- Branch: `perf/issue-250-home-island`
- Base SHA: `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`
- Head SHA: resolve from live branch ref after final budget test correction
- PR: Draft PR #251

## Skills used

### GitHub repository operations

Purpose: reconstruct live state, publish Issue #250 only on its isolated branch and preserve immutable CI and measurement evidence.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`, GitHub plugin skill.

Version or verification date: 2026-07-27.

Inputs: live `main`, Issue #250, branch ref, Draft PR #251, PR #248/#249 evidence, Issue #12 deployment evidence, CI #2120, controlled measurement CI #2122 and final-budget CI #2130 diagnostics.

Files inspected: mandatory Agent Harness documents, README, architecture, Home Figma handoff, bootstrap/router/navigation sources, Home/Active Lesson implementation, route bundle tests/config, workflow upload conditions and relevant source/browser contracts.

Actions performed: resolved exact refs, compared ownership boundaries, published the Home route island, read changed paths back, opened Draft PR #251, classified CI failures, applied branch-only compatibility fixes, captured the exact Home route report, removed the temporary probe and corrected the original-budget invariant before final CI.

Commands or procedures: exact-ref connector reads; branch-only contents updates; per-path read-back; commit/run/job/artifact inspection; Playwright and frontend-core diagnostic extraction; exact report JSON parsing; source and budget contract updates.

Artifacts produced: Issue #250 branch implementation, source/unit/browser contracts, Draft PR #251, full behavioral CI #2120, controlled measurement artifact `8656783937`, frontend-core diagnostic artifact `8657142038` and populated current-task memory.

Result: the complete behavioral matrix is green on head `660983ec8773186a719c2f6a0f1317fa65723245`; exact Home measurement is 207,675 JavaScript bytes and 18 requests; permanent ceilings are 235,000 bytes and 21 requests; the measurement probe is absent from the final diff. Final CI #2130 found only an over-strict test comparator and did not expose a production or budget defect.

Failures: local Git clone/raw download could not resolve `github.com`; branch search API did not enumerate the valid exact ref; successful performance jobs did not upload the detailed report; route-island compatibility gaps affected PWA restore, lesson fixture state, Home header parity and Back/Forward history ownership; the first immutable-monolith helper compared every extracted route ceiling with the original measured transfer instead of the original release ceiling.

Root cause: isolated-container DNS restrictions; non-authoritative branch search indexing; workflow report upload guarded by failure; persistent launch ownership remained in the old graph; one fixture was not server-stateful; one reviewed presentation control was omitted; scroll snapshot writers replaced shared LexiGo history ownership state; transfer baseline and release ceiling were conflated in the generalized test helper.

Fallback: use exact GitHub connector operations and immutable Actions runs; obtain the report through one controlled post-report failure; restore the probe byte-for-byte; preserve server-like fixtures and shared History state construction; keep Home's stronger ceiling-below-transfer assertion separate from the reusable extracted-route release-limit helper.

Limitations: corrected final full CI, Ready transition, squash merge and exact-SHA stage/public validation remain pending on the final developer-authored head.

Reusable lesson: a successful route extraction requires both graph-boundary ownership proof and exact transfer evidence. Temporary measurement instrumentation must execute after report persistence, be artifact-backed and be removed byte-for-byte before final CI. Measured transfer and release ceiling are separate immutable comparison boundaries.

### Frontend route-island and performance validation

Purpose: extract Home without duplicating session, outbox, PWA or lesson lifecycle ownership and establish an evidence-backed bundle budget.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md`, `.agents/AGENTS.issue-247-request-scoped-fixtures.md`, `docs/frontend-bundle-budgets.md`, Issue #250.

Version or verification date: 2026-07-27.

Inputs: original `/` monolithic baseline 238,257 JavaScript bytes, original release ceiling 275,000 bytes, persistent bootstrap architecture, exact Home Figma nodes, reviewed visual baselines, existing Active Lesson resume action and controlled report artifact `8656783937`.

Files inspected: `lexigo-bootstrapped-app.tsx`, `lexigo-home-app.tsx`, `lexigo-premium-app.tsx`, `route-primary-navigation.tsx`, `routed-lexigo-app.tsx`, `navigation-history.ts`, `async-state.tsx`, production-entry tests, PWA/lesson/visual fixtures, route-bundle measurement code and budget invariants.

Actions performed: separated Home reads/presentation, added canonical graph handoff, added a one-time lesson resume intent, preserved standalone relaunch restoration, restored the reviewed streak control, made the lesson fixture persist the server-created active session, centralized History-owned graph preservation, locked the exact route budget and separated baseline-vs-ceiling invariant semantics.

Commands or procedures: source-boundary analysis; CI diagnostics; Playwright trace/error-context review; exact Figma/baseline comparison; full immutable-head run; controlled performance artifact capture; JSON report extraction; budget and documentation update; exact probe-blob restoration; frontend-core diagnostic artifact review.

Artifacts produced: `LexigoHomeApp`, `lesson-resume-intent`, Home route-island source test, Home journey tests, History regression contract, exact route report and permanent Home budget.

Result: CI #2120 proved frontend core, complete browser matrix, backend, containers and existing performance limits. Controlled CI #2122 measured `/` at 207,675 bytes and 18 requests. The new 235,000-byte/21-request ceilings are below the original measured Home transfer and retain 13.2% JavaScript headroom. The corrected reusable helper preserves existing Dictionary/Progress ceilings below the original 275,000-byte release limit.

Failures: the first successful performance pass exposed no downloadable report; PWA relaunch could not restore its route after Home extraction; a legacy lesson fixture returned 404 after POST; the Home header omitted the reviewed streak control; scroll snapshots removed `lexigoRouteGraph`; CI #2130 rejected the valid existing Progress ceiling because the helper compared it with 238,257 instead of 275,000.

Root cause: successful-report upload policy, ownership left in the compatibility graph, non-stateful cross-graph fixture, incomplete presentation extraction, multiple direct `replaceState` constructors and conflation of measured-transfer and release-limit constants.

Fallback: force one final assertion only after report persistence; move persistent launch restoration to `RoutedLexigoApp`; make fixtures server-like; restore reviewed presentation; require all History owners to use `createNavigationHistoryState`; assert Home's stronger ceiling separately.

Limitations: final CI must confirm the permanent budget without the probe and stage must deploy the exact squash merge SHA.

Reusable lesson: preserve immutable original monolithic constants outside any extracted route key and preserve their distinct meanings. Once `/` becomes an island, using it as the comparator weakens contracts; using the old transfer as every route's ceiling breaks previously valid bounded budgets.
