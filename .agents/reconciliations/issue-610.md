# Issue #610 delivery reconciliation

Verified on 2026-08-19.

## Product delivery

- Issue: #610 — stabilize the 320px / 200% calendar reflow gate against the Home async transition.
- Product PR: #612.
- Final developer-authored PR head: `a8579e666068b09110fb5024a29fda3329712e06`.
- Final PR tree: `10a9ee54dde3fdb4a31e810b1355fd7d2c7a4f25`.
- Immutable-head CI: #3859 / run `32246143279` — full `success` on the first attempt.
- Squash merge / delivered `main`: `a48886e13d49fa9349c149567bb2940e46a7777f`.
- Delivered main tree: `10a9ee54dde3fdb4a31e810b1355fd7d2c7a4f25`, byte-identical to the fully validated final PR tree.
- No Stage redeploy is required: the delivered slice changes only the existing E2E acceptance owner and Agent Docs; production runtime is unchanged.

## Root cause and fix

The previous CI #3853 trace showed the authenticated Home route still transitioning from its loading state to final progress/streak content while `calendar-reminder-touch-targets.spec.ts` sampled whole-document overflow at 320px / 200% text. The closed reminder preview itself was already `display:none` with zero width/height, so the previously repaired calendar preview runtime was not the overflow owner.

The test now arms deterministic waits for `/api/v1/progress=200` and `/api/v1/lessons/active=404` before navigation, waits for the fixture-owned final `Повторить сейчас` CTA to prove both resource results have committed, and only then applies 200% text zoom and measures geometry.

No `waitForTimeout`, browser exclusion, overflow hiding or tolerance widening was introduced. The existing strict `documentElement` and `body <= viewport + 1` assertions, closed-preview zero-geometry proof, open-preview viewport containment and `Настроить календарь` action evidence remain intact.

## Validation

- CI #3859 `UI tests (shard 2/2)` passed on the first job attempt, including the target Android Chromium and iOS WebKit coverage; no failed-job rerun was needed.
- Frontend core, backend unit/security, backend integration, UI shard 1, Accessibility, Visual, iOS PWA Dictionary, Controlled Service Worker, Lesson Completion, Content Security, Dictionary smoke, Performance Budgets, frontend quality aggregation and both container builds also passed.
- Final compare against `main@e70778dc22c1e61441e4d5356df4c484e30e367e`: `behind_by=0` and only `frontend/e2e/calendar-reminder-touch-targets.spec.ts` plus `.agents/current/**` changed.
- Review submissions before merge: none.
- Inline review threads before merge: none.
- PR #612 was promoted from Draft only after the immutable-head CI succeeded.
- Squash merge used expected-head protection for `a8579e666068b09110fb5024a29fda3329712e06`.

## Exact-main CI observability

The repository CI workflow is configured for pull requests and pushes to `main`, but the connected commit-workflow lookup exposes pull-request-triggered runs only. No exact-main push-run ID or state is invented. Delivery integrity is anchored by the delivered main tree being byte-identical to the final PR tree that passed CI #3859.

## Harness reset

This reconciliation branch resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to the canonical templates.

`PROJECT_STATE.md` is not destructively rewritten through a potentially truncated connector response; this dedicated reconciliation record preserves the delivery evidence following the established repository precedent.
