# Current Task Execution

## Task

- Issue: #626
- Branch: `test/issue-626-webkit-preview-cors-fixture`
- Base SHA: `b40bbbfde951797ba712e63b9d940fbdb30d9694`
- Head SHA: resolve from live branch ref after each write
- PR: #627

## Skills used

### GitHub CI repair

Purpose:

Diagnose and repair the reproducible post-merge iOS WebKit route-history failure without changing production runtime or weakening browser evidence.

Instruction source:

`skills://plugins/github/github/skill.md`, repository `.agents/SKILLS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.issue-247-request-scoped-fixtures.md` and `docs/agent-harness.md`.

Version or verification date:

2026-08-20.

Inputs:

- exact-main CI #3892 / run `32324897382` on `b40bbbfde951797ba712e63b9d940fbdb30d9694`;
- PR #627 exact-head CI #3896 / run `32367998836` on `534d2a4f7009b68cdf52b71c9885bdde2819fba4`;
- failed UI jobs `96294381319` and `96422373605`;
- Playwright artifacts `9391193804` and `9406348780`;
- exact iOS WebKit route-history traces;
- `LexigoLearnApp` source showing the 120 ms authenticated preview debounce and CTA disabled state.

Files inspected:

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `frontend/components/lexigo-learn-app.tsx`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/**`
- PR #625/#627 diffs and Actions evidence.

Actions performed:

1. Downloaded and unpacked the failed post-merge and PR Playwright reports.
2. Verified the original source provenance against live Git blob `636db392a1abac26c4056b803827c6a37e778429`.
3. Tested the hypothesis that WebKit required CORS metadata on the canonical context fulfillment; source/unit/core gates passed but exact-head UI shard 2 reproduced the pageerror.
4. Inspected exact #3896 trace timing and network data. The failed preview attempts had no preview resource snapshot and no preview `Route.fulfill` call.
5. Correlated each pageerror with navigation initiated only milliseconds earlier: reload `358144.013` → error `358161.713`; transit `358867.853` → error `358893.779`; Forward `360344.369` → error `360367.897`.
6. Read `LexigoLearnApp` and confirmed the authenticated preview is intentionally scheduled after 120 ms and that both desktop/compact start CTAs remain disabled until `matchingLessonPreview` resolves.
7. Rejected the CORS-response hypothesis and restored `frontend/e2e/support/quality-gates.ts` byte-for-byte to the `main` blob.
8. Changed only route-history acceptance lifecycle: Learn semantic readiness now waits for the layout-correct enabled start CTA before the test performs the next navigation.
9. Added a fail-closed source contract for responsive CTA selection, enabled-state readiness, no sleeps and continued single preview fixture ownership.
10. Corrected Issue #626, PR #627 and Agent Harness documentation to the confirmed deferred-request cancellation race.

Commands or procedures:

GitHub connector for live refs, issue/branch/PR metadata, exact file writes/reads and compare; Actions artifact download; local ZIP/trace inspection and timestamp extraction; source-level ownership/consumer audit.

Artifacts produced:

- Issue #626;
- branch `test/issue-626-webkit-preview-cors-fixture`;
- Draft PR #627;
- lifecycle/readiness regression fix;
- fail-closed source contract;
- Agent Harness failure-prevention record.

Result:

The branch no longer changes the canonical API fixture. Learn route-history acceptance now waits for the existing user-visible semantic completion of the debounced preview before reload/transit/Back-Forward. Production runtime/backend/design owners remain unchanged. Final acceptance is pending a clean immutable-head GitHub CI on the new developer-authored head.

Failures:

- Exact-main #3892 exposed the original WebKit pageerror.
- Exact-head #3896 disproved the response-header fix: Frontend core and other browser gates were green, while UI shard 2 still failed Learn/Profile history on iOS WebKit.

Root cause:

The acceptance's structural readiness predicate was earlier than the route's asynchronous readiness boundary. The test navigated away during Learn's 120 ms debounced preview lifecycle, and WebKit surfaced cancellation as an access-control pageerror before the mocked request reached `Route.fulfill`.

Fallback:

If the next immutable-head trace still shows the same pageerror after the enabled-CTA barrier, keep production and the canonical fixture untouched. Compare the new error timestamp against the CTA-ready point and classify any remaining deferred owner before changing code.

Limitations:

GitHub Actions remains the authoritative cross-browser execution environment. No local claim substitutes for the final iOS WebKit and full required CI result.

Reusable lesson:

Route readiness must include route-owned deferred work that can be invalidated by the next navigation. Use a stable semantic completion state, not a fixed delay and not the first visible shell element, before exercising reload or browser history.
