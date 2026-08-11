# Current Task Execution

## Task

- Branch: `feat/issue-66-system-copy-review`
- Base SHA: `c675cde343c582349b78c74cb86dc2bd07237fc0`
- Head SHA: resolve from live branch ref
- PR: #471

## Skills used

### GitHub repository workflow

Purpose:

Inspect live repository/Issue/CI state, enforce atomic branch safety, edit through explicit branch refs, publish PR, verify immutable-head CI and perform guarded merge/deployment validation.

Instruction source:

- root `AGENTS.md`
- `.agents/AGENTS.md` and indexed Agent Harness instructions
- `docs/agent-harness.md`
- installed GitHub plugin skills `skills://plugins/github/github/skill.md` and `skills://plugins/github/gh-fix-ci/skill.md`

Version or verification date:

2026-08-11.

Inputs:

- Issue #66 acceptance criteria and issue comments after PRs #157/#159.
- Live `main` SHA `c675cde343c582349b78c74cb86dc2bd07237fc0`.
- Current `interface-copy`, async-state, route boundaries, Home/Learn/Active Lesson/compatibility owners and blocking Playwright scripts.
- PR #471 immutable-head Actions run `31469006656` and its two Playwright report artifacts.

Files inspected:

- `frontend/lib/interface-copy.ts`
- `frontend/lib/interface-copy.test.ts`
- `frontend/lib/lesson-composition.ts`
- `frontend/lib/learning.ts`
- `frontend/lib/account-resources.ts`
- `frontend/components/async-state.tsx`
- `frontend/components/lexigo-home-app.tsx`
- `frontend/components/lexigo-learn-app.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/system-states-contract.test.ts`
- `frontend/app/error.tsx`
- `frontend/app/global-error.tsx`
- `frontend/app/not-found.tsx`
- `frontend/e2e/interface-copy.spec.ts`
- `frontend/e2e/app-router-routes.spec.ts`
- `frontend/e2e/async-states.spec.ts`
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/package.json`
- `docs/frontend-async-states.md`
- Playwright `error-context.md`, screenshots/traces inventory and reports from both failed UI shards.

Actions performed:

- Verified Issue #66 is open and has no competing open PR.
- Reconciled prior stale Agent Harness state in separate docs-only PR #470 before starting product work; post-merge docs CI #3184 succeeded.
- Audited final #66 residual scope and identified generic state/action copy ownership gaps plus real Home lesson-source drift.
- Created exact-base feature branch and initialized task-local Agent Harness state.
- Extended `interface-copy` with canonical lesson-source labels, generic async-state eyebrows and recovery/action labels.
- Converted `AsyncStatePanel` to the canonical state/action contract while preserving semantic roles, focus, retry behavior, correlation IDs and resume intent.
- Converted route/root error boundaries and 404 to canonical retry/home labels.
- Removed Home's local `sourceLabel` implementation; dynamic active-lesson copy now calls `lessonSourceLabel` and uses the canonical `Продолжить урок` action.
- Added unit coverage for every new mapping.
- Added `interface-copy-ownership-source.test.ts` to fail closed on local Home label ownership, state/action literal drift and known Learn/Active/fallback lesson-source divergence.
- Expanded blocking `interface-copy.spec.ts` with an actual `travel` active lesson on Home, Learn label checks and canonical 404 home CTA evidence.
- Preserved `Academic Technical English` as intentional course-facing content with existing Russian explanatory copy.
- Published Draft PR #471 and inspected immutable-head CI rather than retrying failed browser jobs blindly.
- Downloaded both Playwright report artifacts from run `31469006656` and classified the two deterministic failures as stale test/mock defects, not product regressions or infrastructure flakes.
- Updated `app-router-routes.spec.ts` to assert the intentional `На главную` 404 CTA.
- Removed the Home-only page route for `/api/v1/lessons/active` before the Learn step in `interface-copy.spec.ts`, allowing the context-level quality fixture to restore the canonical no-active-lesson state before composer assertions.

Commands or procedures:

Connector-first GitHub reads/writes with exact refs; read-back after repository writes; verify `main` remains unchanged during branch edits; compare exact base/head before PR publication; Actions artifact inspection for failed Playwright shards.

Artifacts produced:

- Branch `feat/issue-66-system-copy-review`.
- Draft PR #471.
- Canonical `interface-copy` extensions.
- Source ownership regression contract.
- Blocking Playwright copy-consistency scenario.
- CI repair for stale 404 assertion and leaked active-lesson fixture.
- Task-local Agent Harness records.

Result:

The first immutable-head CI established that lint/type/unit/build/security were healthy and isolated failures to the blocking UI collection. Artifact inspection identified two test-harness defects caused directly by the intentional copy change and fixture leakage. Both were repaired without modifying production behavior, increasing timeouts, weakening selectors, skipping browser projects or updating snapshots. New immutable-head CI is required before any green/Ready/merge claim.

Failures:

- Run `31469006656`, UI shard 1/2 and 2/2: `app-router-routes.spec.ts` expected the removed CTA `Открыть главную` while runtime correctly rendered `На главную`.
- Run `31469006656`, UI shard 2/2: `interface-copy.spec.ts` leaked its Home active-lesson page fixture into `/learn`, so composer radio controls were correctly absent behind unfinished-lesson recovery UI.

Root cause:

Issue #66 residual product drift came from copy ownership ending at glossary/topic/status terms while lesson-source and generic state/action labels remained duplicated in route-local code. The first CI repair additionally exposed stale regression consumers: one old literal assertion and one request fixture whose lifetime exceeded the state it was intended to prove.

Fallback:

Use GitHub App connector for source reads/writes, PR/CI diagnostics and exact-SHA delivery gates. If CI fails, diagnose the exact failed job/log/artifact and change only the responsible owner without weakening user-facing assertions.

Limitations:

Do not claim local execution. Only CI jobs actually selected and completed on the exact final head count as acceptance evidence.

Reusable lesson:

When a UX-writing contract already exists, final cleanup should centralize dynamic/repeated copy at the existing owner and use source/browser contracts to pin intentionally retained route-local presentation. Browser fixtures must be request/state scoped: a fixture used to prove an active Home state must be removed before asserting the no-active Learn composer, and existing semantic route assertions must be synchronized when an accessible name changes intentionally.
