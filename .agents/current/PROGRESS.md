# Current Task Progress

## 2026-08-11 19:32 Europe/Moscow

### Verified

- Live repository: `Dja-tiger/LexiGo`.
- Issue #71 remains the scoped task; Draft PR #473 is `feat/issue-71-feedback-taxonomy` -> `main`.
- Base SHA: `b1e238000803936e694b032564be0ed6fc97d1b7`.
- One root `FeedbackCenter` owns the typed feedback reducer/FIFO queue/timers; route/content/connectivity/form-validation owners remain separate.
- `AccessibleDialog` remains the sole audited `createPortal`/focus-containment primitive and preserves background `inert` + `aria-hidden` isolation.
- Shared feedback is rendered declaratively through `FeedbackDialogHost` inside the active dialog, so toast actions/live regions remain inside the modal accessibility boundary.
- PR #473 remains Draft until full immutable-head CI is green.

### CI findings and repairs

1. CI #3198: `system-states.spec.ts` proved FIFO worked but pause-on-focus failed in Chromium/WebKit.
2. CI #3202: focus-event-only repair failed the same assertion; artifact evidence showed root feedback was outside the active modal and therefore inert/hidden.
3. A temporary second-portal implementation moved feedback into the modal, but CI #3208 correctly rejected it via `react-dom-ownership.test.ts` because portal infrastructure is confined to `accessible-dialog.tsx`.
4. The final runtime architecture is declarative: React context crosses the existing dialog portal; the active `FeedbackDialogHost` renders the single root-owned feedback layer.
5. CI #3213 on `09ab010c46e7cdba3b86feadc3eeacbb92e8b7b8` passed frontend core quality in full (lint, typecheck, unit including DOM ownership, production build, dependency audit), backend integration/unit/security, performance budgets, accessibility audit, dictionary smoke, controlled service worker and visual regression.
6. CI #3213 exposed only an expected test-ownership consequence in completed calendar collections: `apple-calendar-pwa.spec.ts` used `dialog.getByRole("status")`, but the dialog now intentionally contains both contextual `.lx-calendar-status` (`aria-live="off"`) and the shared live toast (`role="status"`, `aria-live="polite"`). Playwright correctly rejected that ambiguous locator in iOS PWA and Content Security jobs.
7. The calendar regression tests now target `.lx-calendar-status` explicitly. This preserves direct validation of contextual operation copy while allowing the shared toast to coexist in the same modal. No `.first()`, timeout inflation, browser skip, hidden-control interaction or product assertion was introduced.
8. The #3213 UI shard was cancelled automatically after the new commit and therefore is not final evidence. A WebKit failure snapshot from the calendar collection already showed shared feedback inside the dialog and, in one flow, `data-feedback-paused="true"`, but the unchanged `system-states.spec.ts` gate remains authoritative for final pause/FIFO validation.

### Current implementation evidence

- `9db5bbdb8df6e146293d77097d0cd1cbfe58df6b`: feedback host inside `AccessibleDialog`.
- `e21a35da592f1a86cd7d6afcc13e0dd982c4b926`: stable declarative host registration/rendering under the single feedback state owner.
- `17c15ff297d92c6545fa3f05355722da2ea0e1af`: source contract rejects a second portal owner.
- `47eebb3cc29999a018bbd06cc55eea4c267688c9`: scope the calendar regression adaptation before changing the test.
- `248e76d26e4d88490282f08d4644e43c84582c22`: calendar PWA regression locators target the contextual `.lx-calendar-status` rather than an ambiguous role-only query.

### Next action

Finalize execution evidence, resolve the exact branch head and require a full CI run on that immutable SHA. The unchanged cross-browser `system-states.spec.ts` test must prove FIFO + focus pause/dismiss inside the open modal, while PWA/security calendar collections must prove contextual status copy with the semantic locator. If all gates are green, mark PR #473 Ready, squash-merge with expected-head protection, verify Issue #71 closure and continue to the next independently automatable live backlog slice.
