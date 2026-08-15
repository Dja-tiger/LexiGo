# Current Task Progress

## 2026-08-15 22:25 Europe/Moscow

### Verified

- Repository `Dja-tiger/LexiGo`; live base `main` was and remains `b418b2ff0e326eb5cb1d9a017afd2205bdf43a2d` through the current writes.
- Issue #540 has no additional comments and remains the next atomic child of #205.
- Branch `feat/issue-540-phrase-detail-parity` was created from exact base `b418b2ff0e326eb5cb1d9a017afd2205bdf43a2d`.
- Draft PR #541 is open for this branch.
- Live Figma `get_design_context` for canonical node `255:55` is blocked by the connected Starter-plan MCP call limit; repository-approved node mapping remains the evidence source and no fresh cloud synchronization is claimed.
- Existing authoritative owner is `frontend/e2e/phrases-visual.spec.ts`; existing eight content-addressed Phrases hashes and browser-owned 200% zoom owner were preserved by the parity-contract change.
- Direct Phrase Detail runtime is owned by `LexigoPhrasesApp`; guest detail is local content-only, authenticated detail is exact `/api/v1/phrases/{slug}`; actual detail main accessible name is `Карточка фразы`.
- Canonical deterministic content exists for daily (`could-you-help-me-with-this`), travel (`could-you-take-a-photo-of-me`) and technical (`root-cause`) variants.
- After the rejected PR-preparation tool call, target branch remained exactly `26526004066543ef09da65c5fa1539002fba8720` and `main` remained exactly `b418b2ff0e326eb5cb1d9a017afd2205bdf43a2d`; no ref or artifact changed.
- `.agents/AGENTS.tool-selection.md` was re-read and the exact `create_pull_request` schema was reloaded before PR #541 was created.

### Finding

The shared `QUALITY_PHRASES` fixture contains only Incident/Release items and cannot represent the required daily/travel/technical canonical matrix without affecting unrelated suites. The safe contract is therefore test-local: guest cases exercise repository demo content without any detail API request; authenticated cases add a page-scoped handler only for the exact canonical detail slug and leave catalog/metadata/progress handling to the existing quality-gate fixture.

The Issue text mentions semantic `Технические фразы`, but the live source owns Phrase Detail with `#lexigo-main-content[aria-label="Карточка фразы"]` and page metadata `Карточка фразы · LexiGo`. Production runtime was not changed speculatively; the executable parity test follows the current detail owner.

CI #3566 on head `89b0b61f1c285aaf8c6dc8677bf24e35184c828a` produced the first browser evidence. Only the two compact Phrase Detail cases failed, both because the new test unconditionally required `.lx-phrase-detail-side` to be visible. The desktop canonical cases passed and the existing content-addressed Phrases baselines did not fail.

Source inspection classified that failure as a test-contract error, not a product defect: `frontend/app/phrases.css` intentionally applies `.lx-phrase-detail-side { display: none; }` below 768px, and existing `frontend/e2e/phrase-detail-touch-targets.spec.ts` already encodes the same ownership boundary. Compact Phrase Detail keeps the main-card primary action visible; desktop keeps the side practice panel visible.

The test-only fix at `f25dadf51db3e0e20095ff814ca0c20e8e0be22b` therefore changed only assertions: compact cases require the side panel/practice action to be hidden and the primary action visible/enabled; desktop cases retain the visible side-panel contract. No production React/CSS, API contract, snapshots, package/config or workflow files were changed.

### Root cause

Product root cause: none established. The original delivery gap was missing executable canonical Phrase Detail parity coverage for the four approved Figma nodes/states.

CI #3566 root cause: parity-test overassertion. The new contract incorrectly treated the desktop-only side practice panel as a required compact surface, conflicting with the established `<768px` responsive ownership. The fix aligned the new Figma parity contract with the existing responsive source and touch-target contract instead of changing correct product behavior.

Process failure: immediately before intended Draft PR creation, the selected function name was not revalidated against the operation intent and `create_branch` was invoked for the already-existing branch. GitHub rejected it with HTTP 422 `Reference already exists`; therefore no repository state changed. This is the already-documented tool-selection failure category in `.agents/AGENTS.tool-selection.md`, not a new category requiring a duplicate rule.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/phrases-visual.spec.ts`

### Checks passed

- Branch protection pre-flight and exact base/ref readback.
- Figma quota failure classified without fallback to invented design data.
- Source inspection of Phrases route island, Phrase Detail presentation, direct API validator and daily/travel/technical guest catalogs.
- Existing baseline constants remained unchanged; no snapshot update mode was used.
- Rejected `create_branch` call produced HTTP 422 and was followed by exact branch/main ref verification; no rollback artifact was necessary.
- Draft PR #541 was created after exact tool-schema revalidation.
- CI #3566 supplied actionable browser evidence and isolated the only new failures to compact side-panel visibility assertions.
- Responsive source and pre-existing touch-target E2E independently confirmed `.lx-phrase-detail-side` is intentionally hidden below 768px.
- Test-only correction committed at `f25dadf51db3e0e20095ff814ca0c20e8e0be22b`; modified spec blob after correction is `2e405a8219952183355dc2587afb911f6ec1079b`.
- CI #3567 / run `31903772185` on exact `f25dadf51db3e0e20095ff814ca0c20e8e0be22b` passed all source/frontend evidence observed before agent-handoff synchronization:
  - Classify change scope.
  - Backend unit/security and backend integration.
  - Frontend core: lint, type-check, unit tests, production build and dependency audit.
  - Lesson completion.
  - UI shard 1/2 and UI shard 2/2.
  - Controlled service worker.
  - Performance budgets.
  - Content security.
  - Accessibility audit.
  - Visual regression, including the corrected four-case Phrase Detail canonical matrix and unchanged existing Phrases baselines.
  - Dictionary smoke and iOS PWA dictionary.
  - Aggregate `Frontend quality`.
- At the point agent-handoff synchronization began, only dynamically launched container-build jobs on the now-intermediate `f25dadf5...` head were still executing. Their result cannot be used as final-head evidence after documentation commits change the head.
- `main` remained `b418b2ff0e326eb5cb1d9a017afd2205bdf43a2d` through the TASK handoff write; branch became `c52b8a9e6ebfc5d472982a3023ec02bc69c212c4` after TASK synchronization.

### Checks failed or externally blocked

- Fresh live Figma design context: unavailable because the Figma MCP Starter-plan call limit is exhausted. This is an external tool quota, not a product/test failure.
- CI #3566 Visual regression failed the two compact new cases because of the parity-test overassertion described above; the root cause was classified and corrected without production changes.
- Process gate: intended Draft PR creation was initially misrouted to `create_branch`; request was safely rejected before mutation and mandatory recovery was completed.

### Current branch head

Resolve from live branch ref after completing TASK/PROGRESS/EXECUTION handoff synchronization.

### Next action

Synchronize `.agents/current/EXECUTION.md`, read back all handoff files, verify branch/main refs and final allow-listed diff, then treat the resulting SHA as the immutable developer-authored head. Run and require the complete repository CI on that exact SHA, audit PR #541 reviews/threads, mark Ready only when the final-head gate is green, and squash-merge with expected-head protection.
