# Current Task

## Identity

- Issue: #71 — [Medium][UX] Стандартизировать feedback, toast и status messages
- Branch: `feat/issue-71-feedback-taxonomy`
- Base SHA: `b1e238000803936e694b032564be0ed6fc97d1b7`
- Head SHA: resolve from live PR head immediately before immutable-head validation
- PR: #473

## Objective

Introduce one typed feedback taxonomy and one persistent global feedback owner so cross-route session, speech and calendar feedback has deterministic queueing, dismiss, timing and live-region semantics without creating another parallel toast system.

## Scope

- Add a pure typed feedback model with explicit presentation and accessibility policy.
- Mount one persistent client feedback center in RootLayout above `RoutedLexigoApp` and route children, leaving route/navigation ownership unchanged.
- Add a narrow `feedback.css` leaf layer consuming canonical system-state tokens; do not expand session/PWA CSS into a generic feedback owner.
- Queue transient messages instead of overwriting them.
- Make transient feedback dismissible and pause auto-dismiss while hovered/focused.
- Keep critical/blocking errors persistent until their owning state resolves; never auto-dismiss them.
- Migrate account/session success notices, non-blocking speech error feedback and calendar operation confirmation/error into the shared owner where the event is genuinely global/user-action feedback.
- Preserve contextual operational speech state (`loading`, `playing`, `stopped`) and browser-unsupported capability guidance at the speech control.
- Keep shared feedback inside the currently active accessible modal layer so modal isolation does not make toast announcements/actions inert or `aria-hidden`.
- Add source/unit/browser regression protection for taxonomy, queueing, dismiss/live-region semantics and compact safe-area placement.

## Non-goals

- No backend, API, database or auth contract changes.
- No route ownership or navigation-history changes.
- No redesign, Figma changes or visual baseline updates.
- No dependency changes.
- Do not centralize route announcements, AsyncStatePanel content states, review-outbox connectivity state, form validation or focused-lesson exit guidance; those are separate semantic owners, not transient feedback.
- Do not change whether Google/Apple Calendar actually creates an external event; success copy must remain truthful about the confirmed client-side result only.
- Do not weaken `AccessibleDialog` modal isolation; feedback must participate in the modal focus/ARIA boundary instead of bypassing it.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/feedback.ts`
- `frontend/lib/feedback.test.ts`
- `frontend/components/feedback-center.tsx`
- `frontend/components/feedback-center-source.test.ts`
- `frontend/components/accessible-dialog.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/feedback.css`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/speech-player-button.tsx`
- `frontend/components/calendar-reminder-integration.tsx`
- `frontend/e2e/system-states.spec.ts`

## Prohibited paths

- `backend/**`
- `api/**`
- `deploy/**`
- `.github/workflows/**`
- dependency lockfiles/manifests
- visual snapshot PNGs
- route/navigation implementation files, including `frontend/components/routed-lexigo-app.tsx`
- `frontend/app/mobile-pwa-fixes.css`
- unrelated route components/styles/tests

## Runtime owners

- Persistent provider mount: `frontend/app/layout.tsx`.
- Route/navigation/route-announcement lifecycle remains `frontend/components/routed-lexigo-app.tsx` and is intentionally unchanged.
- Session/account runtime: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Speech action owner: `frontend/components/speech-player-button.tsx`.
- Calendar action owner: `frontend/components/calendar-reminder-integration.tsx`.
- Shared feedback state and active modal-host registration: `frontend/lib/feedback.ts` and `frontend/components/feedback-center.tsx`.
- Accessible modal containment/focus isolation and feedback host placement: `frontend/components/accessible-dialog.tsx`.
- Feedback presentation: `frontend/app/feedback.css`, consuming `--lx-state-*` tokens from canonical `system-states.css`.

## Documentation owners

- `.agents/current/**` for task-local evidence only.
- No public architecture ownership change is planned; the feedback stylesheet is a feature leaf and does not redefine shared tokens or route ownership.

## Invariants

- Route focus announcements remain a dedicated polite live region and are not duplicated by the feedback center.
- Critical/session restore errors remain persistent and retryable according to their existing owner.
- Success is emitted only after the corresponding operation has actually completed to the level the client can verify.
- At most one transient toast is announced/rendered as active; later transient messages remain queued in FIFO order.
- Dismissing/expiring one transient message advances exactly one queued message.
- Transient auto-dismiss pauses during pointer hover or keyboard focus.
- When an `AccessibleDialog` is active, shared feedback is rendered inside the top dialog so its live region and dismiss/action controls are not inert, hidden or forced outside the focus trap.
- Closing a nested/top dialog returns shared feedback to the previous dialog host or root owner without losing queue state.
- Global feedback does not overlap persistent bottom navigation, virtual keyboard safe areas or device safe-area insets.
- No product test is weakened through `.first()`, browser skips, timeout inflation or hidden-control interaction.

## Acceptance criteria

- Event classes have explicit typed presentation/accessibility policy.
- Critical errors do not auto-disappear.
- Toasts are dismissible, have text-aware bounded duration and pause on hover/focus.
- Repeated transient messages are FIFO queued rather than overwritten.
- Confirmed success is not emitted before the underlying operation result.
- Shared feedback has one announcement owner and avoids duplicate screen-reader announcements from migrated producers.
- Shared feedback remains operable and announced while an accessible modal is open.
- Compact/mobile feedback remains actionable and clear of bottom navigation/safe areas.
- Existing session, speech and calendar functional behavior remains intact.

## Required checks

- Source ownership/search contract, including active-modal feedback host integration.
- Frontend lint/typecheck/unit/production build.
- `system-states.spec.ts` targeted in Chromium/WebKit/Android/iOS; it is already collected by blocking UI and accessibility commands, avoiding a new collection boundary.
- Existing auth/session, speech and calendar browser regression coverage.
- Keyboard and accessibility/axe collection.
- Reduced-motion, PWA/service-worker, visual regression without baseline updates, performance/bundle gates.
- Full immutable-head CI before Ready/merge.

## Risks

- Double announcements if a migrated producer keeps its old live region.
- Toast timer races when a message is dismissed/replaced or route changes.
- Fixed feedback positioning could overlap bottom navigation/keyboard on compact PWA.
- Over-centralization could turn contextual content/loading state into inappropriate global feedback.
- Rendering feedback outside an active modal makes it inert/`aria-hidden`; bypassing the dialog trap instead would break modal semantics. The feedback host must therefore live inside the active dialog boundary.

## Rollback

Remove the RootLayout feedback provider, modal feedback host integration, `feedback.css` import and producer publishing calls, restoring the previous local session/speech/calendar presentation. No server data or persistent schema migration is involved.
