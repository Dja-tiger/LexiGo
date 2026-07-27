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
- Added source ownership, unit, production-root and Playwright contracts.
- Updated README, architecture, Figma handoff and current Agent Harness memory.

### CI evidence

- CI #2088/run `30260797169`: identified two new lint blockers; both were corrected without changing behavior.
- CI #2090/run `30261151746`: lint/typecheck passed; one stale Word Detail source contract still referenced pre-generalization graph names.
- CI #2092/run `30261371231` on head `234ef906434841e34bab07e2a1778e3e45677d61`:
  - classifier passed;
  - frontend lint, typecheck, 418 unit tests, production build and dependency audit passed;
  - backend and dependency-review jobs passed;
  - accessibility and performance shards passed;
  - PWA, security and visual shards exposed three independent compatibility gaps.

### Failure classification and fixes

- PWA relaunch: standalone last-route restoration still lived inside `LexigoPremiumApp`, so direct `/` entry into Home could not restore the saved Dictionary route. Restoration is now owned by `RoutedLexigoApp` before route-graph handoff.
- Security/lesson flow: the browser fixture returned 404 from `/api/v1/lessons/active` even after a successful lesson POST. The fixture now persists the created lesson and serves it on the next authenticated GET, matching server ownership across route graphs.
- Visual system state: the extracted Home header omitted the reviewed streak control. The original flame icon and current-streak button were restored inside Home without changing the Figma hierarchy or promoting a new visual hash.

### Read-back completed

- `routed-lexigo-app.tsx`: standalone restore helper and canonical router replacement confirmed.
- `lexigo-home-app.tsx`: flame icon and streak control confirmed.
- `lesson-flow.spec.ts`: stateful active-lesson fixture confirmed.
- TASK scope updated for the exact compatibility paths.

### Measurement status

The performance shard passed the existing broad limit, but the workflow uploads the detailed report only on failure and therefore produced no exact successful-run artifact. No baseline value has been inferred from build logs or estimates.

### Next action

Run the full matrix on the current immutable head. After all behavioral/visual shards are green, force one controlled measurement-only performance failure to capture the exact `/` JavaScript and request report, then replace the sentinel with the final evidence-backed Home baseline and ceiling.
