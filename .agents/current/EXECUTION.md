# Current Task Execution

## Task

- Branch: `test/issue-528-active-lesson-figma-parity`
- Base SHA: `336483615bf76e32100c52bb9317cb94ecc059b5`
- Head SHA: resolve from live branch ref
- PR:

## Skills used

### github

Purpose:

Repository/Issue/branch/file/CI inspection and guarded writes under the LexiGo Agent Harness for Issue #528.

Instruction source:

`skills://plugins/github/github/skill.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, task-specific `.agents/*` guidance and `docs/agent-harness.md`.

Version or verification date:

Verified for this task on 2026-08-15 Europe/Moscow.

Inputs:

Issue #528, umbrella #205, exact main SHA `336483615bf76e32100c52bb9317cb94ecc059b5`, repository-side Figma handoff, existing Active Lesson Figma and browser-zoom owners, focus-mode implementation contract and authoritative UI collection.

Files inspected:

- Agent Harness/root guidance and specialized contracts;
- `.agents/PROJECT_STATE.md`;
- `frontend/docs/adaptive-knowledge-coach.md`;
- `frontend/components/lexigo-active-lesson-app.tsx`;
- `frontend/e2e/active-lesson-figma.spec.ts`;
- `frontend/e2e/active-lesson-browser-zoom.spec.ts`;
- `frontend/e2e/support/active-lesson-fixture.ts`;
- `frontend/package.json`;
- `frontend/playwright.config.ts` / visual config as ownership evidence.

Actions performed:

- completed PR #526 runtime delivery and Stage validation;
- reconciled Agent Docs through docs-only PR #527, exact-main CI #3531 and skipped Stage deploy #3378;
- verified no open PRs and exact fresh `main` before starting new product/QA work;
- created Issue #528 and branch `test/issue-528-active-lesson-figma-parity`;
- constrained the slice to the five repository-approved Active Lesson nodes and excluded offline/result/scenario states;
- preserved existing behavior, history, real-zoom, reduced-motion, touch and accessibility owners;
- recorded that started focus mode intentionally hides primary route navigation;
- prepared a test-only canonical viewport/state parity extension plan.

Commands or procedures:

GitHub connector-first workflow. Every contents write uses the current blob SHA and explicit branch, followed by branch read-back and `main` SHA verification. No direct `main` write is permitted. Product merge requires immutable-head CI, review audit, expected-head squash merge, exact-main CI and Stage/public validation.

Artifacts produced:

Issue #528, task branch and current Agent Harness task/progress/execution evidence.

Result:

Preflight is complete. The next code mutation is limited to extending the existing Active Lesson Figma Playwright owner with exact canonical viewport/state annotations and geometry checks.

Failures:

Live Figma metadata/canvas inspection remains unavailable because the connected Figma MCP reached its Starter-plan tool-call limit.

Root cause:

External Figma plan quota, not a repository or application failure.

Fallback:

Use only the already-delivered repository-side canonical mapping from `frontend/docs/adaptive-knowledge-coach.md` and prior approved Issues; do not claim fresh Figma canvas inspection or mutation.

Limitations:

This slice can prove executable route/state parity against approved repository-side Figma evidence, but cannot claim a new live screenshot-versus-canvas approval while MCP access is blocked.

Reusable lesson:

For a mature route with strong existing behavioral owners, parity work should extend the existing Figma test owner with canonical provenance and viewport/state geometry rather than creating a second behavior suite or changing production code preemptively.
