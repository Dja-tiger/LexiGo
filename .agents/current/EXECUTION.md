# Current Task Execution

## Task

- Issue: #626
- Branch: `test/issue-626-webkit-preview-cors-fixture`
- Base SHA: `b40bbbfde951797ba712e63b9d940fbdb30d9694`
- Head SHA: resolve from live branch ref after each write
- PR: pending publication

## Skills used

### GitHub CI repair

Purpose:

Diagnose and repair the reproducible post-merge iOS WebKit route-history failure without changing production runtime.

Instruction source:

`skills://plugins/github/github/skill.md`, repository `.agents/SKILLS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.issue-247-request-scoped-fixtures.md` and `docs/agent-harness.md`.

Version or verification date:

2026-08-20.

Inputs:

- exact-main CI #3892 / run `32324897382` on `b40bbbfde951797ba712e63b9d940fbdb30d9694`;
- failing UI job `96294381319`;
- Playwright artifact `9391193804` (`frontend-playwright-report-ui-2`);
- exact failure traces for `learn` Light/Dark on `ios-webkit`;
- PR #625 diff and exact current `quality-gates.ts` source.

Files inspected:

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/**`
- PR #625 diff and Actions evidence.

Actions performed:

1. Downloaded and unpacked the failed post-merge Playwright report.
2. Classified the report: two final unexpected `learn` iOS WebKit failures, one independent retry-passing Phrases flake.
3. Extracted the exact `quality-gates.ts` source snapshot from the failing trace and verified its Git blob SHA `636db392a1abac26c4056b803827c6a37e778429` against live GitHub.
4. Compared PR #625's previous page-route CORS experiment with the canonical context fixture and established that response metadata had been attached to a fallback observer rather than the route that fulfilled HTTP 200.
5. Created Issue #626 and an isolated branch from exact `main`.
6. Extended canonical JSON fulfillment with optional response headers.
7. Added request-derived exact-origin CORS response metadata and local `OPTIONS` handling only to the canonical lesson-preview fixture.
8. Added a fail-closed source contract proving single response ownership, exact-origin metadata and wildcard-origin absence.
9. Updated the existing request-scoped fixture rule with the confirmed interception/fulfillment ownership failure category.

Commands or procedures:

GitHub connector for live refs, issue/branch creation, exact file writes/reads and branch compare; GitHub Actions artifact download; local ZIP/trace inspection and Git blob hashing for source provenance.

Artifacts produced:

- Issue #626;
- branch `test/issue-626-webkit-preview-cors-fixture`;
- canonical fixture transport fix;
- source regression contract;
- Agent Harness failure-prevention record.

Result:

Implementation is complete at source level. `installQualityGateAPI(context)` remains the only lesson-preview response owner for the route-history audit, and the response it actually fulfills now carries request-derived WebKit-compatible CORS metadata. Production runtime/backend/design owners are unchanged.

Failures:

The pre-fix post-merge run reproducibly failed both iOS WebKit Learn history cases on run and retry with access-control pageerrors. No post-fix CI result is claimed until the Draft PR immutable-head run completes.

Root cause:

Interception ownership and response-metadata ownership had diverged. The duplicate page route removed by PR #625 was not the final response owner, while the remaining context fixture fulfilled the response without CORS metadata. WebKit validated the actual fulfilled response and rejected it.

Fallback:

If immutable-head iOS WebKit still reproduces the same access-control error, do not change production code or weaken runtime-error assertions. Inspect the new trace's request/response headers and transport mode, then test the next fixture-layer hypothesis in the same atomic Issue scope.

Limitations:

The local runtime does not contain a full repository checkout or installed frontend dependency graph. GitHub Actions remains authoritative for Vitest/TypeScript/Playwright and cross-browser validation.

Reusable lesson:

A Playwright route that calls `fallback` does not own response metadata. Cross-browser response headers must be emitted by the route that actually fulfills the intercepted request, with one canonical fulfillment owner per mocked request contract.
