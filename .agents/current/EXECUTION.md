# Current Task Execution

## Task

- Issue: #70
- Branch: `test/issue-70-prove-home-hero-css-orphaned`
- Base SHA: `df3cd097cbd159a4d441aea4ce783043dabe36ec`
- Head SHA: resolve from the live branch ref after this execution record
- PR: not opened yet

## Skills used

### Repository harness and GitHub delivery

Purpose:

Execute one atomic proof-only Issue #70 slice with exact branch, path, CI, merge and deployment boundaries.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- every mandatory specialized AGENTS document
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `docs/agent-harness.md`
- `README.md`
- `docs/architecture.md`
- `frontend/docs/compatibility-cleanup.md`

Version or verification date:

2026-08-03 against live `main` `df3cd097cbd159a4d441aea4ce783043dabe36ec`.

Inputs:

- Issue #70
- exact live stage status Issue #12
- current compatibility fallback inventory
- canonical Home and compact Home source
- `premium-ui.css` selector inventory

Files inspected:

- mandatory harness and architecture documents
- `frontend/components/compatibility-fallback-source.test.ts`
- `frontend/components/home-route-island-source.test.ts`
- `frontend/components/lexigo-home-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/premium-ui.css`
- `frontend/app/compact-home.css`
- prior orphan-source contracts

Actions performed:

- Verified live main, open PRs, Issue #70 and exact deployed product SHA before writes.
- Confirmed repository memory agrees with live GitHub.
- Created an explicit branch from exact main.
- Defined four allowed paths and prohibited all production CSS/runtime changes.
- Read every written path back from the target branch.
- Compared the branch with exact base and confirmed main remained unchanged.

Commands or procedures:

GitHub connector reads/search, exact branch creation, explicit branch writes, file readback and exact base comparison.

Artifacts produced:

- atomic task and progress records
- `frontend/components/home-hero-orphan-source.test.ts`

Result:

The proof slice remains bounded to one source contract and `.agents/current/**`.

Failures:

None before CI.

Root cause:

Not applicable.

Fallback:

Revert this proof-only branch or PR. No production runtime, CSS, schema, data or API rollback is required.

Limitations:

Indexed GitHub search was used only for candidate discovery. Final reachability evidence is implemented in the actual-checkout Vitest contract and remains subject to complete authoritative CI.

Reusable lesson:

A legacy route deletion does not make similarly named shared shell classes dead. Candidate selection must exclude classes still present in the canonical route markup before constructing an orphan manifest.

### Home hero CSS reachability proof

Purpose:

Prove whether the legacy decorative Home hero family has executable consumers without deleting production CSS or disturbing live Home and compatibility owners.

Instruction source:

- `.agents/AGENTS.issue-70-compatibility-reachability.md`
- `.agents/AGENTS.issue-261-css-specificity.md`
- completed Home boundary PRs #311/#313
- prior actual-checkout orphan-source contracts

Version or verification date:

2026-08-03.

Inputs:

- candidate selector inventory in `premium-ui.css`
- canonical Home markup in `LexigoHomeApp`
- live Lesson/auth markup in `LexigoPremiumApp`
- root layout stylesheet order

Files inspected:

- `premium-ui.css`
- `compact-home.css`
- `layout.tsx`
- `lexigo-home-app.tsx`
- `lexigo-premium-app.tsx`

Actions performed:

- Rejected `.lx-hero-card` and `.lx-hero-art` as deletion candidates because canonical Home executes both.
- Selected only `lx-hero-copy`, `lx-glow`, `lx-floating-card`, `lx-book-base` and `lx-orbit`.
- Counted the exact bounded CSS inventory as 5 + 1 + 4 + 6 + 3 = 19 tokens.
- Added recursive actual-checkout scanning for executable TypeScript/TSX.
- Excluded test/spec files and stripped comments.
- Required zero executable consumers for every candidate.
- Required every candidate to be confined to `app/premium-ui.css` with its exact count.
- Protected exact candidate declaration blocks until a later deletion PR.
- Added positive consumer assertions for canonical Home classes and live compatibility Lesson/auth classes.
- Protected the existing stylesheet import order.

Artifacts produced:

- `frontend/components/home-hero-orphan-source.test.ts`

Result:

The source contract expresses both sides of the boundary: five candidate classes must have no executable consumers, while canonical Home and live compatibility classes must retain executable owners.

Failures:

None before CI.

Root cause:

The legacy compatibility Home presentation was deleted, but decorative hero selectors remain in the shared premium stylesheet. Some adjacent hero shell classes were reused by the canonical Home island, requiring a narrower candidate family.

Fallback:

Remove the proof contract if its assumptions are disproven. Do not alter production CSS to satisfy a failed proof.

Limitations:

A later deletion slice must perform the final computed-cascade audit, convert presence assertions to physical-absence assertions and require unchanged Linux visual hashes.

Reusable lesson:

For mixed legacy/canonical stylesheets, reachability must be established per class rather than per visual block or filename.

## Validation plan

1. Treat the branch head after this execution record as the final developer-authored candidate unless CI identifies a real contract defect.
2. Compare the final branch with exact base and require only the four allowed paths.
3. Open a Draft PR against `main`.
4. Run complete authoritative CI on the immutable head.
5. Require source contract, lint, typecheck, unit tests, build and dependency audit to pass.
6. Require backend, complete browser matrix, accessibility, CSP, PWA, visual regression, performance budgets and both container builds to pass.
7. Do not change production CSS, visual snapshots or performance ceilings.
8. Audit comments, reviews and unresolved review threads.
9. Mark Ready only after complete green CI.
10. Perform expected-head squash merge.
11. Require exact merge SHA main CI and stage/public validation.
12. Reconcile project state and reset current context in a separate Agent Docs PR.

## Rollback

Revert the proof-only PR. No production CSS, runtime, schema, data, migration, dependency or API rollback is required.
