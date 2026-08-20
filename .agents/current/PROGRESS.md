# Current Task Progress

## 2026-08-20 Europe/Berlin

### Verified

- Live `main` remains exact SHA `b40bbbfde951797ba712e63b9d940fbdb30d9694`, the squash merge of PR #625.
- Post-merge exact-main CI #3892 / run `32324897382` first reproduced the iOS WebKit lesson-preview pageerror in the Issue #617 route-history collection.
- Draft PR #627 exact-head CI #3896 / run `32367998836` on SHA `534d2a4f7009b68cdf52b71c9885bdde2819fba4` passed Frontend core quality and the other browser gates but failed `Frontend E2E (UI tests (shard 2/2))` job `96422373605`.
- Exact-head artifact `frontend-playwright-report-ui-2` / artifact `9406348780`, digest `sha256:c53a78ec707a8c1519846f3a9d3f5a14ff61a91fa3b565d6fdcaad7f4be0005d`, contains final failures for `learn light` on initial run and retry and `profile dark` on iOS WebKit. The Profile journey transits through Learn.
- The #3896 trace disproves the intermediate CORS-response hypothesis. Failed preview attempts have no `/api/v1/lessons/preview` resource snapshot and no preview `Route.fulfill` call.
- Exact trace timing correlates every WebKit pageerror with navigation away from Learn before its 120 ms preview debounce can settle: `reload` 358144.013 → pageerror 358161.713; `goto('/profile')` 358867.853 → pageerror 358893.779; `goForward` 360344.369 → pageerror 360367.897.
- `LexigoLearnApp` debounces authenticated lesson preview by 120 ms and disables the start CTA until `matchingLessonPreview` resolves. Therefore an enabled responsive start CTA is the existing semantic proof that the preview lifecycle is stable.
- The disproven CORS shim was removed. `frontend/e2e/support/quality-gates.ts` is restored to exact `main` blob `636db392a1abac26c4056b803827c6a37e778429` and is no longer in the branch diff.

### Finding

The route-history acceptance defined Learn readiness too early. A visible route heading proves structural render, but not completion of the route-owned debounced preview request. The next reload/history transition could cancel that pending lifecycle, which iOS WebKit reports as an access-control pageerror independently of the promise catch path.

### Root cause

`expectSemanticReady` returned after the Learn heading became visible. The test then immediately performed `reload`, transit navigation or Forward while `LexigoLearnApp` still owned a pending 120 ms preview timer/request. This is a Playwright acceptance lifecycle race, not a production API/CORS defect.

### Changed files

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Implemented

- Learn semantic readiness now resolves the actual layout from viewport width.
- Desktop waits for exact CTA `Начать урок`; compact waits for exact CTA `Начать рекомендуемый урок`.
- The selected CTA must be enabled before the history acceptance proceeds, which proves the matching lesson preview resolved without using elapsed-time sleeps.
- Source contract protects responsive CTA selection, `toBeEnabled()`, strict real-history semantics and absence of `waitForTimeout`/page-level preview interception.
- Agent Harness now records the confirmed deferred-request cancellation race rather than the disproven CORS-response hypothesis.
- Issue #626 and PR #627 metadata were corrected to the lifecycle root cause.

### Checks passed

- Exact #3896 artifact and trace were inspected.
- Timing and absence of preview fulfillment were verified from the trace.
- Disproven fixture changes were fully reverted from the branch diff.
- Branch remains based on exact `b40bbbf...`, behind by zero, with only test-harness/Agent Harness paths changed.

### Validation pending

- New immutable-head Frontend core/source contract.
- New immutable-head UI shard 2, specifically Learn/Profile route-history on iOS WebKit with strict runtime-error assertion unchanged.
- Remaining required CI aggregate and container builds.
- Review/thread audit, Ready and expected-head squash merge.
- Exact-main CI after merge.

### Next action

Finish current-context synchronization, resolve the new developer-authored head, and accept only a full immutable-head CI where UI shard 2 proves the semantic-readiness fix without retry-dependent behavior.
