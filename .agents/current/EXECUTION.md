# Current Task Execution

## Task

- Issue: #71 — [Medium][UX] Стандартизировать feedback, toast и status messages
- Branch: `feat/issue-71-feedback-taxonomy`
- Base SHA: `b1e238000803936e694b032564be0ed6fc97d1b7`
- Head SHA: resolve from live PR head before immutable-head validation
- PR: #473

## Evidence summary

Issue #71 centralizes cross-route transient feedback without taking ownership away from route announcements, content states, connectivity, form validation or focused-lesson exit guidance. The runtime has one root feedback reducer/FIFO queue, while an active `AccessibleDialog` provides a declarative render host inside its existing accessibility boundary.

## CI diagnosis

- CI #3198 / run `31506824359`: UI shard 1 failed the `system-states.spec.ts` pause-on-focus assertion in Chromium/WebKit; artifact `9107680890` proved FIFO itself worked.
- CI #3202 / run `31510010687`: the same assertion failed after a focus-event-only repair; artifact `9108974014` established that root feedback was outside the open calendar modal and therefore made inert/hidden by correct dialog isolation.
- CI #3208 / run `31511442545`: the first modal-host implementation was rejected by `react-dom-ownership.test.ts` because it introduced a second `createPortal` owner outside `AccessibleDialog`.
- Runtime was refactored to declarative host rendering: React context crosses the existing audited dialog portal, `FeedbackDialogHost` lives inside the dialog section, and the root `FeedbackCenter` keeps the sole queue/state/timers.
- CI #3213 / run `31511894053` on head `09ab010c46e7cdba3b86feadc3eeacbb92e8b7b8` passed frontend lint/typecheck/unit/production build/dependency audit, backend integration/unit/security, performance budgets, accessibility audit, dictionary smoke, controlled service worker and visual regression.
- The completed iOS PWA and Content Security jobs in #3213 then exposed a deterministic strict-locator ambiguity in existing `apple-calendar-pwa.spec.ts`: the active dialog now correctly contains two `role="status"` descendants, the contextual `.lx-calendar-status` with `aria-live="off"` and the shared live toast with `aria-live="polite"`.
- The failure is a test ownership mismatch, not a product failure. It also directly proves that shared feedback is now inside the modal DOM/accessibility boundary; one WebKit failure snapshot showed the toast with `data-feedback-paused="true"`.

## Final architecture

- `AccessibleDialog` remains the only component owning `createPortal`, body isolation and document-level focus containment.
- `FeedbackDialogHost` is a normal React child inside the dialog.
- `FeedbackCenter` retains the sole typed reducer/FIFO queue/timers/producer API and ordered host registration.
- The most recently registered dialog host renders the shared feedback layer; the root renders it only with no active dialog host.
- Nested-dialog close falls back to the previous host/root without clearing feedback state.
- Stable host registration avoids state-driven unregister/register churn.
- No additional portal, imperative DOM host, MutationObserver or delegated document interaction was introduced.

## Calendar regression adaptation

Before changing the test, `.agents/current/TASK.md` was expanded to allow `frontend/e2e/apple-calendar-pwa.spec.ts` and require semantic ownership rather than positional selection.

All three contextual calendar assertions now use `dialog.locator(".lx-calendar-status")` instead of `dialog.getByRole("status")`:

- Google Calendar prepared-event copy;
- installed iOS PWA successful file-share copy;
- desktop ICS download copy.

This does not weaken the regression: it still checks the same operation result text in the same dialog and browser flows, while explicitly distinguishing the local contextual owner from the shared live feedback owner. No `.first()`, browser skip, timeout increase or hidden-control action was added.

## Current implementation evidence

- `9db5bbdb8df6e146293d77097d0cd1cbfe58df6b`: modal feedback host placement.
- `e21a35da592f1a86cd7d6afcc13e0dd982c4b926`: stable declarative host state/rendering.
- `17c15ff297d92c6545fa3f05355722da2ea0e1af`: declarative ownership source contract.
- `47eebb3cc29999a018bbd06cc55eea4c267688c9`: scope calendar regression adaptation.
- `248e76d26e4d88490282f08d4644e43c84582c22`: semantic calendar status locators.

## Invariants preserved

- Critical errors remain persistent according to their existing owner.
- Repeated transient messages remain FIFO and one transient item is active at a time.
- Hover/focus pauses transient expiry; dismiss/expiry advances one queued item.
- Migrated local status regions do not duplicate live announcements.
- Modal `aria-modal`, background isolation and focus containment are unchanged.
- Route/history, backend/API/auth contracts, dependencies and visual baselines are unchanged.
- The original `system-states.spec.ts` acceptance test remains unchanged and must provide final cross-browser proof.

## Final validation requirement

Resolve the live PR head after this evidence write and require full CI success on that exact immutable SHA. The unchanged calendar feedback regression in `system-states.spec.ts` must pass in its blocking UI/browser collections, and `apple-calendar-pwa.spec.ts` must pass PWA/security collections using the contextual status owner. Only then mark PR #473 Ready and squash-merge with expected-head protection.
