# Current Task Execution

## Task

- Issue: #70
- Branch: `test/issue-70-final-fallback-inventory`
- Base SHA: `ec3d3f05f97a61b4600abc2d5947726d599e8618`
- PR: pending

## Skills and procedures

### GitHub repository operations

Purpose: add an executable inventory for the final live compatibility fallback without changing runtime or CSS.

Instruction sources: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.issue-70-compatibility-reachability.md`, `.agents/AGENTS.tool-selection.md`, `.agents/AGENTS.issue-261-css-specificity.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**`, `docs/agent-harness.md`, Issue #70 and `frontend/docs/compatibility-cleanup.md`.

Inputs: live main `ec3d3f05…`, PR #318 deletion patch, canonical `lexigo-learn-app.tsx`, final `lexigo-premium-app.tsx` dispatch and bootstrap render order.

Actions performed:

- reconciled stale PROJECT_STATE through PR #323 before starting product work;
- audited removed Learn markup against repository consumers;
- rejected CSS deletion because canonical Learn still consumes the selectors;
- created `compatibility-fallback-source.test.ts` to protect route precedence, retired presentation absence and live fallback owners;
- populated current task memory and froze the allow-list.

## Failure / deviation

The source contract was written before current task memory was populated.

Root cause: the audit transitioned into implementation before the pre-flight record write boundary was re-checked.

Impact: limited to one new source-test file on the correct non-default branch. No runtime, CSS, workflow or main ref changed.

Prevention: no further write until TASK, PROGRESS, EXECUTION and the source test are read back; final diff must contain exactly the four allow-listed paths.

## Validation plan

- read-back and branch/main comparison;
- source contract through the frontend unit suite;
- lint, TypeScript, production build and dependency audit;
- full browser/accessibility/performance/container CI because this is a product test contract, not Agent Docs only;
- review audit, expected-head squash merge and exact-SHA stage/public validation.

## Rollback

Revert all branch commits. Runtime and presentation remain unchanged.
