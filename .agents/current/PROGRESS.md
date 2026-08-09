# Current Task Progress

## 2026-08-09 15:36 Europe/Moscow

### Verified

- Latest repository `main` is `b75d8a4c3a5fbba2be94c091f1e27ab6f9306c86`; docs reconciliation PR #451 is merged and its docs-only CI/Stage scope validation completed successfully.
- Latest deployed product remains `dcc03d589a660fff6bd56872a53e5b7f3560d09a` from PR #450.
- Issue #74 remains open for residual live-control inventory/remediation and physical-device acceptance.
- Guest `/dictionary` renders `CatalogKindNavigation` with `Слова и термины` and `Рабочие фразы`.
- `information-architecture.css` paints these buttons at 44px minimum height above 640px and 48px at <=640px.
- Phrases already gives the shared buttons a 44/48px effective owner; Dictionary's route-scoped touch layer omitted them.
- `e2e/dictionary-catalog-touch-targets.spec.ts` is already collected by both blocking UI and accessibility commands.
- Draft PR #452 targets exact base `b75d8a4c3a5fbba2be94c091f1e27ab6f9306c86`.
- Exact base/head diff contains only the six allowed files and remains zero commits behind `main` at the latest audited point.
- PR #452 has no review comments, submitted reviews or unresolved review threads.

### Finding

A coarse-pointer guest Dictionary viewport wider than 640px exposed the shared catalog-kind buttons with only the 44px painted target. They lacked the 48px coarse-pointer effective target required by Issue #74.

### Root cause

`frontend/app/dictionary-catalog-touch-targets.css` owned quick filters, filter-panel buttons and pagination but omitted `.lx-catalog-kind-navigation button`. The existing <=640px painted 48px rule masked the omission on compact mobile widths.

A separate acceptance-fixture defect was then exposed by full CI: the shared `beforeEach` installed the authenticated quality-gate fixture and its `lexigo_csrf` cookie. The guest target test replaced the API interceptor with `authenticated: false` but reused that cookie. Its intentional 401 `/api/v1/auth/refresh` response was therefore interpreted by production session bootstrap as an expired authenticated session and redirected `/dictionary` to `/profile` before any target geometry assertion ran.

### Changed files

- `.agents/current/TASK.md` — exact slice ownership and PR binding.
- `.agents/current/PROGRESS.md` — pre-flight, root causes, CI failures and delivery progress.
- `.agents/current/EXECUTION.md` — execution tooling and evidence.
- `frontend/app/dictionary-catalog-touch-targets.css` — adds the shared catalog-kind buttons to the existing route-scoped transparent 44/48px block-axis hit owner.
- `frontend/components/dictionary-catalog-touch-target-source.test.ts` — locks guest runtime/shared control ownership, canonical 44/48 paint boundary and exact wide-coarse browser-proof expression.
- `frontend/e2e/dictionary-catalog-touch-targets.spec.ts` — adds guest real-hit acceptance at 768px fine/coarse plus compact 390px coarse, non-overlap, focus, navigation and overflow assertions; explicitly clears the inherited authenticated cookie before installing the guest API fixture.

### Checks passed

- Repository/harness pre-flight and mandatory instruction read.
- Exact `main` SHA verification.
- Previous reconciliation post-merge CI and Stage skip validation.
- Static owner/runtime audit proving the residual gap and existing collection path.
- Write/readback verification for every product mutation.
- Exact diff path audit: six changed files, all allowed; no runtime component, package script, dependency, lockfile, workflow or visual-baseline drift.
- PR #452 CI #3114 lint and typecheck passed; 108/109 frontend unit files and 667/668 unit tests passed before the source-contract failure.
- CI #3114 failure was isolated to a brittle source assertion that searched for the nonexistent literal `width: 768`; runtime/CSS/type checking did not fail.
- The source contract now binds the actual viewport collection expression `testInfo.project.name === "desktop-chromium" ? [768] : [768, 390]` and was read back from the branch.
- PR #452 CI #3117 / run `31314616314` passed backend unit/security, backend integration, frontend core, content security, lesson completion, Dictionary smoke, iOS PWA Dictionary, controlled service worker, accessibility audit, Linux visual regression and performance budgets.
- Specific UI artifacts `9038450640` (shard 1/2) and `9038451269` (shard 2/2) proved the new guest target test failed before geometry in desktop Chromium, Android Chromium and iOS WebKit, including retries: the accessibility state showed `Сессия истекла` and Profile content instead of guest Dictionary.
- The guest fixture now executes `context.clearCookies()` after removing the authenticated API route and before installing `installQualityGateAPI(context, { authenticated: false })`; the changed E2E path was read back at blob `31db04cace8e21d7eaff7cc2b068326e9a3be0cb` on head `04503fd992109a4041e6b41db239aefdd83676e1`, with `main` unchanged.
- CI #3118 / run `31317754487` started successfully on `04503fd992109a4041e6b41db239aefdd83676e1`; classifier passed and early backend/frontend gates were progressing normally. That run is intentionally superseded by the final execution-state writes so the required full CI can run on the actual final developer-authored head.

### Checks failed

- PR #452 CI #3114 / run `31314481248` failed frontend unit at `dictionary-catalog-touch-target-source.test.ts`: the assertion expected `width: 768`, while the browser spec intentionally defines width through the `widths` array. This was a test-contract wording defect, not a product/runtime failure, and is fixed.
- PR #452 CI #3117 / run `31314616314` failed only blocking UI shards 1/2 because the new guest scenario inherited the authenticated `lexigo_csrf` cookie from `beforeEach`; the guest refresh fixture returned 401 and production correctly redirected to Profile as an expired session. This was a stale fixture-state boundary, not a CSS/runtime defect, and is fixed by explicit cookie isolation.

### Current branch head

Resolve from live PR #452 after the final execution-state write.

### Next action

Require a fresh full CI run on the final immutable developer-authored PR head. If green, re-audit diff/reviews/branch freshness, mark Ready, expected-head squash merge, then validate exact-SHA main CI and Stage/public runtime before the separate docs-only Agent Harness reconciliation.