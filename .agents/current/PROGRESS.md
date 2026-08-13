# Current Task Progress

## 2026-08-13 Europe/Moscow

### Product delivery already completed

- Issue #481 product contract was delivered by merged PR #482.
- PR #482 immutable-head CI #3366 passed on `b7eb33fd0e7da8b877217b1ec8f2af93b491f8e9`.
- Product squash merge SHA is `b62470b0051ca60e2bea177ab08945887107822c`.
- Exact-main CI #3367 / run `31675946620` passed fully and published exact-SHA API/web images.
- Initial exact-SHA Stage #3208 / run `31676641895` passed deployment and public frontend/API endpoint smoke.
- Issue #481 remains open because final public browser acceptance was not green on that product SHA.

### Stage blocker diagnosis

- Public Playwright on Stage #3208 passed 11/12 tests.
- Only `public-ios-webkit` stale-build recovery failed, on initial attempt and Playwright retry.
- Exact pageerror shape:
  `Cannot load https: /<stage-host>/sw.js?build=b62470b0051ca60e2bea177ab08945887107822c due to access control checks.`
- The existing classifier was already intentionally narrow: WebKit only, active guard URL required, exact full URL equality required.
- `normalizeRuntimePageError()` handled the known two-slash split diagnostic (`https: //host/...`) but not WebKit 1.61.1's observed one-slash form (`https: /host/...`).
- Therefore the expected current-build guard service-worker cancellation was misclassified as fatal without any service-worker runtime failure.

### Remediation

- Created branch `fix/issue-481-stage-webkit-sw-cancellation` from exact deployed/main SHA `b62470b0051ca60e2bea177ab08945887107822c`.
- Created Draft PR #483 `fix(pwa): normalize WebKit guard cancellation URL`.
- Pre-flight scope is limited to current Agent Docs plus:
  - `frontend/lib/public-runtime-errors.ts`
  - `frontend/lib/public-runtime-errors.test.ts`
- Runtime change is one narrow normalization boundary: split HTTP(S) diagnostics accept one or two slash characters before canonicalization to `://`.
- Regression coverage reproduces the exact single-slash form and retains negatives for Chromium, null guard, wrong build, wrong path and wrong host.
- No service-worker runtime, build-version guard, retry/tolerance, deployment, CI, listening/backend/API or visual baseline changes were made.

### PR #483 pre-freeze CI evidence

- Code/test head before final Agent Docs reconciliation: `9b8b356cdf2d6101d89fc9c3388605e480c168f8`.
- CI #3368 / run `31677368540` completed `success` on attempt 2.
- Frontend core quality: success, including the new focused unit regression.
- Backend unit/security: success.
- Backend integration: success.
- Browser UI shards, Lesson completion, iOS PWA, CSP/content security, Controlled SW, accessibility and performance budgets: success.
- `Frontend quality`: success.
- `Container build (api)` and `Container build (web)`: success.

### Visual Regression attempt evidence

- Attempt 1 failed only `System state Figma visual baselines › compact Dictionary empty light`.
- Expected approved SHA: `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Attempt-1 runner produced `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` on both internal Playwright tries.
- Artifact inspection showed the unchanged empty-state panel with its pre-existing `:focus-visible` ring. `AsyncStatePanel` programmatically focuses empty/error states and the selected hotfix does not touch UI, CSS, system-state fixtures or baseline ownership.
- The Visual Regression job was rerun alone on the identical code SHA `9b8b356c...`; it passed completely without code, fixture or baseline changes.
- No snapshot was promoted and no visual tolerance was changed. This is retained as runner-dependent focus-visible nondeterminism, not a hotfix regression.

### Current state

- PR #483 changed exactly five files before this final reconciliation: three `.agents/current/**` files plus the normalizer and its test.
- `main`/deployed product base for the remediation remains `b62470b0051ca60e2bea177ab08945887107822c` at pre-freeze.
- Parent #25 remains open.
- Issue #481 remains open until remediation merge plus a new exact-SHA Stage run has green deploy, public endpoint smoke and public Chromium+iOS WebKit acceptance.

### Next action

Commit this final Agent Docs reconciliation atomically, resolve/read back the new exact head, freeze the branch, and run one fresh full immutable-head PR CI. If green, perform compare/review safety audit, Ready transition and expected-head squash merge; then require exact-main CI and exact-SHA Stage/public acceptance before closing #481.
