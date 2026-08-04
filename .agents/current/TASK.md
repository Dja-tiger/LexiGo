# Current Task

## Identity

- Issue: #70
- Branch: `agent/issue-70-public-webkit-sw-guard`
- Base SHA: `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Restore trustworthy exact-image stage validation by classifying the known iOS WebKit service-worker cancellation emitted during stale-build guard recovery without hiding a real registration or runtime failure.

## Scope

- Restrict the public-browser diagnostic exemption to WebKit, the active stale-build recovery window and the exact same-origin current-build `sw.js` URL.
- Normalize the WebKit split `Error.name`/`Error.message` diagnostic before exact comparison.
- Add adversarial assertions proving Chromium, inactive recovery, another build and API requests remain fatal.
- Require the recovered browser to retain the route, clear stale state, register the exact current-build service worker and expose no service-worker error UI.
- Run full immutable-head CI, expected-head squash merge and exact-SHA stage/public validation.

## Non-goals

- No production service-worker, build guard, route, API or UI behavior change.
- No broad access-control error suppression.
- No retry, timeout, Playwright version or deployment workflow change.
- No visual baseline, performance budget, dependency or backend change.
- No final Issue #70 closure before exact-image stage/public success and Agent Harness reconciliation.

## Allowed paths

- `frontend/e2e/public-runtime-smoke.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- production frontend runtime and public service-worker files
- `.github/workflows/**`
- bundle budgets and visual snapshots
- backend, API, migrations and deployment scripts
- `.agents/PROJECT_STATE.md` before product merge and stage validation

## Runtime owners

- `frontend/lib/build-version-guard.ts` — stale-build cleanup and cache-busted recovery.
- `frontend/components/service-worker-registration.tsx` — current-build service-worker registration and error presentation.
- `frontend/lib/service-worker-update.ts` — canonical build-scoped service-worker URL.

## Documentation owners

- `.agents/PROJECT_STATE.md` after this blocker slice passes merge and exact-image stage/public validation.
- `.agents/current/**` during the active blocker slice.

## Invariants

- Every page crash and non-exact page error remains fatal.
- The exemption is impossible outside WebKit or outside the active stale-build recovery window.
- Only the exact expected current-build service-worker URL may match.
- A different build, origin/path or API request remains fatal.
- Recovery must still clear stale cache/recovery markers, preserve route/search/hash and register the current-build worker.
- Service-worker registration error UI must remain absent.
- No production runtime or deployment behavior changes.

## Acceptance criteria

- The previously observed WebKit split diagnostic normalizes to the exact current-build service-worker cancellation.
- Adversarial filter assertions fail closed for Chromium, inactive recovery, another build and API cancellation.
- Public stale-build recovery asserts the exact current-build registration after cleanup.
- The exact-image public iOS WebKit check passes without masking unrelated errors.
- Full immutable-head CI, expected-head merge, exact-SHA main CI and stage/public browser validation succeed.

## Required checks

- Frontend lint, TypeScript, unit/source contracts and production build.
- Full public runtime Playwright coverage in Chromium and iOS WebKit.
- Full required frontend/backend/browser/accessibility/visual/performance/container matrix.
- Exact-SHA main CI and exact-image stage/public validation after merge.

## Risks

- WebKit may format the diagnostic differently; normalization must remain narrow and test-covered.
- A broad regex could hide a real cross-origin or registration failure.
- The service-worker registration may need bounded time to become active after guard cleanup.

## Rollback

Revert the public runtime test classification and current Agent Harness records. No production, data, API, service-worker or deployment rollback is required.
