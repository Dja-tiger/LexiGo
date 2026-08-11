# Current Task Progress

## 2026-08-11 19:22 Europe/Moscow

### Verified

- Live repository: `Dja-tiger/LexiGo`.
- Issue #71 remains the scoped task; Draft PR #473 is `feat/issue-71-feedback-taxonomy` -> `main`.
- Base SHA is `b1e238000803936e694b032564be0ed6fc97d1b7`.
- The implementation has one typed feedback taxonomy and one root `FeedbackCenter`; route/content/connectivity/form-validation owners remain separate.
- Session/account confirmed outcomes, non-blocking speech failures and calendar action feedback are the migrated cross-route producers.
- `AccessibleDialog` intentionally isolates every other body child with `inert` + `aria-hidden="true"` and contains focus inside the top modal.
- Repository DOM ownership explicitly confines `createPortal`, imperative portal host creation and focus containment to `accessible-dialog.tsx`.
- PR #473 remains Draft until full immutable-head CI is green.

### CI findings and root cause evolution

1. CI #3198 exposed the calendar feedback regression: FIFO worked, but focusing the dismiss action did not pause the active toast in Chromium/WebKit.
2. A focus-event-only repair (`onFocusCapture` -> `onFocus`) was insufficient; CI #3202 reproduced the exact assertion.
3. The second Playwright artifact proved the real cause: root feedback was outside the active calendar `AccessibleDialog`, therefore the dialog correctly made it inert/`aria-hidden` and redirected focus back into the modal.
4. An initial modal-host implementation used `createPortal` from `feedback-center.tsx`. CI #3208 caught this at unit level through `react-dom-ownership.test.ts`: portal/focus infrastructure is intentionally allowed only in the audited dialog primitive.
5. The final architecture is fully declarative outside that primitive: `AccessibleDialog` renders `FeedbackDialogHost` inside its section; React context already crosses the dialog's existing audited portal. The root `FeedbackCenter` keeps the single reducer/FIFO state and exposes the current feedback layer through context. The most recently registered dialog host renders that layer; the root renders it only when no dialog host is active.

### Changed files for the modal-containment repair

- `frontend/components/feedback-center.tsx`: single feedback state owner, ordered dialog-host registration, declarative host rendering, stable registration dependency, no `createPortal` or imperative DOM ownership.
- `frontend/components/accessible-dialog.tsx`: `FeedbackDialogHost` lives inside the existing `role="dialog"`; inert/focus-trap implementation is unchanged.
- `frontend/components/feedback-center-source.test.ts`: requires declarative modal ownership and explicitly rejects a second portal owner.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md`: task boundary and evidence.

### Checks passed

- Issue #71 acceptance criteria and semantic owners re-verified.
- CI #3202 passed Frontend core quality, backend integration/unit/security, Content Security, Dictionary smoke, Visual Regression, Lesson completion, iOS PWA Dictionary, Controlled SW, Accessibility audit and Performance budgets before the known UI shard failure.
- Playwright artifacts from #3198 (`9107680890`) and #3202 (`9108974014`) both gave deterministic cross-browser evidence for the same pause-on-focus failure.
- CI #3208 lint and typecheck passed.
- CI #3208 unit output confirmed all Issue #71 feedback model/source tests passed; only `react-dom-ownership.test.ts` rejected the temporary second portal owner.
- The temporary feedback `createPortal` implementation has been removed rather than allowlisted.
- `AccessibleDialog` remains the sole audited portal/focus-containment primitive.
- Existing E2E acceptance assertion, timeouts and browser coverage remain unchanged.

### Superseded intermediate commits

- `63bf6e3e55ae2bdf721cfe7475a03ad6044bd039`: focus-event symptom repair only.
- `35e3caef1e6dd5bcb55bee5c55d829d108b4f56a`: initial modal-host implementation with a second portal owner; superseded after CI #3208 ownership gate.

### Current implementation commits

- `9db5bbdb8df6e146293d77097d0cd1cbfe58df6b`: place feedback host inside `AccessibleDialog`.
- `e21a35da592f1a86cd7d6afcc13e0dd982c4b926`: stable declarative feedback-host registration/state ownership.
- `17c15ff297d92c6545fa3f05355722da2ea0e1af`: source contract for declarative modal feedback ownership.

### Next action

Finalize execution evidence, resolve the exact PR head and require full CI on that immutable SHA. The unchanged `system-states.spec.ts` calendar test must prove FIFO + focus pause/dismiss inside the open modal. If green, mark PR #473 Ready, squash-merge with expected-head protection, verify Issue #71 closure and continue with the next independently automatable live backlog slice.
