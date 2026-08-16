# Current Task Progress

## 2026-08-16 Europe/Moscow

### Verified

- Issue #201 design gate merged by PR #556 at `13d51e97514b1b521d641028169c2a7b49f68890`.
- Post-design reconciliation PR #557 merged at `c29e4aa4ef4f299be36a3fd82800bb05cc723581`; runtime branch `feat/issue-201-first-use-runtime` still has that exact `main` as its base.
- Draft PR #558 implements the approved First Use runtime without backend/API-schema/OpenPencil/Figma/deploy changes.
- Guest `/` is owned by `LexigoGuestHomeApp` and does not request or synthesize authenticated progress/scheduler state.
- Authenticated `/onboarding` is owned by `LexigoOnboardingApp` and has canonical App Router page `frontend/app/onboarding/page.tsx`, preventing the client island from mounting over a Next not-found subtree.
- Existing backend onboarding contract remains `status/start/mark/complete/skip`; reveal occurs only after successful mark mutation and reload/direct entry resumes server state.
- Focused Guest Home/onboarding route chrome is suppressed through scoped First Use CSS without changing the navigation owner.
- Accessibility root causes from exact head `760be554...` were fixed rather than suppressed: Light foreground contrast, progressbar semantics and the competing server 404 DOM subtree.
- Exact head `a730ca706a2a3c3ebc676e3a67349ce62ab6a537` passed Accessibility and both UI shards. UI shard 1 required one clean rerun on the same immutable SHA after two unrelated pre-existing browser flakes; the rerun passed without product or unrelated test changes.
- Exact-head visual artifact `frontend-playwright-report-visual`, artifact id `9264591775`, digest `sha256:075d709bce980fc01f6caeba2d1d7990392b9e8f458ce29db58031b8dc384d3b`, was manually reviewed across all eight First Use Linux PNGs.
- Reviewed PNGs cover Guest Home compact/desktop Light/Dark, onboarding role compact Light/Dark and diagnostic resume desktop Light/Dark. No Next 404 overlay, ordinary route chrome, horizontal overflow or Light/Dark structural mismatch was accepted.
- Reviewed SHA-256 fingerprints are now committed in `frontend/e2e/first-use-visual.spec.ts`.
- `frontend/docs/adaptive-knowledge-coach.md` now records OpenPencil First Use `activeScreens` and the actual Guest Home/onboarding runtime owners.

### Changed files

PR #558 currently changes only the scoped First Use runtime, route/auth helpers, First Use CSS, source/unit/browser/accessibility/visual coverage and current-task/handoff documentation. Backend, API schema, design source and deploy topology remain untouched.

### Checks passed before final-baseline commit

- Frontend lint, TypeScript, unit tests, production build and dependency audit.
- Accessibility E2E on exact `a730ca706a2a3c3ebc676e3a67349ce62ab6a537`.
- UI shard 1/2 on exact `a730ca706a2a3c3ebc676e3a67349ce62ab6a537` via same-head rerun.
- UI shard 2/2 on exact `a730ca706a2a3c3ebc676e3a67349ce62ab6a537`.
- Manual inspection of the exact-head visual artifact and acceptance of all eight deterministic Linux hashes.

### Checks failed / classified

- The historical Controlled Service Worker failure at `Prepare isolated frontend workspace` was an infrastructure/MCR transient and was not addressed with product code.
- Earlier UI shard failures were traced to the server 404 overlay, stale Guest Home test expectations, a WebKit test-settlement race and unrelated existing browser flakes. Product code was changed only for the confirmed First Use defects; stale/racy First Use tests were corrected, and unrelated flakes were handled by same-head rerun.
- Visual regression intentionally remained red while hashes were `PENDING_MANUAL_REVIEW`; hashes were accepted only after Accessibility + both UI shards were green and exact-head PNGs were inspected.

### Current branch head

Resolve from live PR #558 after this handoff update. This next live head is the final immutable-head CI candidate; no Ready/merge action is allowed until its complete required CI is green.

### Next action

Run and audit the complete CI matrix on the final live PR head. If green, audit diff/scope and review threads, mark PR #558 Ready, merge with an expected-head guard, validate exact merged-main CI and Stage/public runtime SHA, then perform the required reconciliation PR and only then close Issue #201.
