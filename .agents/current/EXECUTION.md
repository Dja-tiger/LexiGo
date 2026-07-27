# Current Task Execution

## Task

- Issue: #254.
- Branch: `agent/issue-254-learn-route-island`.
- Base SHA: `eeab812c6785ae9a92aee948ecb63729ab850932`.
- Head SHA: resolve from live branch ref.
- PR: pending Draft PR.

## Skills used

### GitHub repository operations

Purpose: inspect authoritative repository state and publish an isolated atomic slice safely.

Instruction source: `AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`, GitHub plugin skill.

Version or verification date: repository rules read from live `main` on 2026-07-27.

Inputs: live `main`, Issues #12/#115/#254, open PRs, stage evidence, route-entry source and architecture docs.

Files inspected: mandatory Agent Harness files, README, architecture, `lexigo-bootstrapped-app.tsx`, `lexigo-premium-app.tsx`, Lesson Composer shell and related source contracts.

Actions performed: reconciled PROJECT_STATE in PR #253; created Issue #254; created the product branch from exact live `main`; recorded task scope and pre-flight.

Commands or procedures: connector-first GitHub reads/writes, exact branch/ref on every mutation, readback after writes, base/head compare and immutable-head CI workflow.

Artifacts produced: Issue #254, branch `agent/issue-254-learn-route-island`, current task contract.

Result: product slice is active with no runtime code changed yet.

Failures: an initially unverified PR #252 head was written during the preceding documentation reconciliation.

Root cause: the handoff summary did not contain the exact PR #252 head and the value was not fetched before the first documentation write.

Fallback: merge was stopped, live PR metadata and workflow evidence were fetched, the exact head `008d53014e690ab0c314b5c706489988ab5ba29f` was written, and final lightweight CI passed before merge.

Limitations: local checkout and local tests are unavailable because the execution container cannot resolve GitHub; repository CI and connector source inspection are authoritative.

Reusable lesson: never persist an immutable head from handoff inference; fetch exact PR metadata before documentation writes.

### Frontend route-island validation

Purpose: preserve runtime ownership, navigation history, accessibility, PWA and performance contracts while extracting `/learn`.

Instruction source: `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md`, `.agents/SKILLS.md`, Issue #115 and Issue #254.

Version or verification date: repository rules verified 2026-07-27.

Inputs: current dynamic entries, route-graph history state, Lesson Composer state/API flows and browser acceptance matrix.

Files inspected: `frontend/components/lexigo-bootstrapped-app.tsx`, `frontend/components/lexigo-premium-app.tsx`, `frontend/components/lesson-composer-progressive-shell.tsx`, route-island source contracts and E2E discovery results.

Actions performed: mapped Learn-owned preview/create/resume/discard behavior and identified the monolithic state boundary.

Commands or procedures: source ownership audit, direct-entry/cross-island contract reconstruction, request/consumer matrix and planned exact bundle measurement.

Artifacts produced: Issue #254 acceptance criteria and `.agents/current/TASK.md`.

Result: implementation boundary selected; code extraction pending.

Failures: none.

Root cause: not applicable.

Fallback: if a complete safe extraction cannot preserve Active Lesson handoff in one slice, reduce to a shared typed Learn controller boundary without claiming the route island complete.

Limitations: exact transfer values require a controlled CI measurement after implementation.

Reusable lesson: a dynamic wrapper that still imports the compatibility graph is not a route island and cannot establish a smaller bundle boundary.

### Active Lesson Browser Back reconciliation

Purpose: make Browser Back reliably invoke the Active Lesson safe-exit contract without losing the exact URL, Next framework history state or the previous Learn entry.

Instruction source: `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.progress-pr214-ci1732.md`, Issue #254, Draft PR #255 and CI #2193 artifacts.

Version or verification date: PR head `6040a2680d61209d8ca527db0f00dfbd3ca73db2`, CI run `30309200166`, verified 2026-07-28.

Inputs: failed desktop Chromium/WebKit, Android Chromium and iOS WebKit traces; local production build with Next.js `16.2.11`; Active Lesson and adaptive-navigation fixtures.

Files inspected: `frontend/components/routed-lexigo-app.tsx`, `active-lesson-presentation.tsx`, `lexigo-premium-app.tsx`, `lexigo-bootstrapped-app.tsx`, `lexigo-learn-app.tsx`, focused source contracts and Playwright specs.

Actions performed: reproduced the exact failure locally; separated stale App Router route state from actual URL/DOM ownership; discovered the organic adjacent Active Lesson history entry; implemented immutable-state push/replace branching and semantic-owner `requestAnimationFrame` delivery.

Commands or procedures: exact CI artifact download and trace inspection; `npm ci`; focused Vitest; production build; one targeted Chromium reproduction; four-project Browser Back matrix; complete adaptive-navigation save-and-exit history assertion.

Artifacts produced: updated route shell, source contract and Agent Harness failure-category evidence.

Result: both the direct Learn target and duplicate Active Lesson target open the safe-exit dialog; confirmed exit leaves Back pointing to `/learn`; no duplicate review submit occurs.

Failures: the first local browser rerun used stale `.next` output; the first semantic-owner fix left a duplicate Active Lesson entry behind after confirmed exit.

Root cause: application source changed without rebuilding the `next start` artifact; then unconditional `pushState` preserved an already-focused target that needed to be collapsed.

Fallback: no retry or timeout fallback was retained. Rebuild before Playwright, then choose `replaceState` only for immutable lesson targets and `pushState` for lower-route targets.

Limitations: full repository CI is still required on the new immutable developer-authored head before bundle measurement.

Reusable lesson: after intercepted App Router `popstate`, route safety must use immutable history state plus the actual semantic owner; stale `usePathname()` is not a delivery barrier, and duplicate focused entries require replacement rather than another push.
