# Current Task Execution

## Task

- Branch: `test/issue-528-active-lesson-figma-parity`
- Base SHA: `336483615bf76e32100c52bb9317cb94ecc059b5`
- Head SHA: resolve from live branch ref
- PR: #529 — `test(figma): add canonical Active Lesson parity contract`

## Skills used

### github

Purpose:

Repository/Issue/branch/file/CI inspection and guarded writes under the LexiGo Agent Harness for Issue #528.

Instruction source:

`skills://plugins/github/github/skill.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, task-specific `.agents/*` guidance and `docs/agent-harness.md`.

Version or verification date:

Verified for this task on 2026-08-15 Europe/Moscow.

Inputs:

Issue #528, umbrella #205, exact main SHA `336483615bf76e32100c52bb9317cb94ecc059b5`, repository-side Figma handoff, existing Active Lesson Figma/browser-zoom owners, focus-mode implementation contract and authoritative UI collection.

Files inspected:

- Agent Harness/root guidance and specialized contracts;
- `.agents/PROJECT_STATE.md`;
- `frontend/docs/adaptive-knowledge-coach.md`;
- `frontend/components/lexigo-active-lesson-app.tsx`;
- `frontend/e2e/active-lesson-figma.spec.ts` before and after the Issue #528 mutation;
- `frontend/e2e/active-lesson-browser-zoom.spec.ts`;
- `frontend/e2e/support/active-lesson-fixture.ts`;
- `frontend/e2e/learn-route-island.spec.ts` as the approved #205 parity pattern;
- `frontend/package.json`;
- `frontend/playwright.config.ts` / visual config as ownership evidence.

Actions performed:

- completed PR #526 runtime delivery and Stage validation;
- reconciled Agent Docs through docs-only PR #527, exact-main CI #3531 and skipped Stage deploy #3378;
- verified no open PRs and exact fresh `main` before starting new product/QA work;
- created Issue #528 and branch `test/issue-528-active-lesson-figma-parity`;
- constrained the slice to the five repository-approved Active Lesson nodes and excluded offline/result/scenario states;
- preserved existing behavior, history, real-zoom, reduced-motion, touch and accessibility owners;
- extended the existing `active-lesson-figma.spec.ts` rather than introducing a competing test owner;
- added ten canonical cases: five approved nodes × Light/Dark semantic appearance;
- encoded exact mobile `390x844` and desktop `1440x1024` viewport contracts;
- added exact `figma` annotations for `75:6`, `75:30`, `75:89`, `75:120` and `75:150`;
- added deterministic transitions to Recall Correct and Choice Incorrect using the existing request-scoped fixture;
- asserted active route-island, focus-mode, main-content and lesson geometry, semantic canvas token, no horizontal overflow and intentional absence of primary route navigation while the lesson is started;
- audited `frontend/package.json` and proved the existing spec is already part of authoritative `test:e2e:ui`, lesson and a11y collections, so no package/workflow mutation is needed;
- read back the test mutation and verified `main` remained unchanged after each branch write;
- opened PR #529 from the exact task branch with `Closes #528` and parent #205 linkage.

Commands or procedures:

GitHub connector-first workflow. Every contents write uses the current blob SHA and explicit branch, followed by branch read-back and `main` SHA verification. No direct `main` write is permitted. Product merge requires immutable-head CI, review audit, expected-head squash merge, exact-main CI and Stage/public validation.

Artifacts produced:

Issue #528, PR #529, task branch, extended `frontend/e2e/active-lesson-figma.spec.ts`, and current Agent Harness task/progress/execution evidence.

Result:

The implementation candidate is test-only. It adds executable canonical state/viewport provenance without production React/CSS, visual baseline, package, Playwright configuration, CI workflow, backend or dependency changes. The next gate is full immutable-head PR CI.

Failures:

Live Figma metadata/canvas inspection remains unavailable because the connected Figma MCP reached its Starter-plan tool-call limit. No repository or application failure has been observed before CI.

Root cause:

External Figma plan quota for live canvas access; the prior Active Lesson suite also lacked final #205 canonical node/viewport provenance because it predated the route-by-route parity audit.

Fallback:

Use only the already-delivered repository-side canonical mapping from `frontend/docs/adaptive-knowledge-coach.md`; do not claim fresh Figma canvas inspection or mutation. Validate executable parity through the existing request-scoped browser fixture and repository CI.

Limitations:

This slice can prove executable route/state parity against approved repository-side Figma evidence, but cannot claim a new live screenshot-versus-canvas approval while MCP access is blocked. Existing visual snapshots remain untouched.

Reusable lesson:

For a mature route with strong existing behavioral owners, parity work should extend the existing Figma test owner with canonical provenance and viewport/state geometry. Also audit the repository's explicit Playwright allow-list before adding any package change: here the Active Lesson owner was already authoritative, so changing collection configuration would have been unnecessary scope expansion.
