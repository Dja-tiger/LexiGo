# Current Task

## Identity

- Issue: #681
- Branch: `fix/issue-681-sw-update-semantic-palette`
- Base SHA: `478696cf600e92bd9724bb397a38fd6aa94d5abd`
- Head SHA: resolve from live branch ref
- PR: #682 (Draft)

## Objective

Remove the production-reachable legacy purple/cyan/navy presentation from the global Service Worker update surface and bind its effective Light/Dark paint to the current semantic appearance tokens without changing Service Worker lifecycle semantics.

## Scope

- `frontend/app/service-worker-update.css` semantic presentation ownership.
- Fail-closed source ownership coverage for the live `.lx-sw-update` selector family.
- Existing `frontend/e2e/service-worker-update.spec.ts` computed-style evidence for update/success/error Light/Dark states.
- Agent current task/progress evidence for this atomic slice.

## Non-goals

- No Service Worker registration, activation, deferral, recovery, reload, storage or route semantics changes.
- No route shell/navigation changes.
- No broad `globals.css` / `premium-ui.css` cleanup.
- No OpenPencil source mutation without a separately proven design gap.
- No blind visual baseline update.

## Allowed paths

- `.agents/current/**`
- `frontend/app/service-worker-update.css`
- `frontend/components/service-worker-update-semantic-css-ownership.test.ts`
- `frontend/e2e/service-worker-update.spec.ts`

## Prohibited paths

- Backend/API/schema/migrations.
- Service Worker runtime implementation files unless a reproduced non-visual defect proves they are required.
- Other route presentation files.
- Design source files.
- Workflows/dependencies.

## Runtime owners

- `ServiceWorkerRegistration` remains the lifecycle/state owner.
- `service-worker-update.css` remains the sole presentation owner for `.lx-sw-update`.
- `appearance.css` / `design-tokens.css` own the semantic `--ak-color-*` values consumed by the surface.

## Documentation owners

- `.agents/current/**` for branch-local execution context.
- Issue #681 / PR #682 for immutable evidence.

## Invariants

- Available/deferred/applying/error/updated behavior and accessible roles stay unchanged.
- Existing geometry, responsive placement, touch targets, pointer behavior and reduced-motion semantics stay unchanged.
- Light/Dark styling must be derived from semantic tokens rather than a route-specific redesign.
- Legacy purple/cyan/navy paint must not compute on the live update surface.

## Acceptance criteria

- Light and Dark update surfaces consume current surface/text/primary semantic tokens.
- Primary action has no legacy purple→cyan gradient.
- Success/error variants use retained/weak semantic tones with readable contrast.
- Effective computed styles are asserted for update, success and error states.
- Source contract fails closed on reintroduction of the known legacy paint.
- Full immutable-head CI is green before merge.
- Runtime merge receives exact-main CI and exact-SHA Stage/public validation.

## Required checks

- Frontend lint/typecheck/Vitest/build/dependency audit.
- Controlled Service Worker browser gate including `service-worker-update.spec.ts`.
- Full PR CI and review/thread audit.
- Exact-main push CI and Stage/public validation after merge.

## Risks

- Generic button rules imported later could accidentally override update-action paint; browser computed-style evidence must prove effective ownership.
- Success/error foreground contrast can regress if raw retained/weak tokens are used directly against the wrong surface.
- Explicit appearance and system color-scheme must remain deterministic.

## Rollback

Revert the atomic #681 presentation/test squash merge; Service Worker runtime semantics are unchanged by this slice.
