# Current Task Progress

## 2026-08-11 19:12 Europe/Moscow

### Verified

- Live repository: `Dja-tiger/LexiGo`.
- Issue #71 remains the scoped task; Draft PR #473 is `feat/issue-71-feedback-taxonomy` -> `main`.
- Base SHA is `b1e238000803936e694b032564be0ed6fc97d1b7`.
- The implementation introduces one typed feedback taxonomy and one root `FeedbackCenter` instead of adding another local toast system.
- Route announcements, content `AsyncStatePanel` states, review-outbox connectivity, form validation and focused-lesson exit guidance remain separate semantic owners.
- Session/account confirmed outcomes, non-blocking speech failures and calendar action feedback are the migrated cross-route producers.
- Feedback presentation is safe-area-aware and remains a leaf layer in `frontend/app/feedback.css`; canonical state tokens stay owned by `system-states.css`.
- `AccessibleDialog` intentionally isolates every other body child with `inert` + `aria-hidden="true"` and contains programmatic/keyboard focus inside the top modal.
- Shared feedback must therefore participate in the top modal boundary when a dialog is open; weakening modal isolation is prohibited.
- PR #473 remains Draft until full immutable-head CI is green.

### Finding

CI #3198 first exposed a real accessibility failure: repeated calendar feedback queued correctly, but focusing the dismiss action did not pause the toast. Replacing capture-phase focus handlers with bubbling `onFocus` / `onBlur` was insufficient. CI #3202 reproduced the exact failure on the repaired head, which proved the event phase was not the fundamental cause.

The second Playwright artifact showed the toast was rendered outside the open calendar `AccessibleDialog`. Because the dialog correctly marks background body children inert/hidden and redirects external focus back into itself, the global toast action could never become the active element. The same placement also meant the shared live region was hidden from assistive technology while the local calendar status was deliberately `aria-live="off"` to prevent duplicate announcements.

### Root cause

The initial FeedbackCenter architecture centralized state ownership correctly but treated DOM placement as always root-global. That assumption conflicts with modal accessibility semantics: a single global queue may live at the root in React ownership, but its active presentation layer must be rendered inside the current top modal accessibility boundary whenever one exists.

The first focus-handler fix (`63bf6e3e55ae2bdf721cfe7475a03ad6044bd039`) addressed a symptom only. The durable fix keeps one queue/provider but adds an active-dialog feedback host. `AccessibleDialog` registers a host inside its `role="dialog"` section; `FeedbackCenter` portals the same feedback layer into the most recently registered host and falls back to the previous host/root when dialogs close.

### Changed files

Issue #71 implementation spans the scoped feedback model/provider/presentation and producer migrations, plus tests and task-local harness evidence. The modal-containment repair specifically changes:

- `frontend/components/feedback-center.tsx`: adds modal feedback-host registration, top-host selection and `createPortal` delivery while retaining one feedback state owner and FIFO queue.
- `frontend/components/accessible-dialog.tsx`: renders `FeedbackDialogHost` inside the dialog section without modifying inert isolation or focus-trap behavior.
- `frontend/components/feedback-center-source.test.ts`: asserts shared feedback is hosted inside the accessible dialog rather than bypassing modal semantics.
- `.agents/current/TASK.md`: expands the allowed runtime owner and invariants to include modal feedback containment.
- `.agents/current/PROGRESS.md`: records both CI failures and the corrected root cause.

### Checks passed

- Mandatory Agent Harness and architecture discovery completed earlier in the slice.
- PR #473 diff and Issue #71 acceptance criteria re-verified before each CI repair.
- CI #3198: production build and all pre-E2E steps passed; Playwright artifact `frontend-playwright-report-ui-1` reproduced the focus-pause failure in Chromium and WebKit.
- CI #3202 on `a0e1042d0fa8a36db1a173af5596ecd4b8945d59` passed Frontend core quality (lint, typecheck, unit, production build, dependency audit), Backend integration, Backend unit/security, Content security, Dictionary smoke, Visual regression, Lesson completion, iOS PWA dictionary, Controlled service worker, Accessibility audit and Performance budgets.
- CI #3202 failed only in `Frontend E2E (UI tests (shard 1/2))`; artifact id `9108974014` reproduced the same `system-states.spec.ts:195` assertion on Chromium and WebKit.
- Source inspection of `AccessibleDialog` confirmed background `inert`/`aria-hidden` isolation and the document `focusin` containment handler were correctly preventing focus from reaching root feedback.
- Modal-host architecture implemented without changing the failing E2E assertion, timeouts, browser matrix or dialog isolation.
- `frontend/components/feedback-center.tsx` modal-host commit: `35e3caef1e6dd5bcb55bee5c55d829d108b4f56a`.
- `frontend/components/accessible-dialog.tsx` integration commit: `9db5bbdb8df6e146293d77097d0cd1cbfe58df6b`.
- Source ownership regression commit: `9f04a6699545bc3658d43652dc6416e2b6e88d37`.

### Checks failed

- Immutable-head CI #3198 failed because the dismiss action could not satisfy the pause-on-focus contract.
- Immutable-head CI #3202 confirmed the first focus-event-only repair was insufficient; the same test failed because the feedback DOM lived outside the active modal boundary.
- Both failed runs are superseded by the modal-host repair. Full immutable-head CI still must pass on the final head after task-local evidence writes before Ready/merge.

### Current branch head

Resolve from live PR head after the final task-local evidence write. Do not use #3198 or #3202 SHAs as merge evidence.

### Next action

Finish task-local execution evidence, resolve the exact final PR head and require a full CI run on that immutable SHA. The unchanged cross-browser `system-states` assertion must pass while the calendar dialog remains open. If the run is green, mark PR #473 Ready, squash-merge with expected-head protection, verify Issue #71 closure and then select the next independently automatable product slice from live repository state.
