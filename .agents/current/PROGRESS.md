# Current Task Progress

## 2026-07-26 03:20 Europe/Berlin

### Verified

- Live `main` remains `56c8bf7b589601510ff60465c68c7482f5a8f320`; product work is isolated in `feat/issue-24-scenario-catalog` and Draft PR #228.
- Canonical authenticated `/scenarios` is implemented as a dedicated route island and consumes `GET /api/v1/scenarios` in exact server order.
- The optional Scenario recommendation remains server-owned through `/api/v1/progress`; catalog readiness is independent from Progress availability.
- `/scenarios` preserves `return_to=/scenarios`, keeps the four-item global navigation, marks `Обучение` active and routes cards/recommendations to the existing focused `/scenarios/[slug]` lifecycle.
- Approved Figma source remains Mobile Light `228:3`, Mobile Dark `228:4`, Desktop Light `228:5` and Learning entry `228:6`.
- CI #1861 (`30180574842`) proved frontend core, backend unit/integration, accessibility, content security, iOS PWA and dictionary smoke before visual acceptance.
- Manual review of CI #1861 actuals found a real `/learn` overlap: the new subsection switch occupied the same top band as fixed route brand/reminder/navigation controls.
- `frontend/app/learning-section-switch.css` now owns compact, medium and desktop placement. Measurement CI #1863 actuals confirm no overlap at 390, 768 or 1440 px.
- Measurement CI #1863 (`30181864359`) on `e608d6f58135d689e06cd49735c6a05bec82c1a3` passed backend unit/security, backend integration, frontend lint/typecheck/unit/build/audit, lesson completion, accessibility, iOS PWA, both UI shards and content security.
- The only intentional failures in CI #1863 were the temporary `/scenarios` request ceiling and pending visual contracts; both jobs uploaded the required artifacts.
- Cold `/scenarios` evidence is `198852` JavaScript bytes and `17` initial requests. Final ceilings are `230000` bytes and `19` requests, with run/head provenance recorded in `frontend/bundle-budgets.json`.
- Reviewed Scenario Catalog Linux actuals are content-addressed: compact Light `390 × 1876`, SHA-256 `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`; compact Dark `390 × 1876`, SHA-256 `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`; desktop Light `1440 × 981`, SHA-256 `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- Reviewed Learning switch actuals are content-addressed: compact `390 × 1212`, SHA-256 `8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9`; medium `768 × 6154`, SHA-256 `4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812`; desktop `1440 × 1656`, SHA-256 `f70cdc58badacd2f13d568f97d05bc38d54121adf3382480cab438baa6f04f9f`.
- Scenario recommendation data is isolated from canonical Progress/calendar visual fixtures, preventing this catalog slice from silently accepting unrelated Progress baseline changes.
- Final candidate CI #1864 (`30182388921`) confirmed the measured performance budget, frontend core, backend unit/security, content security, iOS PWA and dictionary smoke. Its visual job exposed two remaining test-harness defects rather than a product drift.
- The Progress override is moved to the same `BrowserContext` routing layer as the broad quality API fixture, so the last registered exact route deterministically owns `/api/v1/progress`; Scenario catalog tests remove only that exact override and fall back to the full recommendation fixture.
- The no-overlap assertion now requires more than 1 px of overlap on both axes, preserving protection against real collisions while ignoring the desktop switch/rail subpixel boundary contact visible as a clean edge in the reviewed screenshot.

### Finding

The catalog implementation was functionally correct, but two evidence defects blocked a production merge: the Learning subsection switch had no responsive placement owner relative to fixed route chrome, and the shared visual Progress fixture made existing Progress/calendar baselines depend on Scenario recommendation data.

### Root cause

The subsection switch was rendered as an ordinary sibling before the product graph while brand, navigation and reminder controls are fixed-position. Separately, adding `scenarios` to the global quality fixture changed unrelated Progress presentation even though this PR does not modify the Progress runtime owner.

### Changed files

- Active task memory in `.agents/current/**`.
- Canonical route, catalog island, bootstrap/history/navigation ownership and focused tests.
- `frontend/app/scenario-catalog.css` and `frontend/app/learning-section-switch.css`.
- Scenario Catalog API/order/recommendation/accessibility/browser contracts.
- `frontend/bundle-budgets.json` and `frontend/e2e/visual-regression.spec.ts` with measured provenance.

### Checks passed

- Frontend lint, typecheck, unit tests, production build and dependency audit.
- Backend unit/security and integration.
- Lesson completion, accessibility audit, content security, iOS PWA, dictionary smoke and UI shards.
- Manual Figma/Linux visual review for all new catalog states and Learning switch viewports.
- Cold-route measurement and request inventory.
- Branch/ref read-back after every write; `main` remains unchanged.

### Checks failed

- CI #1862 failed because an initial measurement-only JavaScript baseline diverged from the shared baseline without provenance. The approach was discarded; CI #1863 kept a valid baseline and forced artifact publication only through a temporary request ceiling.
- CI #1863 performance and visual jobs failed intentionally to publish measured reports and Linux actuals. Their evidence is incorporated into the candidate; no required gate is being skipped or weakened.
- CI #1864 visual failed because a page-level Progress route did not supersede the broad context fixture and because exact rectangle intersection treated a subpixel rail boundary as overlap. Both assertions are corrected without changing production CSS, accepted hashes or visual thresholds.

### Current branch head

Resolve from the live feature branch after the final evidence commit.

### Next action

Run complete CI on the final immutable developer-authored head. If green, audit PR comments, reviews and review threads, mark PR #228 ready, squash-merge with the expected head SHA, deploy the exact squash SHA to stage, run public smoke/browser validation, close Issue #24 and perform a separate repository-memory reconciliation.
