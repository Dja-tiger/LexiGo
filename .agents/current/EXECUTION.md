# Current Task Execution

## Active delivery

- Issue: #70.
- Branch: `test/issue-70-navigation-mobile-cascade-evidence`.
- Verified base and merge base: `626b6f637f517253aea87faf12223e4e43bfc1e0`.
- Draft PR: #364 — `test(frontend): prove navigation mobile cascade owners`.
- Initial immutable candidate: `afce1afd42afc5e206edd9f52d94ae358b11f1eb`.
- Browser-fixture correction commits: `45de7c33618ef9d7d49135c308c2f6335cee8c59` and `c83c31e3783a0ef42700063cd892a7415b1fd222`.
- Latest branch commit before this execution update: `cb6e559464e7e5e62f8719dc5586d557ad2cf30a`.
- Final authoritative head: resolve from live PR after this write.

## Applied procedures

- Re-read live `main`, Issue #70, current Agent Docs, open PR inventory, CI and stage before writes.
- Kept Dependabot PRs #304–#306 outside the active slice.
- Re-applied computed-cascade rules: browser-computed behavior is authoritative; fixture defects must not be misclassified as production CSS defects.
- Limited the slice and its correction to proof/test/current-context paths.

## Source evidence

`frontend/components/navigation-mobile-shell-css-ownership.test.ts`:

- parses the durable global overlap manifest from `unknown`;
- requires exactly 37 `requires-proof` items and exact pair counts 21/10/6;
- verifies production import order premium → mobile PWA → adaptive navigation;
- verifies premium/mobile 760px, adaptive compact 719px and adaptive tablet 720–1099px boundaries;
- protects mobile PWA, adaptive tablet and premium declaration inventories;
- requires the browser spec exactly once in both authoritative UI scripts;
- requires a `width=device-width, initial-scale=1` viewport meta tag and the explicit Playwright viewport call.

## Browser evidence

`frontend/e2e/navigation-mobile-shell-cascade.spec.ts`:

- reads actual production CSS from the repository checkout;
- loads global box sizing/tokens, premium, mobile PWA and adaptive navigation in production order;
- uses production-class shell markup without application API/runtime dependencies;
- uses a complete HTML document with production-equivalent viewport metadata;
- records computed values at 390, 719, 720, 760, 761 and 1024px;
- asserts exactly one visible primary navigation and no horizontal overflow;
- asserts the 719/720 mobile-to-rail switch, 720–760 hybrid owner and 760/761 visual-owner transition.

## Initial authoritative CI #2596 / run `30812873755`

- Exact head: `afce1afd42afc5e206edd9f52d94ae358b11f1eb`.
- Frontend core, backend unit/security/integration, Dictionary smoke, service worker, iOS PWA, CSP, accessibility, visual regression, performance budgets, Lesson completion and UI shard 1 passed.
- UI shard 2 job `91683942785` failed only the new cascade spec; aggregate frontend and containers were downstream skipped/failed.
- Downloaded artifact `frontend-playwright-report-ui-2` exposed the exact project and computed snapshots.
- The cases ran under `android-chromium`.
- Without `<meta name="viewport" content="width=device-width, initial-scale=1">`, the mobile-emulation layout viewport stayed approximately 980px even after `page.setViewportSize({ width: 390..760 })`.
- Consequently tablet media queries and premium visual values were correctly selected by the invalid fixture at all four narrow widths.
- The failure was deterministic on retry and was not infrastructure flakiness.

## Root-cause correction

- Added the viewport meta tag and complete document structure to the isolated fixture.
- Preserved all original expected computed values; no expectation was weakened to copy invalid-fixture output.
- Added source-contract enforcement so the viewport meta cannot be silently removed.
- Changed no production CSS, selector, declaration, import order, runtime, dependency, lockfile, snapshot, budget, workflow, README or architecture path.
- Did not rerun the old head; branch updates trigger a new authoritative run on the corrected head.

## Repository safety

- Branch compare remained limited to the six allowed paths.
- Main and deployed stage remained unchanged during failure classification and correction.
- No direct main write, blind retry, timeout increase, browser skip, snapshot update or budget increase was used.

## Validation plan

1. Treat the live PR head created by this execution update as the corrected final developer-authored candidate.
2. Require complete classifier-selected CI on that exact head.
3. Require frontend lint, typecheck, all unit/source contracts, production build and dependency audit.
4. Require complete browser/accessibility/visual/performance/backend/container jobs.
5. Audit comments, reviews and unresolved threads before Ready.
6. Perform expected-head squash merge.
7. Validate exact merge SHA in main CI and stage/public deployment.
8. Reconcile Agent Docs separately before selecting a production correction.

## Next production boundary

Use the corrected browser evidence to choose one navigation/mobile-shell ownership correction only. Candidate mechanisms remain unselected until the full corrected CI passes.

## Rollback

Revert PR #364. Product CSS, runtime, deployed images, database, APIs, snapshots and budgets remain unchanged.
