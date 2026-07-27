# Current Task Execution

## Task

- Issue: #257.
- Branch: `agent/issue-257-active-lesson-route-island`.
- Base SHA: `0bc5203da2487e947b860ce67a69cf04121cc3c8`.
- Head SHA: `bafae974213e89ea35774360f013a2e5447d1313` (pre-flight).
- PR: #258 (Draft).

## Skills used

### GitHub repository operations

Purpose: select and publish the next unblocked atomic production slice from live repository evidence.

Instruction source: `AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md`, `docs/agent-harness.md` and the GitHub plugin skill.

Version or verification date: final main `0bc5203da2487e947b860ce67a69cf04121cc3c8`, verified 2026-07-28.

Inputs: live main, open Issues/PRs/branches, Issues #115/#193/#194/#199/#257, CI #2199 and stage Issue #12.

Files inspected: mandatory Agent Harness, Project State, current templates, bootstrap route selection, compatibility graph, Active Lesson presentation/controller/tests and bundle budgets.

Actions performed: confirmed Phrases is design-blocked; selected Active Lesson as the next unblocked #115 slice; created Issue #257 and an isolated branch from exact main; recorded the pre-flight contract.

Commands or procedures: connector-first GitHub reads/writes, public exact-state verification, local `git` ref checks and repository-wide `rg` owner/consumer audit.

Artifacts produced: Issue #257, branch `agent/issue-257-active-lesson-route-island` and current task contract.

Result: task selection and pre-flight are complete; production implementation has not started.

Failures: none.

Root cause: not applicable.

Fallback: if the controller cannot be isolated without changing backend/outbox contracts, reduce to a shared typed Active Lesson controller boundary and keep the route on compatibility graph without claiming bundle completion.

Limitations: exact route transfer requires controlled Linux CI measurement after functional green.

Reusable lesson: when the next roadmap item is design-blocked, continue only with an independently approved atomic slice; do not infer missing Figma production states.

### Active Lesson route-island validation

Purpose: preserve approved Active Lesson/Result, API, history, offline and accessibility contracts while creating a smaller route entry.

Instruction source: Issues #115/#193/#194/#257, `.agents/AGENTS.progress-pr214.md`, frontend bundle-budget documentation and existing Active Lesson E2E fixtures.

Version or verification date: source at main `0bc5203da2487e947b860ce67a69cf04121cc3c8`, verified 2026-07-28.

Inputs: `LexigoPremiumApp` lesson controller, `ActiveLessonPresentation`, `LessonResultPresentation`, navigation/history helpers, review outbox and route-budget harness.

Files inspected: `lexigo-bootstrapped-app.tsx`, `lexigo-premium-app.tsx`, `routed-lexigo-app.tsx`, Active Lesson/Result libraries, source contracts, fixtures and browser suites.

Actions performed: mapped controller state, API mutations, completion snapshot, safe-exit and all downstream test consumers.

Commands or procedures: repository-wide symbol/path search and focused source reads.

Artifacts produced: scope/impact matrix in Issue #257 and current task files.

Result: independent-entry boundary selected; implementation pending.

Failures: none.

Root cause: not applicable.

Fallback: preserve the current route graph if functional equivalence or bundle isolation cannot be proven in one atomic slice.

Limitations: Phrases remains in `LexigoPremiumApp` and is not modified by this slice.

Reusable lesson: route-island completion requires an independent controller entry and measured graph boundary; a wrapper around the compatibility app is not sufficient.

### Functional implementation and browser reconciliation

Purpose: extract the Active Lesson controller without changing the approved presentation, server authority, offline owner or history guarantees.

Instruction source: Issues #193/#194/#257, repository harness and the merged Issue #254 safe-exit contract.

Version or verification date: local functional tree based on `bafae974213e89ea35774360f013a2e5447d1313`, verified 2026-07-28.

Inputs: existing premium controller behavior, shared Active Lesson/Result presentations, authorized JSON helper, product journey and navigation/history contracts.

Files inspected: bootstrap and routed shell, premium controller, Active Lesson/Result presentations, lesson libraries, route source tests and Playwright fixtures.

Actions performed: created the dedicated authenticated controller; added dynamic bootstrap selection; retained semantic ownership through transient pathname mutation; preserved immutable-event-state safe exit; reconciled focus ordering and confirmed-exit history replacement.

Commands or procedures:

- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run`
- `npm run build`
- `npx playwright test e2e/active-lesson-figma.spec.ts --project=desktop-chromium --project=desktop-webkit --project=android-chromium --project=ios-webkit`
- focused Lesson Result, offline outbox, adaptive navigation, app-router and account hydration Playwright suites
- `git diff --check`
- `bash scripts/ci/check-agent-harness.sh`

Artifacts produced: `lexigo-active-lesson-app.tsx`, its source contract, updated route-root ownership allowlist and retained-owner history contract.

Result: local functional gate is green: lint has zero errors, TypeScript/build pass, 440 unit tests pass, Active Lesson matrix is 32 passed/4 intentional skips, and the focused post-fix history loop passes.

Failures: initial Browser Back, desktop WebKit focus and post-exit Back expectations failed.

Root cause: mutable pathname incorrectly doubled as semantic owner; controller/presentation focus effects raced; safe exit pushed rather than replaced its protected history entry.

Fallback: revert the bootstrap selection to the compatibility graph if authoritative CI exposes a contract not covered by the focused suites.

Limitations: exact cold-route bytes and request count have not been measured on controlled Linux yet; no permanent budget change is claimed.

Reusable lesson: a route island needs a retained semantic owner separate from pathname so framework history observation cannot preempt a focused-flow exit contract.
