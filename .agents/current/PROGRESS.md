# Current Task Progress

## 2026-08-02 Europe/Moscow

### Verified

- Live `main` before the slice: `5b4cab79d6030b01b1306fa1ca28666c95fb35fd`.
- No pull requests were open at task selection.
- Issue #70 remains open.
- Product stage remains healthy on exact SHA `073e59989cd7a938bf28c1ebee1f77b8f49352c3`, run `30688539355`.
- The previous normative and reset PRs completed lightweight validation; current context was clean.
- `dictionary-detail-compatibility.css` contained live declarations but no longer owned a compatibility presentation.
- Exact canonical destinations were identified in `dictionary-catalog.css`, `word-detail.css` and `route-navigation.css`.

### Applied

- Moved the exact Dictionary catalog variables, active-filter/status colors and compact filter-toggle correction to the end of `dictionary-catalog.css`, preserving their prior effective source position after forced-colors.
- Moved the exact `/words/[id]` example-heading dark contrast correction to `word-detail.css`.
- Moved the exact `/words/[id]` active Library rail-label dark contrast correction to `route-navigation.css`.
- Removed the root-layout compatibility import and deleted `dictionary-detail-compatibility.css`.
- Strengthened `word-detail-source.test.ts` to require physical file/import absence, exact canonical declaration blocks and single occurrence.
- Recorded the ownership consolidation in the compatibility delivery plan.
- Opened Draft PR #334.

### Validation plan

- Confirm final allowed-path compare on the immutable PR head.
- Source contract for deleted file/import, unique selectors and exact declaration values.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit.
- Dictionary and Word Detail direct entry, catalog/detail flows, navigation, accessibility, forced-colors and reflow coverage.
- Authoritative Dictionary/Word Detail Linux visual hashes without baseline updates.
- Existing performance budgets without ceiling changes.
- Full backend/frontend/browser/container CI, review audit, expected-head squash merge and exact-SHA stage/public validation.
