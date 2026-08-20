# Current Task Execution

## Task

- Branch: `test/issue-624-webkit-preview-interception`
- Base SHA: `639e177ec7362544e42c7d0b77a5c7432bca8401`
- Head SHA: resolve from live branch ref
- PR: #625

## Skills used

### GitHub CI repair

Purpose:

Diagnose and repair the exact-main CI blocker before continuing production dependency PR #621.

Instruction source:

`skills://plugins/github/gh-fix-ci/skill.md` plus repository Agent Harness.

Version or verification date:

2026-08-20.

Inputs:

Exact-main CI run `32285020880`, PR #625 runs including `32319950680` (`#3886`), and Playwright artifacts/traces.

Files inspected:

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `frontend/e2e/support/quality-gates.ts` via Playwright trace source snapshot
- `frontend/e2e/system-states.spec.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`

Actions performed:

Re-ran failed exact-main jobs without changing SHA, separated transient shard-1 timeout from reproducible shard-2 CORS failure, tested header/fetch-mode normalization, then removed the duplicate page-level lesson-preview interception after exact-head trace evidence disproved those normalizations.

Commands or procedures:

Downloaded `frontend-playwright-report-ui-2` artifact from run `32319950680`, inspected `error-context.md` and `trace.zip`, and verified the exact request/response snapshot for `POST /api/v1/lessons/preview`.

Artifacts produced:

GitHub Issue #624, Draft PR #625, branch `test/issue-624-webkit-preview-interception`, updated source contract, and exact-head Playwright evidence.

Result:

The route-history audit no longer registers any page-level route or Fetch wrapper for `/api/v1/lessons/preview`. `installQualityGateAPI(context)` is the sole response owner. The source contract explicitly forbids reintroducing a preview page route, fallback chaining, Fetch-mode wrapper, or local CORS response shim.

Failures:

Run `32319950680` (`#3886`) proved that `mode: "same-origin"` plus `route.fallback({ headers without origin })` was insufficient: WebKit still sent an Origin header, received a synthetic HTTP 200 from the context fixture, and emitted the access-control pageerror.

Root cause:

Duplicate page- and context-level interception of the same lesson-preview request leaves WebKit in an access-control validation path across Playwright interception chaining. The audit should have one canonical response owner only.

Fallback:

If canonical-context-only exact-head CI still fails, keep production code untouched and investigate a different test-harness transport while preserving strict runtime-error assertions and canonical fixture ownership.

Limitations:

GitHub Actions remains the authoritative browser validation environment; the final canonical-context-only fix is not considered complete until exact-head iOS WebKit and aggregate CI are green.

Reusable lesson:

For same-origin browser audits, do not layer page-level interception in front of an existing context fixture for the same request unless the test explicitly owns and validates the interception chain across all browser engines.
