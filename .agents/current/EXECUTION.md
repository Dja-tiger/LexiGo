# Current Task Execution

## Task

- Branch: `test/issue-624-webkit-preview-interception`
- Base SHA: `639e177ec7362544e42c7d0b77a5c7432bca8401`
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### GitHub CI repair

Purpose:

Diagnose and repair the exact-main CI blocker before continuing production dependency PR #621.

Instruction source:

`skills://plugins/github/gh-fix-ci/skill.md` plus repository Agent Harness.

Version or verification date:

2026-08-19.

Inputs:

CI run `32285020880`, latest rerun artifacts and Playwright traces.

Files inspected:

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `frontend/e2e/system-states.spec.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`

Actions performed:

Re-ran failed exact-main jobs without changing SHA, separated transient shard-1 timeout from reproducible shard-2 CORS failure, and narrowed the fix to route-history preview interception.

Commands or procedures:

Downloaded Playwright artifacts, inspected `error-context.md` and `trace.zip`, and verified request/response headers in the network trace.

Artifacts produced:

GitHub Issue #624 and branch `test/issue-624-webkit-preview-interception`.

Result:

Page-level preview interception now removes only browser-generated `Origin` and calls `route.fallback({ headers })`, leaving the canonical context fixture as response owner. Source contract locks this behavior.

Failures:

Pre-fix exact-main UI shard 2 reproduced WebKit access-control pageerrors.

Root cause:

WebKit CORS validation of a Playwright-fulfilled same-origin request crossing the page interception boundary.

Fallback:

If exact-head CI proves fallback chaining incompatible, revert the test-only branch and use another canonical fixture transport; do not weaken runtime-error assertions.

Limitations:

No local repository/network execution; GitHub Actions is the authoritative validation environment.

Reusable lesson:

For same-origin browser audits, avoid duplicating response ownership across page- and context-level Playwright routes when WebKit transport semantics can affect the fulfilled response.
