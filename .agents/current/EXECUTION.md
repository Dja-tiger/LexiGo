# Current Task Execution

## Task

- Issue: #71 — [Medium][UX] Стандартизировать feedback, toast и status messages
- Branch: `feat/issue-71-feedback-taxonomy`
- Base SHA: `b1e238000803936e694b032564be0ed6fc97d1b7`
- Head SHA: resolve from live PR head before immutable-head validation
- PR: #473

## Evidence summary

Issue #71 centralizes cross-route transient feedback without taking ownership away from route announcements, content states, connectivity, form validation or focused-lesson exit guidance. The final modal integration keeps one reducer/FIFO queue in the root `FeedbackCenter`, while the active `AccessibleDialog` supplies a declarative render host inside its existing accessibility boundary.

## CI diagnosis

- CI #3198 / run `31506824359`: UI shard 1 failed `system-states.spec.ts` pause-on-focus in Chromium and WebKit. Artifact `9107680890` showed FIFO itself was correct.
- First focus-handler repair changed capture handlers to bubbling focus/blur but did not address DOM accessibility ownership.
- CI #3202 / run `31510010687`: all core/backend/security/a11y/performance/visual/PWA gates passed, but the same UI assertion failed again. Artifact `9108974014` showed root feedback remained outside the open calendar modal.
- Source tracing established that `AccessibleDialog` correctly sets all other body children `inert` + `aria-hidden="true"` and redirects external `focusin` back to the top dialog. Therefore root-level feedback was both non-focusable and hidden from assistive technology while the local calendar status intentionally used `aria-live="off"`.
- An initial modal-host repair rendered the shared layer into the dialog with an additional `createPortal` in `feedback-center.tsx`.
- CI #3208 / run `31511442545` passed lint/typecheck and all Issue #71 model/source tests, but `react-dom-ownership.test.ts` correctly rejected the second portal owner. Repository architecture confines `createPortal`, imperative portal-host creation and focus containment to the audited `AccessibleDialog` primitive.

## Final architecture

- `AccessibleDialog` remains the only component that owns a React portal and document-level focus containment.
- `FeedbackDialogHost` is rendered as a normal React child inside the dialog section.
- React context naturally crosses `AccessibleDialog`'s existing portal.
- `FeedbackCenter` tracks ordered dialog host IDs but retains the sole feedback reducer, FIFO queue, timers and producer API.
- The most recently registered host declaratively renders the shared feedback layer; the root renders it only when no dialog host is active.
- Nested-dialog close returns presentation to the previous host/root without resetting feedback state.
- Host registration depends on the stable `registerHost` callback rather than the dynamic presentation context object, avoiding Strict Mode unregister/register churn when toast state changes.
- No second `createPortal`, imperative DOM host, MutationObserver or delegated document event was introduced.

## Files changed for the final repair

- `frontend/components/feedback-center.tsx`
- `frontend/components/accessible-dialog.tsx`
- `frontend/components/feedback-center-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

The broader PR also contains the typed feedback model, presentation CSS, producer migrations and browser regression coverage already scoped to Issue #71.

## Current implementation evidence

- `9db5bbdb8df6e146293d77097d0cd1cbfe58df6b`: place feedback host inside the audited dialog primitive.
- `e21a35da592f1a86cd7d6afcc13e0dd982c4b926`: stable declarative host selection/rendering under the single feedback state owner.
- `17c15ff297d92c6545fa3f05355722da2ea0e1af`: source contract rejects a second portal owner and requires modal-host integration.

Superseded symptom/temporary implementations are documented in `PROGRESS.md`; they are not merge evidence.

## Invariants preserved

- Critical errors remain persistent according to existing owners.
- Repeated transient messages remain FIFO.
- One active transient feedback item is announced/rendered at a time.
- Toast dismissal and text-aware duration policy are unchanged.
- Hover/focus pauses transient expiry.
- Migrated local status regions do not duplicate live announcements.
- Modal `aria-modal`, background isolation and focus containment are unchanged.
- Route/history ownership, backend/API/auth contracts, dependencies and visual baselines are unchanged.
- Browser acceptance assertions, timeout values and browser matrix were not weakened.

## Final validation requirement

Resolve the live PR head after this evidence write and require full CI success on that exact immutable SHA. In particular, the unchanged calendar feedback regression in `system-states.spec.ts` must pass inside the open modal in Chromium/WebKit and the broader mobile/accessibility collections. Only then mark PR #473 Ready and squash-merge with expected-head protection.

## Fallback if the browser regression persists

Inspect the new Playwright snapshot/trace first. Verify that `.lx-feedback-center` is a DOM descendant of the active `[role="dialog"]`, `data-feedback-dialog-host` is registered before calendar publication, and focus lands on the dismiss button. Do not relax modal isolation, inflate timeouts, skip browsers, use `.first()` to hide duplicate ownership, or introduce another portal primitive.
