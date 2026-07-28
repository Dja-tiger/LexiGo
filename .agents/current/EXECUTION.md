# Current Task Execution

## Task

- Issue: #70
- Branch: `refactor/issue-70-remove-phrases-compatibility`
- Base SHA: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`
- Head SHA: resolve from live branch ref
- PR: #282

## Skills used

### GitHub repository workflow

Purpose:

Inspect exact repository state, reconcile repository memory, create branch-scoped commits, audit CI/reviews and deliver one atomic runtime deletion through expected-head squash merge and exact-SHA deployment validation.

Instruction source:

- `skills://plugins/github/github/skill.md`
- repository `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/SKILLS.md`
- all mandatory specialized documents referenced by the harness
- `docs/agent-harness.md`

Version or verification date:

2026-07-28

Inputs:

- Repository `Dja-tiger/LexiGo`
- Issue #70
- Runtime base `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`
- Phrases reachability proof PR #277 and merge `928b026e0bf694f07043986bec12f70374405dde`
- Repository-memory reconciliation PR #278 and merge `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`
- Active runtime PR #282

Files inspected:

- all mandatory Agent Harness documents and specialized Issue #70 rules
- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/docs/compatibility-cleanup.md`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-phrases-app.tsx`
- exact ranges across all 3,106 base lines of `frontend/components/lexigo-premium-app.tsx`
- live PRs, branch refs, Issues #12/#70, CI jobs, workflow artifacts and stage evidence

Actions performed:

- reconciled stale repository memory in documentation-only PR #278 before runtime work;
- created the runtime branch from exact live `main`;
- proved canonical guest/auth Phrases reachability before the compatibility fallback;
- audited each deletion candidate against all route and shared lesson-domain consumers;
- removed the unreachable route-level Phrases catalog/detail family;
- preserved `DEFAULT_PHRASE_CATALOG`, `sortLearningItems`, `sortCatalogEntries`, phrase source, mixed lessons, cloze review and answer suggestions;
- narrowed all-items sort wiring without changing behavior;
- converted the source test from a deletion manifest to an executable absence/preservation contract;
- updated the compatibility delivery document with the completed runtime boundary and separate CSS stop conditions;
- restored/deleted every temporary workflow/script artifact before validation;
- ran full CI on the cleaned developer-authored head.

Commands or procedures:

- immutable-SHA and branch-ref reads through the GitHub connector;
- exact branch creation and readback before writes;
- direct source-range inspection rather than indexed-search claims;
- contents writes with current blob SHA preconditions;
- exact compare audits against the immutable base;
- fail-closed anchor counts, required/retired marker checks and changed-path guards for the one unavoidable large-file patch;
- workflow/job/run inspection for all CI stages;
- readback of final source, test, documentation and Agent Harness files.

Artifacts produced:

- runtime deletion in `frontend/components/lexigo-premium-app.tsx`;
- absence/preservation source contract in `frontend/components/phrases-route-island-source.test.ts`;
- completed deletion evidence in `frontend/docs/compatibility-cleanup.md`;
- current task, progress and execution records;
- full CI #2332 / run `30387953394` evidence for cleaned head `410167a9635dd971f27ed407238c688dd9623754`.

Result:

- The unreachable Phrases catalog/detail compatibility family is removed.
- Runtime source changed by 11 additions and 334 deletions, net `-323` lines.
- Final intended diff contains exactly six declared files.
- No CSS, visual baseline, backend, API, migration, deployment, permanent workflow or bundle-budget file is changed.
- Existing route budgets remain unchanged.
- Cleaned validation head `410167a9635dd971f27ed407238c688dd9623754` passed the complete product CI matrix.

Failures:

1. Temporary patcher v1 run `30385938542` failed before commit because a multiline literal anchor inherited YAML indentation.
2. Re-created branch-only workflow files did not produce a usable Actions registration.
3. The first valid existing-workflow patch attempt failed its final marker check because `sortLearningItems` remained in the source.

Root cause:

- The GitHub connector exposes full UTF-8 file replacement but no line-patch operation.
- Manually reproducing a 3,106-line TSX file would have created unacceptable corruption risk.
- Branch-contained workflow registration behavior was unsuitable for repeated temporary definitions.
- The apparent `sortLearningItems` deletion candidate had a live consumer in shared guest phrase lesson browsing and therefore was not dead.

Fallback:

- Use a temporary exact-branch job in an existing workflow already registered on `main`.
- Keep the patch script fail-closed with exactly-one anchor checks, required shared markers, retired markers and exact changed-path validation.
- Stop on every mismatch before commit.
- Preserve newly identified live shared consumers.
- Immediately restore the existing workflow byte-for-byte and delete temporary scripts/workflows.
- Add later developer-authored source-contract/documentation/Agent Harness commits before authoritative CI.

Successful temporary patch evidence:

- Actions-storage run: `30387731574`.
- Patch job: `90371422604`.
- Source-only bot commit: `dfc1fc21ce33bdf1c7767aec3340bad429c5da63`.
- Restored workflow base blob: `5df1e1e1e08d14b558249945949c9b5175d62b4a`.
- All temporary workflow/script files absent from final compare.

Validation evidence:

- Cleaned developer-authored head: `410167a9635dd971f27ed407238c688dd9623754`.
- Full CI: #2332 / run `30387953394` — success.
- Change classifier and routing contract — success.
- Frontend lint, TypeScript, unit/source tests, production build and dependency audit — success.
- Backend unit/race/security/integration — success.
- UI shards 1/2 and 2/2 — success.
- Content Security, Dictionary smoke, Accessibility and iOS PWA — success.
- Lesson completion, controlled Service Worker, Linux visual regression, performance budgets and container builds — success.
- No CSS baseline or bundle-budget update was made.

Limitations:

- CI #2332 validates the cleaned runtime diff before final Agent Harness evidence updates. Because those updates change the branch head, the complete matrix must run once more on the final immutable developer-authored head before merge.
- This slice proves only the Phrases route-runtime family dead. It does not prove the complete `LexigoPremiumApp`, auth fallback or associated CSS dead.
- CSS selectors require a separate atomic consumer/specificity/computed-cascade/visual audit.

Reusable lesson:

For large-source deletion work when the connector lacks patch semantics:

1. prove route reachability and shared consumers before editing;
2. treat every candidate as live until exact source evidence proves otherwise;
3. use fail-closed exact anchors and changed-path guards rather than reconstructing the full file;
4. stop when a marker survives, because it may reveal a legitimate shared consumer;
5. remove all temporary automation before validation;
6. require a later developer-authored immutable head and a full final CI run;
7. keep runtime and CSS deletion as separate atomic slices unless computed ownership and visual evidence are independently complete.
