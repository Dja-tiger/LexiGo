# Current Task Execution

## Task

- Branch: `fix/issue-689-error-boundary-hydration-race`
- Base SHA: `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90`
- Head SHA: resolve from live branch ref after this write
- PR: pending Draft PR

## Skills used

### Exact-main CI failure triage

Purpose:

Determine whether #688's first post-merge failure was a production regression, an unrelated infrastructure failure, or a deterministic defect in the new browser proof before choosing rerun versus code repair.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.md`, production-safe CI rules, Issue #687 acceptance criteria and the no-blind-rerun repository policy.

Version or verification date:

2026-08-25 Europe/Berlin, against exact merge SHA `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90`.

Inputs:

- PR-head CI #4170 / run `32865890130` on `d7dd1bf3f247a4ea84ca0d9d47bb2df039e96e63`.
- Exact-main CI #4171 / run `32873693448`.
- Failed job `Frontend E2E (UI tests (shard 2/2))` / job `97887223369`.
- Workflow artifact `frontend-playwright-report-ui-2` / artifact `9573435222`.

Files inspected:

- `frontend/e2e/application-error-boundary-appearance.spec.ts`
- failed Playwright `error-context.md` files for Light/Dark and retries
- failed Playwright `trace.zip` snapshots for Light/Dark and retries
- existing appearance/WebKit test patterns

Actions performed:

- Confirmed build/install succeeded and failure occurred only in the E2E step.
- Downloaded and unpacked the failed browser diagnostics artifact rather than rerunning the job blindly.
- Confirmed both explicit Light and Dark cases fail on `ios-webkit`, including retry.
- Compared trace snapshots around fixture insertion and the subsequent assertion.
- Proved the fixture is connected immediately after insertion but disappears before the next Playwright task while the normal Home DOM is restored.
- Correlated that behavior with the test's `body.replaceChildren()` after only `domcontentloaded`, identifying React hydration as the interleaving owner.

Commands or procedures:

Connected GitHub Actions job/artifact inspection plus local structured inspection of Playwright reports and trace snapshots.

Artifacts produced:

Issue #689 with exact failure/run/job/artifact evidence and an atomic hotfix branch from the failed merge SHA.

Result:

The failure is a deterministic test-harness race exposed by WebKit scheduling, not evidence that #688's semantic CSS is wrong. A blind rerun would be insufficient because the race already failed both Playwright attempts on exact-main and had passed once on PR-head.

Failures:

First exact-main CI #4171 remains failed and Stage was correctly blocked.

Root cause:

The test mutates React-owned DOM in one browser task and inspects it in another before React hydration is guaranteed complete.

Fallback:

Not used. No whole-workflow or targeted-job rerun was initiated before root-cause proof.

Limitations:

The trace establishes the DOM replacement race directly; it does not require or claim a production application failure.

Reusable lesson:

A browser fixture that mutates framework-owned DOM must not split mutation and evidence across scheduler boundaries unless framework hydration/ownership is explicitly synchronized. For pure computed-style proof, atomic connected-DOM sampling is safer and more faithful than replacing the application body.

### Hydration-safe computed-style fixture

Purpose:

Preserve the #687/#688 semantic cascade proof while eliminating React hydration as a competing DOM owner.

Instruction source:

Issue #689 acceptance criteria and the computed-cascade/browser evidence requirements inherited from #687/#205.

Version or verification date:

2026-08-25 Europe/Berlin.

Inputs:

The exact selector fixture and semantic assertions already collected by blocking `test:e2e:ui`.

Files inspected:

- `frontend/e2e/application-error-boundary-appearance.spec.ts`
- `frontend/app/error-boundary.css`
- existing WebKit appearance tests using the real application cascade

Actions performed:

- Removed the cross-task `mountFatalBoundaryFixture()` / locator visibility sequence.
- Moved fixture creation into `semanticPresentationSnapshot()`.
- Appended the synthetic fatal boundary to the live document without replacing the React-owned body.
- Captured fixture computed styles and resolved semantic token probes in the same `page.evaluate()` task.
- Removed the fixture in `finally` before the browser task returns.
- Added an explicit post-capture zero-count assertion proving the synthetic fixture does not persist.
- Preserved every Light/Dark semantic equality assertion and kept the test in the same blocking collection/browser matrix.

Commands or procedures:

Connected GitHub branch/file writes with required read-back and exact-main drift verification.

Artifacts produced:

Updated `frontend/e2e/application-error-boundary-appearance.spec.ts` on Issue #689 branch.

Result:

The fixture remains connected while computed styles are sampled, but React cannot interleave between insertion and evidence capture because JavaScript execution is atomic within the single evaluation task. The application body is never replaced.

Failures:

No hotfix CI result yet; full immutable-head validation is still required.

Root cause:

Resolved in test-harness design by removing the scheduler boundary around React-owned DOM mutation.

Fallback:

If immutable-head CI exposes a browser-specific computed-style mismatch, inspect that exact cascade evidence; do not restore sleeps, skip WebKit or weaken semantic assertions.

Limitations:

This remains a selector-level computed-style proof rather than deliberately crashing production React. The existing fail-closed source contract from #688 continues to bind the fixture selectors to the real `ApplicationErrorBoundary` owner.

Reusable lesson:

For CSS ownership verification inside a hydrated SPA, append an ephemeral connected fixture and sample it atomically; do not replace the framework root and then depend on the fixture surviving into a later browser task.
