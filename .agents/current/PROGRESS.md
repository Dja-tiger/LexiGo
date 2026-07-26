# Current Task Progress

## 2026-07-26 03:30 Europe/Berlin

### Verified

- Live `main` remains `56c8bf7b589601510ff60465c68c7482f5a8f320`; product work is isolated in `feat/issue-24-scenario-catalog` and Draft PR #228.
- Canonical authenticated `/scenarios` is implemented as a dedicated route island and consumes `GET /api/v1/scenarios` in exact server order.
- The optional Scenario recommendation remains server-owned through `/api/v1/progress`; catalog readiness is independent from Progress availability.
- `/scenarios` preserves `return_to=/scenarios`, keeps the four-item global navigation, marks `Обучение` active and routes cards/recommendations to the existing focused `/scenarios/[slug]` lifecycle.
- Approved Figma source remains Mobile Light `228:3`, Mobile Dark `228:4`, Desktop Light `228:5` and Learning entry `228:6`.
- Cold `/scenarios` evidence from CI #1863 (`30181864359`) is `198852` JavaScript bytes and `17` initial requests. Final ceilings remain `230000` bytes and `19` requests with immutable run/head provenance.
- Reviewed Scenario Catalog Linux actuals remain content-addressed: compact Light `390 × 1876`, SHA-256 `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`; compact Dark `390 × 1876`, SHA-256 `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`; desktop Light `1440 × 981`, SHA-256 `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- Compact and medium Learning actuals remain valid: compact `390 × 1212`, SHA-256 `8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9`; medium `768 × 6154`, SHA-256 `4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812`.
- CI #1865 (`30182704593`) on `a14b581c704c3996cbcd7248cfa4383f10e4d577` passed backend unit/security, backend integration, frontend lint/typecheck/unit/build/audit, lesson completion, accessibility, content security, iOS PWA, both UI shards, controlled service worker, dictionary smoke and performance.
- CI #1865 visual trace proves `/api/v1/progress` was fulfilled by the broad handler in `quality-gates.ts`; competing exact route handlers were not a reliable ownership model for this fixture.
- CI #1865 desktop screenshot and compiled CSS prove the switch was centered at `width: 1180px` across the full 1440 px viewport while the fixed Foundation V1 rail occupied the first 220 px. Roughly 90 px of the switch was under the rail and visually masked by its higher z-index.
- The previous desktop Learning hash `f70cdc58badacd2f13d568f97d05bc38d54121adf3382480cab438baa6f04f9f` is revoked. It represented the masked overlap and must not be promoted to the final contract.

### Finding

The catalog runtime is stable, but final visual acceptance exposed a production desktop alignment defect and a deterministic-fixture ownership defect. Neither can be resolved by loosening visual assertions or accepting the current actual.

### Root cause

- The shared switch base rule centers a maximum 1180 px surface in the whole viewport. From 1024 px onward, Foundation V1 replaces the header navigation with a fixed 220 px rail, so whole-viewport centering places part of the switch behind the rail.
- `QUALITY_PROGRESS.scenarios` was added to the broad API fixture. Layering a second exact route did not replace that owner in the observed Playwright trace, so Progress/calendar visuals still received Scenario activity.

### Correction in the next evidence head

- `frontend/app/learning-section-switch.css` aligns the switch with the same content column used by the 220 px desktop rail: 40 px gutter after the rail, maximum 1180 px width and centered placement inside the remaining content area.
- `installQualityGateAPI` accepts an explicit `progress` payload. Visual tests install the baseline Progress payload directly in the broad owner; Scenario catalog visuals reinstall the same owner with the full Scenario recommendation.
- The geometric no-overlap assertion remains fail-closed at more than 1 CSS px. It is not weakened.
- The existing desktop Learning content hash intentionally remains stale for one evidence run so CI uploads the corrected Linux actual for manual review.

### Checks passed

- Frontend lint, typecheck, unit tests, production build and dependency audit.
- Backend unit/security and integration.
- Lesson completion, accessibility audit, content security, iOS PWA, dictionary smoke, UI shards, controlled service worker and performance.
- Manual Figma/Linux review for all Scenario Catalog states and compact/medium Learning states.
- Cold-route measurement and request inventory.
- Branch/ref read-back after every write; `main` remains unchanged.

### Checks failed

- CI #1862: invalid provisional bundle baseline; discarded.
- CI #1863: intentional performance/visual evidence publication; resolved by measured contracts.
- CI #1864: route-fixture ownership and desktop overlap detected.
- CI #1865: all nonvisual gates green; visual correctly remained red because both prior corrections were incomplete. The trace established the final root causes above.

### Current branch head

Resolve from the live feature branch after the evidence commit.

### Next action

Run CI on the corrected evidence head. The expected visual failure is limited to the revoked desktop Learning hash. Download and manually review that Linux actual, record its dimensions/SHA/run/head, then run complete immutable-head CI without update mode. Only after full green status audit PR comments/reviews/threads, mark PR #228 ready, squash-merge with expected head SHA, deploy the exact squash SHA to stage, validate public smoke/browser matrix, close Issue #24 and perform separate repository-memory reconciliation.
