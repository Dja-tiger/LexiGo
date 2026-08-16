# Current Task

## Identity

- Issue: #205
- Branch: test/issue-205-tablet-matrix
- Base SHA: 157c645731604fb39488068397472994b2ea67d1
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Add the missing automated medium/tablet acceptance slice for the final route-by-route parity audit: prove all ten canonical product routes remain structurally usable at exactly 768×1024 in explicit Light and Dark appearance without changing production runtime.

## Scope

- Routes: `/`, `/learn`, `/lesson/active`, `/progress`, `/dictionary`, `/words/101`, `/phrases`, `/phrases/identify-root-cause`, `/profile`, `/onboarding`.
- Exact viewport: 768×1024.
- Explicit Light and Dark appearance.
- Verify the route semantic owner is visible before geometry assertions.
- Verify reduced-motion media is active in the CI browser context.
- Verify document/main content has no horizontal overflow.
- Verify visible interactive controls stay within the horizontal viewport bounds so focus rings are not clipped by layout geometry.
- Fail on page crashes, uncaught errors and unexpected console errors.
- Reuse deterministic route-owned fixtures rather than adding a parallel mock system.
- Register the new spec in the authoritative `test:e2e:ui` command so PR CI actually executes it.

## Non-goals

- No runtime/component/CSS fixes in this PR.
- No pixel screenshots or new visual hashes; route-specific canonical OpenPencil visual baselines already own pixel evidence.
- No duplicate axe, keyboard journey, browser-zoom or physical-device suites.
- No backend/API/schema/design/OpenPencil/Figma changes.
- No claim that umbrella #205 is completed by this slice.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/design-parity-tablet.spec.ts`
- `frontend/package.json` only to add the spec to the authoritative UI E2E collection

## Prohibited paths

- `.agents/PROJECT_STATE.md`
- `frontend/components/**`
- `frontend/app/**`
- other `frontend/e2e/*.spec.ts` or support files
- `backend/**`
- `api/**`
- `design/**`
- `docs/figma/**`
- `README.md`
- `docs/architecture.md`
- `.github/workflows/**`
- `deploy/**`

## Runtime owners

- Existing route owners and their current deterministic fixtures remain authoritative and read-only.
- Existing route-specific visual baselines remain authoritative for pixel parity.
- New tablet matrix owns only consolidated 768×1024 structural evidence.

## Documentation owners

- Live Issue #205 remains the umbrella acceptance owner.
- `.agents/current/**` records this atomic child slice only.

## Invariants

- Test/evidence-only PR; runtime must not change.
- Exact 768×1024 viewport is asserted, not inferred from a project preset.
- Light/Dark is explicit and verified on `<html>`.
- Reduced-motion is verified via `matchMedia`, not assumed from Playwright config.
- Geometry checks are performed in a single current scroll state; no cross-scroll `getBoundingClientRect()` comparisons.
- Progressive controls are asserted only after their owning state is visible.
- A reproduced product defect blocks this audit and is split into a separate Issue/PR rather than hidden by loosening assertions.

## Acceptance criteria

- All ten canonical routes pass at 768×1024 in Light and Dark on the authoritative UI E2E path.
- Correct semantic owner/heading is visible for every route/state.
- No horizontal document overflow.
- No visible focusable control extends beyond the viewport horizontally.
- Reduced-motion media query is true.
- No unexpected browser runtime errors.
- `frontend/package.json` collects the spec in `test:e2e:ui`.
- Immutable-head full CI passes with clean review audit before merge.
- Exact-main CI passes after merge; Stage redeploy is not required because runtime is unchanged.

## Required checks

- Frontend lint, typecheck, unit and production build.
- Authoritative UI E2E shards including the new tablet matrix.
- Existing accessibility, visual, security/PWA/service-worker, performance, backend and container gates selected by repository CI.
- Branch/base/diff and review-thread audit.
- Post-merge exact-main CI.

## Risks

- A generic horizontal-bound assertion can misclassify intentionally off-canvas hidden controls; only currently visible focusable elements may be checked.
- Focused routes (`/lesson/active`, `/onboarding`) have different chrome ownership from ordinary routes and must not inherit ordinary navigation assertions.
- Route fixtures must not fabricate state that production owners do not expose.

## Rollback

Remove the new tablet spec and its `test:e2e:ui` registration. Production runtime is untouched.
