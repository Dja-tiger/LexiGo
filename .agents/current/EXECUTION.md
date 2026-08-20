# Current Task Execution

## Task

- Issue: #628
- Branch: `test/issue-628-phrase-new-tab-stability`
- Base SHA: `b63b6a88b49faf6114870f39e6b7473a28ca1e9d`
- Head SHA: resolve from live branch ref after each write
- PR: pending

## Skills used

### GitHub CI repair

Purpose:

Diagnose the post-merge UI shard failure using exact Actions evidence and stabilize only the failing Playwright acceptance without changing production behavior.

Instruction source:

`skills://plugins/github/github/skill.md`, repository `AGENTS.md`, `.agents/**`, `.agents/SKILLS.md` and `docs/agent-harness.md`.

Version or verification date:

2026-08-20.

Inputs:

- exact-main SHA `b63b6a88b49faf6114870f39e6b7473a28ca1e9d`;
- CI run `32374318211` and rerun job `96447072687`;
- Playwright artifact `9409322176` (`frontend-playwright-report-ui-1`), digest `sha256:4df85fd6a649e11e036ca5498d66c6c7f8919a8a57ed832535faab9db1151dd8`;
- initial/retry error contexts and trace/network snapshots;
- current `frontend/e2e/app-router-routes.spec.ts` source.

Actions performed:

1. Classified the first failed attempt as external MCR registry reset because the Playwright image pull failed before tests and immediately succeeded in diagnostics.
2. Re-ran failed jobs on the same immutable main SHA instead of creating a code change for infrastructure noise.
3. Inspected the rerun Playwright report after workspace/install/build succeeded and E2E failed.
4. Verified attempt 1 timed out waiting for native middle-click page creation.
5. Verified retry 1 created the target page and received the exact phrase document with HTTP 200 in ~26 ms, but background-tab `domcontentloaded` never surfaced.
6. Confirmed the spec already owns independent native Chromium middle-click coverage for another semantic route.
7. Defined the phrase-specific contract around semantic href + independent target-tab navigation, not a duplicated browser gesture.
8. Replaced only that duplicate gesture with `context.newPage()` and explicit `goto(href)` while recording target-tab API requests.
9. Added negative warm-up assertions for catalog metadata, progress and word-catalog requests.
10. Kept production routing, fixtures, dependencies and the separate native new-tab test unchanged.

Result:

The proposed test now isolates the backend phrase deep-link contract from nondeterministic background-tab scheduling while retaining actual native new-tab coverage elsewhere in the same spec. Final acceptance requires full immutable-head CI and exact-main post-merge green.

Fallback:

If exact-head UI shard 1 still fails, inspect the new trace before any retry. Do not weaken target URL/heading/warm-up assertions or modify production code without evidence of a runtime defect.

Reusable lesson:

Do not make multiple acceptance tests depend on the same native browser gesture when only one needs to prove the gesture itself. Semantic-link consumers should separately verify their unique independent-load contract with explicit page ownership and request evidence.
