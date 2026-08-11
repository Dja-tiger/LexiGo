# Current Task Execution

## Task

- Issue: #71 — [Medium][UX] Стандартизировать feedback, toast и status messages
- Branch: `feat/issue-71-feedback-taxonomy`
- Base SHA: `b1e238000803936e694b032564be0ed6fc97d1b7`
- Last product-validation head: `7e008c5e44b75b2a374fd74f4acc956e13c6806e`
- Final PR head: resolve from live PR after this evidence-only commit
- PR: #473

## Evidence summary

Issue #71 centralizes cross-route transient feedback without taking ownership away from route announcements, content states, connectivity, form validation or focused-lesson exit guidance. The runtime has one root feedback reducer/FIFO queue, while an active `AccessibleDialog` provides a declarative render host inside its existing accessibility boundary.

## CI diagnosis

- CI #3198 / run `31506824359`: UI shard 1 failed the `system-states.spec.ts` pause-on-focus assertion in Chromium/WebKit; artifact `9107680890` proved FIFO itself worked.
- CI #3202 / run `31510010687`: the same assertion failed after a focus-event-only repair; artifact `9108974014` established that root feedback was outside the open calendar modal and therefore made inert/hidden by correct dialog isolation.
- CI #3208 / run `31511442545`: the first modal-host implementation was rejected by `react-dom-ownership.test.ts` because it introduced a second `createPortal` owner outside `AccessibleDialog`.
- Runtime was refactored to declarative host rendering: React context crosses the existing audited dialog portal, `FeedbackDialogHost` lives inside the dialog section, and the root `FeedbackCenter` keeps the sole queue/state/timers.
- CI #3213 / run `31511894053` on `09ab010c46e7cdba3b86feadc3eeacbb92e8b7b8` passed core/backend and multiple browser gates, then exposed a deterministic strict-locator ambiguity in calendar regressions because the active dialog correctly contained the contextual `.lx-calendar-status` and shared live toast.
- Calendar PWA assertions were corrected to target `.lx-calendar-status` explicitly; no positional selector, skip or timeout change was used.
- CI #3217 / run `31512758177` on `63802d8f908666eb0059eafc869f50aaf2978cb3` exposed the same ambiguity in `system-states.spec.ts`. This was classified as a stale/ambiguous test locator caused by intentional coexistence of two semantic status owners, not a production defect.
- Commit `7e008c5e44b75b2a374fd74f4acc956e13c6806e` changed only that acceptance locator to `dialog.locator(".lx-calendar-status")`, preserving the exact `aria-live="off"` assertion for the contextual owner.
- The one WebKit Lesson Result controlled-input failure observed in #3217 did not recur in the next exact-head run and matches an existing documented browser-test category; no unrelated lesson implementation was changed.
- CI #3218 / run `31514023345` on exact head `7e008c5e44b75b2a374fd74f4acc956e13c6806e` completed `success`. It passed backend unit/race/security/integration; frontend lint/typecheck/unit/production build/dependency audit; both blocking UI shards; Lesson completion; accessibility; visual regression; performance budgets; Content Security; Dictionary smoke; iOS PWA dictionary; controlled service worker; frontend aggregate quality; and API/Web container builds.

## Final architecture

- `AccessibleDialog` remains the only component owning `createPortal`, body isolation and document-level focus containment.
- `FeedbackDialogHost` is a normal React child inside the dialog.
- `FeedbackCenter` retains the sole typed reducer/FIFO queue/timers/producer API and ordered host registration.
- The most recently registered dialog host renders the shared feedback layer; the root renders it only with no active dialog host.
- Nested-dialog close falls back to the previous host/root without clearing feedback state.
- Stable host registration avoids state-driven unregister/register churn.
- No additional portal, imperative DOM host, MutationObserver or delegated document interaction was introduced.

## Feedback contract proved by source/unit/browser gates

- `blocking-error` is a persistent assertive banner with no auto-dismiss timer.
- `error`, `success` and `info` use polite, dismissible transient feedback with bounded text-sensitive duration from 5 to 12 seconds.
- Repeated transient messages are FIFO; one transient item is active at a time and dismiss/expiry advances exactly one queued item.
- Hover/focus pauses transient expiry.
- Migrated speech/calendar local status remains visible where useful but is no longer a competing live error/status announcement owner.
- Calendar contextual result assertions target `.lx-calendar-status`; shared toast assertions target the feedback layer, avoiding role-only ambiguity.
- Compact feedback CSS accounts for top/right/bottom/left safe areas and reserves vertical space from the bottom navigation area.
- Confirmed account outcomes route through shared success feedback; unconfirmed hand-off actions such as calendar preparation remain informational rather than false success.

## Invariants preserved

- Critical errors remain persistent according to their existing owner.
- Modal `aria-modal`, background isolation and focus containment are unchanged.
- Route/history, backend/API/auth contracts, dependencies and visual baselines are unchanged.
- No `.first()`, timeout inflation, browser skip, hidden-control interaction or acceptance weakening was introduced.

## Final validation requirement

This evidence-only commit intentionally moves the PR head after the successful product-validation run. Resolve the new live head and require full CI success on that exact developer-authored SHA. Re-check changed paths, unresolved review threads, reviews and mergeability. Only then mark PR #473 Ready and squash-merge with expected-head protection. Post-merge completion additionally requires exact-SHA `main` CI plus Stage/public validation before repository memory is reconciled and current task context is reset.
