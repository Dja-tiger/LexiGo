# Current Task Execution

## Task

- Issue: #201 runtime implementation
- Branch: `feat/issue-201-first-use-runtime`
- Base SHA: `c29e4aa4ef4f299be36a3fd82800bb05cc723581`
- Head SHA: resolve from live PR #558 after this execution handoff commit
- PR: #558, Draft until final immutable-head CI and review gates are green

## Skills used

### production-safe delivery

Purpose: implement the approved First Use flow without changing delivered backend/design contracts and carry the runtime slice through immutable-head CI, review, merge, exact-main and Stage validation.

Instruction source: root `AGENTS.md`, mandatory `.agents/AGENTS*.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `docs/agent-harness.md`.

Version or verification date: 2026-08-16.

Inputs: Issue #201, merged PR #556 OpenPencil First Use matrix, backend #18 onboarding implementation, reconciled main `c29e4aa4...`, Draft PR #558.

Files inspected: mandatory harness files; Issue #201 and PR #558; onboarding backend/state handlers; `LexigoBootstrappedApp`; Guest Home/Home/onboarding route owners; auth-return/navigation helpers; First Use CSS; App Router pages; source/unit/browser/accessibility/visual tests; exact-head CI job logs and Playwright artifacts; `docs/figma/openpencil-screen-map.json`; `frontend/docs/adaptive-knowledge-coach.md`.

Actions performed:

1. Verified live `main` remained `c29e4aa4ef4f299be36a3fd82800bb05cc723581` before each runtime write.
2. Opened exact Accessibility failure evidence for original head `760be554...` instead of weakening the gate.
3. Identified three real First Use accessibility/DOM defects: insufficient Light contrast, invalid `aria-label` on neutral progress containers and `/onboarding` mounting its client island over an App Router not-found subtree because no canonical page existed.
4. Added `frontend/app/onboarding/page.tsx`, semantic progressbars and WCAG-AA Light foreground tokens. Added source/unit regression coverage for route existence, progress semantics and contrast.
5. Corrected stale First Use E2E expectations and a WebKit route-settlement race without changing unrelated product behavior.
6. Repeated exact-head Accessibility/UI validation. At `a730ca706a2a3c3ebc676e3a67349ce62ab6a537`, Accessibility and UI shard 2 passed; UI shard 1 contained only unrelated pre-existing browser flakes and passed on a clean rerun of the same immutable SHA without code changes.
7. Downloaded exact-head visual artifact `9264591775`, manually inspected all eight Linux PNGs and computed/verified their SHA-256 fingerprints before accepting them in `frontend/e2e/first-use-visual.spec.ts`.
8. Synchronized `frontend/docs/adaptive-knowledge-coach.md` with the PR #556 OpenPencil First Use `activeScreens` mapping and actual Guest Home/onboarding runtime ownership.
9. Kept backend, API schema, OpenPencil/Figma source and deploy topology out of scope.

Commands or procedures: GitHub App reads/writes; GitHub Actions exact-head job inspection and same-head job rerun; downloaded Playwright artifacts for exact-head diagnostics; local read-only unzip/SHA-256/image inspection of CI artifacts.

Artifacts produced:

- canonical `/onboarding` App Router page;
- dedicated truthful Guest Home and server-backed onboarding runtime;
- First Use CSS/accessibility/runtime regression coverage;
- deterministic reviewed Linux First Use visual hashes;
- updated route/design handoff and current task evidence.

Result: functional/accessibility/UI/manual-visual gates are complete through the reviewed pre-baseline head. The live branch head after this handoff commit is the final immutable-head CI candidate and must pass the complete repository-selected CI matrix before PR #558 can leave Draft.

Failures and root causes:

- Historical Controlled Service Worker `Prepare isolated frontend workspace` failure: transient infrastructure/MCR issue; no product change made.
- Initial Accessibility failure: real First Use contrast/semantics plus client island mounted over server 404 DOM; fixed at source.
- New unit failure after adding contrast regression: test parser captured `fu-` prefix incorrectly; fixed in the test parser, while all other unit tests were green.
- Earlier UI failures: Next 404 overlay; stale logout Guest Home assertion; ambiguous global alert due normal Next route announcer; WebKit Back invoked before Profile route owner settled. First Use tests were corrected only where their contract/race was wrong.
- Exact `a730...` first UI shard attempt: unrelated active-lesson keyboard timing and backend phrase middle-click/new-tab flakes. Same-head rerun passed, proving no First Use product workaround was required.
- Visual job before baseline acceptance: intentionally failed because all eight fingerprints were `PENDING_MANUAL_REVIEW`; hashes were committed only after ordered gate completion and manual PNG inspection.

Limitations: no direct local Git checkout is used as repository authority; live GitHub refs, CI jobs and artifacts remain authoritative. Stage evidence is intentionally deferred until after expected-head merge because this is a runtime-changing slice.

Reusable lessons:

- A persistent client route owner does not make a URL a valid App Router route; every focused client island needs a canonical server route page or it can mount over a not-found subtree that breaks accessibility and pointer events.
- Scope global Playwright role assertions to the product owner when the framework legitimately owns route-announcer semantics.
- For browser history tests, wait for the destination route owner, not merely the URL, before invoking Back/Forward.
- Treat deterministic visual hashes as approvals, not generated snapshots: inspect exact-head PNG evidence first, then commit fingerprints.
- When unrelated CI flakes appear, rerun the failed job on the same immutable head before expanding product or test scope.
