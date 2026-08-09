# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-progress-guest-login-touch-target`
- Base SHA: `f472865cdd91fde04a9ff0c26dc34fa283f725bb`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Close the evidenced Issue #74 coarse-pointer target gap for the single canonical guest `/progress` authentication CTA without changing its painted presentation or authenticated Progress behavior.

## Scope

- Preserve the guest `Войти и открыть прогресс` button at its existing painted `44px` minimum height.
- Expand only its effective block-axis hit surface to `48px` for coarse pointers.
- Keep the interaction owner route-scoped to canonical Progress guest empty state.
- Prove guest session isolation, real-hit geometry, focus-visible, overflow safety and the existing authentication navigation callback.
- Register the browser proof in blocking UI and accessibility collections.

## Non-goals

- No changes to authenticated `ProgressEvidenceDashboard`; PR #428 remains its target owner.
- No changes to `LexigoProgressApp` runtime behavior or authentication routing.
- No global `.lx-button` sizing change.
- No changes to `premium-ui.css` painted presentation.
- No changes to Home, Header, bottom navigation or other Issue #74 controls.
- No visual snapshot updates.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/progress-guest-login-touch-targets.css`
- `frontend/components/progress-guest-login-touch-target-source.test.ts`
- `frontend/e2e/progress-guest-login-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- All paths not listed above.
- `frontend/app/premium-ui.css` remains the painted `44px` owner.
- `frontend/components/lexigo-progress-app.tsx` remains the runtime/callback owner.
- `frontend/app/progress-evidence.css` and authenticated Progress runtime/tests remain owned by PR #428 and must not be modified.

## Runtime owners

- `frontend/components/lexigo-progress-app.tsx` — canonical `/progress` route island; guest branch owns `Войти и открыть прогресс` and callback to `/profile?session=required&return_to=%2Fprogress`.
- `frontend/app/premium-ui.css` — canonical painted `.lx-button` `min-height: 44px` plus `.lx-empty .lx-button` placement.
- `frontend/app/progress-guest-login-touch-targets.css` — interaction-only effective target owner introduced by this slice.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Guest button painted height remains approximately `44px`.
- Fine-pointer effective target remains at least `44px`.
- Coarse-pointer effective target is at least `48px`.
- Hit expansion is paint-inert: transparent background, zero border and no shadow.
- Inline geometry is unchanged; expansion is block-axis only.
- Existing focus-visible styling remains authoritative and at least `3px` visible outline in browser proof.
- Guest route remains unauthenticated even if inherited test cookies exist; fixture clears cookies and installs explicit guest API state.
- Clicking the button retains the exact existing authentication return-to behavior.
- No horizontal overflow is introduced.

## Acceptance criteria

- Canonical guest `/progress` renders heading `Войдите, чтобы видеть результат обучения` and exactly one in-main button named `Войти и открыть прогресс`.
- Button painted height remains approximately `44px`.
- Effective target meets `44px` fine / `48px` coarse minimums in desktop Chromium, Android Chromium and iOS WebKit.
- All four effective-target perimeter points resolve to the owning button.
- Pseudo hit owner remains transparent, borderless and shadowless.
- Focus-visible remains visible with at least `3px` outline.
- Clicking the target navigates to `/profile?session=required&return_to=%2Fprogress`.
- Browser proof is collected exactly once by both blocking UI and accessibility commands.

## Required checks

- Source contract: `frontend/components/progress-guest-login-touch-target-source.test.ts`.
- Browser contract: `frontend/e2e/progress-guest-login-touch-targets.spec.ts`.
- Repository frontend lint, typecheck, unit/source contract and production build through CI.
- Blocking UI, accessibility, visual, performance and full product gates through CI.
- Clean review/comment/thread audit and immutable-head policy before merge.
- Exact-SHA main CI, immutable container publication and Stage/public validation after merge.

## Risks

- Persisted authenticated cookies can silently route the browser into authenticated Progress; the guest fixture explicitly clears cookies before installing unauthenticated API state.
- A global button rule would affect unrelated UI; the new selector is route- and empty-state-scoped.
- Changing `min-height` would drift visual baselines; only transparent effective hit ownership is added.
- Browser pseudo-element inset calculations can differ; the browser proof measures final effective geometry and real perimeter hit ownership in all required engines.

## Rollback

Revert this atomic product PR. The canonical guest Progress button remains at its previous painted and behavioral state because runtime/presentation owners are unchanged.