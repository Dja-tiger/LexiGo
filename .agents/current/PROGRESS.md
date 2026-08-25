# Current Task Progress

## 2026-08-26 00:31 Europe/Berlin

### Verified live state

- PR #693 is the only open pull request and remains Draft on `fix/global-error-semantic-palette`.
- Protected `main` remains `2ceb77a682710aeaed3b27f0f62ea26c0c54af51`; no main drift occurred through the recovery writes below.
- Issue #692 remains open under parent #205.
- The PR diff is intentionally limited to the root-error runtime/presentation/test owners, the route performance contract, and `.agents/current/**`.

### Delivered product intent

- The production-reachable Next.js root `global-error` fallback no longer owns the pre-Foundation fixed dark inline palette.
- Root-error canvas, surface, text, muted text, weak/error accent and actions use current `--ak-color-*` semantic names.
- Root failure detection, diagnostics, retry, version-mismatch Service Worker/cache cleanup, reload and Home navigation semantics are unchanged.
- Appearance still reuses `subscribeAppearanceRuntime()` for explicit Light/Dark and Auto/system resolution.

### Superseded CI #4176

- CI #4176 / run `32887081347` failed only in UI shard 2 during Playwright collection before browser execution.
- Exact failure: `SyntaxError: Cannot use 'import.meta' outside a module` from the first Node-side stylesheet loader.
- The loader was corrected to the frontend workspace `process.cwd()` contract; no runtime behavior or browser assertion was weakened.

### CI #4180 — deterministic failure classification

- Head: `8e0fb1c27d2ae282127e8efc14b561b5bc9ac6fa`.
- Run: `32887884931`.
- Failed jobs: UI shard 1, UI shard 2 and Performance budgets. Frontend core and the other required product/security/browser gates that executed were green.
- UI artifact IDs: shard 1 `9578654579`, shard 2 `9578676502`.
- Performance artifact ID: `9578444394`.

#### UI root cause: stale CSP-incompatible evidence fixture

- Both Light and Dark root-error appearance checks received `rgba(0, 0, 0, 0)` for the synthetic owner instead of semantic canvas paint.
- Playwright trace/console evidence contained an exact CSP `style-src-elem` violation for the test-created inline `<style>` element.
- Production runtime CSS was not disproven: the test injected exact `global-error.css` text but omitted the nonce required by the page's existing `style-src 'self' 'nonce-…'` policy.
- Fix: the evidence now reads the live nonce from an existing stylesheet link or script, fails closed if it is absent, assigns `style.nonce`, then injects/samples/removes the exact stylesheet atomically. React-owned body replacement remains prohibited.

#### Performance root cause: special-boundary CSS leaking into normal-route graph

- JavaScript transfer stayed within budget for every measured canonical route.
- Failures were only `initialRequests`: `/` 22>21, `/learn` 24>22, `/phrases` 23>22, `/dictionary` 24>22, `/words/101` 23>20, `/lesson/active` 23>22, `/scenarios` 22>19 and `/scenarios/incident-update` 21>18. `/progress` and `/profile` passed.
- The normal `/` trace loaded a dedicated CSS chunk containing the root-error selectors while the superseded implementation also imported the full `design-tokens.css` and `appearance.css` owners from `global-error.tsx`.
- Previous runtime `main` exact-SHA CI #4173 / run `32882157881` was fully green, and the only subsequent `main` change before this PR was docs reconciliation. The request regression therefore belongs to the PR boundary, not an unrelated runtime change.
- Fix: `global-error.tsx` now imports only `global-error.css`. That single asset contains only the seven semantic colors consumed by the emergency fallback for base/system-dark and explicit Light/Dark states.
- A fail-closed source contract compares every mirrored token value against canonical `design-tokens.css` / `appearance.css`, preventing silent drift without loading those full owners through the special boundary.
- No JavaScript byte budget changed. Only three previously zero-headroom request ceilings increase by exactly one for the remaining single fallback stylesheet: `/words/101` 20→21, `/scenarios` 19→20, `/scenarios/incident-update` 18→19.

### Changed files in the current recovery scope

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/global-error.tsx`
- `frontend/app/global-error.css`
- `frontend/components/global-error-semantic-ownership.test.ts`
- `frontend/e2e/application-error-boundary-appearance.spec.ts`
- `frontend/bundle-budgets.json`

### Validation status

- Every repository write so far was followed by branch path read-back, branch-head verification and confirmation that protected `main` stayed at `2ceb77a682710aeaed3b27f0f62ea26c0c54af51`.
- Local checkout/test execution remains unavailable because the sandbox cannot resolve `github.com`; no local-green claim is made.
- The current implementation still requires one immutable final-head CI to prove the token synchronization source contract, Chromium/WebKit CSP-compatible Light/Dark evidence, exact request graph, unchanged JavaScript budgets and all remaining required gates.

### Next action

Finish factual execution evidence, verify the exact eight-file diff and no main drift, then use the automatically triggered immutable-head CI as the release gate. Any new failure must be classified from its exact job/log/artifact rather than retried blindly.
