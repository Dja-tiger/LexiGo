# Current Task Progress

## 2026-08-11 19:55 Europe/Moscow

### Verified

- Live repository: `Dja-tiger/LexiGo`.
- Issue #71 remains the scoped task; Draft PR #473 is `feat/issue-71-feedback-taxonomy` -> `main`.
- Base/default-branch SHA remains `b1e238000803936e694b032564be0ed6fc97d1b7`.
- Last product-validation head is `7e008c5e44b75b2a374fd74f4acc956e13c6806e`.
- One root `FeedbackCenter` owns the typed feedback reducer/FIFO queue/timers; route/content/connectivity/form-validation owners remain separate.
- `AccessibleDialog` remains the sole audited `createPortal`/focus-containment primitive and preserves background `inert` + `aria-hidden` isolation.
- Shared feedback is rendered declaratively through `FeedbackDialogHost` inside the active dialog, so toast actions/live regions remain inside the modal accessibility boundary.
- PR #473 remains Draft until full CI is green on the final developer-authored head after this evidence update.

### CI findings and repairs

1. CI #3198: `system-states.spec.ts` proved FIFO worked but pause-on-focus failed in Chromium/WebKit.
2. CI #3202: focus-event-only repair failed the same assertion; artifact evidence showed root feedback was outside the active modal and therefore inert/hidden.
3. A temporary second-portal implementation moved feedback into the modal, but CI #3208 correctly rejected it via `react-dom-ownership.test.ts` because portal infrastructure is confined to `accessible-dialog.tsx`.
4. The final runtime architecture is declarative: React context crosses the existing dialog portal; the active `FeedbackDialogHost` renders the single root-owned feedback layer.
5. CI #3213 on `09ab010c46e7cdba3b86feadc3eeacbb92e8b7b8` passed core/backend and several browser gates, then exposed a deterministic ambiguous `role="status"` locator in calendar PWA/security tests after the shared live status was correctly rendered inside the dialog.
6. Calendar PWA regressions were scoped to the contextual `.lx-calendar-status`, preserving their original assertions without `.first()`, timeout inflation or browser skips.
7. CI #3217 / run `31512758177` on `63802d8f908666eb0059eafc869f50aaf2978cb3` exposed the same ownership ambiguity in the dedicated `system-states.spec.ts` acceptance test: the calendar dialog intentionally contained both `.lx-calendar-status[aria-live="off"]` and the shared feedback status.
8. Commit `7e008c5e44b75b2a374fd74f4acc956e13c6806e` scopes that assertion directly to `.lx-calendar-status`. The acceptance still verifies that the contextual calendar status remains non-live while the shared feedback status remains the polite live owner.
9. The unrelated WebKit Lesson Result input failure seen once in #3217 did not recur. It matches an already documented controlled-input browser-test category and was not mixed into Issue #71.
10. CI #3218 / run `31514023345` on exact head `7e008c5e44b75b2a374fd74f4acc956e13c6806e` completed `success`: backend unit/race/security/integration, frontend lint/typecheck/unit/build/dependency audit, both blocking UI shards, Lesson completion, accessibility, visual regression, performance budgets, Content Security, Dictionary smoke, iOS PWA dictionary, controlled service worker, frontend aggregate quality and API/Web container builds all passed.

### Current implementation evidence

- `9db5bbdb8df6e146293d77097d0cd1cbfe58df6b`: feedback host inside `AccessibleDialog`.
- `e21a35da592f1a86cd7d6afcc13e0dd982c4b926`: stable declarative host registration/rendering under the single feedback state owner.
- `17c15ff297d92c6545fa3f05355722da2ea0e1af`: source contract rejects a second portal owner.
- `248e76d26e4d88490282f08d4644e43c84582c22`: calendar PWA regression locators target `.lx-calendar-status` rather than an ambiguous role-only query.
- `7e008c5e44b75b2a374fd74f4acc956e13c6806e`: dedicated system-state acceptance locator targets the same contextual owner.

### Next action

Resolve the new PR head after this evidence-only commit and require full CI success on that exact immutable SHA. Then re-audit changed paths, review threads and mergeability; update the PR validation section; mark PR #473 Ready and squash-merge with expected-head protection. After merge, verify Issue #71 closure, exact-SHA `main` CI and Stage/public validation before updating `PROJECT_STATE` and resetting current task context in a dedicated Agent-Docs reconciliation PR.
