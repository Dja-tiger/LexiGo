# Current Task Progress

## 2026-07-27 — Draft PR #251

### Verified

- Live `main` remains `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`.
- Issue #250 is open; Draft PR #251 owns the only active product slice.
- Branch `perf/issue-250-home-island` is based on the exact current `main` and does not modify deployment configuration.
- Mandatory Agent Harness, architecture, Home Figma handoff, Progress island lessons, bundle budget contracts and live GitHub state were read before writes.
- Stage runtime remains exact product SHA `a617dfce331700d0b3e911726d52a2683f18d526`, run `30256018000`, with deploy/public smoke/public browser success and 12/12 checks.

### Implemented

- Added dedicated `LexigoHomeApp` under the persistent bootstrap owner.
- Generalized route ownership to Home/Dictionary/Product graphs and canonicalized history before graph replacement.
- Added one-time `/lesson/active?resume=1` consumption through the existing Active Lesson resume action.
- Preserved active > due > new > manual next-action ordering and blocked new lesson creation after an active-lesson lookup failure.
- Preserved standalone PWA relaunch restoration and one logical immutable read across short route-graph handoffs.
- Added source ownership, unit, production-root and Playwright contracts.
- Updated README, architecture, Figma handoff and current Agent Harness memory.

### Behavioral CI evidence

- CI #2120/run `30273535972` passed the complete required matrix on developer-authored head `660983ec8773186a719c2f6a0f1317fa65723245`.
- Frontend lint, typecheck, 421 unit tests, production build and dependency audit passed.
- Backend unit/security and integration passed.
- UI shards 1/2 and 2/2, Chromium/WebKit, Android/iOS PWA, accessibility, visual, CSP, service-worker, lesson-completion and performance jobs passed.
- The Back/Forward regression was fixed in the shared `createNavigationHistoryState`: History owners preserve `lexigoRouteGraph`, while Next.js internal state is not copied. A unit contract protects the boundary.

### Controlled Home measurement

- Successful performance jobs do not upload the detailed route report, so a single post-report test-only assertion was authorized after the full behavioral matrix was green.
- Controlled CI #2122/run `30275645894` on head `dd35a8f3266aa9358f60a6f05abe2076cf404768` completed the production build and all route measurements, then failed only at the intentional final assertion.
- Performance artifact `8656783937`, digest `sha256:796d3b3f2b569d2bbc777ec52664464b6a5514d0b529e35af090c93b32230a69`, records `/` at 207,675 JavaScript bytes and 18 initial requests.
- Relative to the original 238,257-byte Home graph, the reduction is 30,582 bytes or 12.8%.
- Permanent Home limits are now 235,000 JavaScript bytes and 21 initial requests.
- The temporary assertion was removed byte-for-byte; `frontend/e2e/route-bundle-budget.spec.ts` is restored to blob `304e7c62d3163a59edac3e648246e2aa4ce00660`.
- `bundle-budgets.test.ts` now stores the immutable original monolithic transfer and release limits independently from the extracted Home route.

### Failure classification and fixes

- PWA relaunch: standalone last-route restoration still lived inside `LexigoPremiumApp`, so direct `/` entry into Home could not restore the saved Dictionary route. Restoration is now owned by `RoutedLexigoApp` before route-graph handoff.
- Security/lesson flow: the browser fixture returned 404 from `/api/v1/lessons/active` even after a successful lesson POST. The fixture now persists the created lesson and serves it on the next authenticated GET, matching server ownership across route graphs.
- Visual system state: the extracted Home header omitted the reviewed streak control. The original flame icon and current-streak button were restored inside Home without changing the Figma hierarchy or promoting a new visual hash.
- Back/Forward: `LexigoPremiumApp` scroll snapshot writes replaced `history.state` and removed `lexigoRouteGraph`. All History owners now use the shared state constructor, preserving only LexiGo-owned accessibility and graph fields.
- Final CI #2130/run `30276740022`: frontend unit failed because the first generalized helper incorrectly required the existing Progress ceiling `240000` to be below the old measured transfer `238257`. The Progress contract is below the original release ceiling `275000` and within 16% of its own measured baseline. The helper now preserves that established semantic, while Home keeps the stronger explicit requirement `235000 < 238257`. No production code or budget value changed.

### Next action

Run the full required matrix on the corrected final developer-authored head with the permanent Home budget and no measurement probe. After success, verify the focused diff and review state, mark PR #251 Ready, perform expected-head squash merge and complete exact-SHA stage/public validation.
