# Current Task Progress

## 2026-07-26 03:48 Europe/Berlin

### Verified

- Live `main` remains `56c8bf7b589601510ff60465c68c7482f5a8f320`; Issue #24 work remains isolated in `feat/issue-24-scenario-catalog` and Draft PR #228.
- Canonical authenticated `/scenarios` is implemented as a dedicated route island. It validates `{items, count}`, preserves exact server order, exposes the server-owned recommendation from `/api/v1/progress`, remains usable when Progress fails and routes to the existing focused `/scenarios/[slug]` lifecycle.
- The Learning subsection switch preserves the four-item global navigation and is protected by compact, medium and desktop no-overlap contracts against brand, primary navigation and reminder chrome.
- Approved Figma source remains Mobile Light `228:3`, Mobile Dark `228:4`, Desktop Light `228:5` and Learning entry `228:6`.
- Cold `/scenarios` evidence from CI #1863 (`30181864359`) is `198852` JavaScript bytes and `17` initial requests. The final ceilings are `230000` bytes and `19` requests with immutable run/head provenance in `frontend/bundle-budgets.json`.
- Scenario Catalog visual contracts remain accepted: compact Light `390 × 1876`, SHA-256 `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`; compact Dark `390 × 1876`, SHA-256 `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`; desktop Light `1440 × 981`, SHA-256 `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- Learning visual contracts are now accepted for all required viewports: compact `390 × 1212`, SHA-256 `8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9`; medium `768 × 6154`, SHA-256 `4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812`; corrected desktop `1440 × 1656`, SHA-256 `3be9635dd17bf578adb48cfcbae812c46fe3714969574e5b9a6627b82b7d4088`.
- Corrected desktop evidence comes from CI #1866 (`30183186758`) on head `623a143a5e4f988606a723efdac66fbd3e43953d`. The full-page Linux actual was manually reviewed: the switch begins to the right of the fixed 220 px rail with the intended 40 px gutter, no route-chrome overlap, no clipping and no horizontal overflow. Retry output was byte-identical.
- CI #1866 passed backend unit/security, backend integration, frontend lint/typecheck/unit/build/audit, accessibility, content security, iOS PWA, both UI shards, controlled service worker, lesson completion, dictionary smoke and performance. Its only failure was the intentionally stale desktop Learning content hash used to publish the corrected actual.
- The broad quality API fixture now owns the route-specific Progress payload directly. Existing Progress/calendar visual baselines no longer receive Scenario recommendation data, while Scenario Catalog visuals reinstall the full recommendation fixture explicitly.

### Root cause and correction

The desktop Learning switch had been centered across the full viewport while Foundation V1 placed a fixed 220 px navigation rail on the left. The rail's higher z-index masked approximately 90 px of the switch. The production CSS now aligns the switch with the remaining content column rather than weakening the geometric assertion. Separately, route-specific Progress data is passed through the broad fixture owner instead of competing Playwright route registrations.

### Checks passed

- All product, backend, security, accessibility, PWA, browser and performance jobs in evidence CI #1866.
- Manual Figma/Linux review of all new Scenario Catalog states and the corrected compact/medium/desktop Learning switch states.
- Exact bundle measurement and content-addressed visual provenance.
- Branch/ref read-back after every write; `main` remains unchanged.

### Checks failed

- CI #1866 visual comparison failed only because the checked-in desktop Learning hash intentionally referred to the revoked pre-fix actual. The corrected actual has now been manually approved and is being promoted into the final content-addressed contract.

### Current branch head

Resolve from the live feature branch after the final visual-evidence commit.

### Next action

Run complete CI on the final immutable developer-authored head without update mode. If every required job is green, audit PR comments, reviews and review threads, mark PR #228 ready, squash-merge with the expected head SHA, deploy the exact squash SHA to stage, run public smoke and browser validation, close Issue #24 and perform a separate post-merge repository-memory reconciliation.
