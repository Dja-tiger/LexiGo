# Current Task Progress

## 2026-08-15 17:24 Europe/Moscow

### Verified

- Issue #536 is the next open Figma child under #205.
- Product branch `test/issue-536-phrases-catalog-figma-parity` was created from exact `main` SHA `a16a9dc598d61aa35ff7d10317a7a60b75e390e7`.
- Existing authoritative owner is `frontend/e2e/phrases-visual.spec.ts`; no competing spec is needed.
- Repository handoff maps `/phrases` to Figma `255:10`, `257:2`, `255:81`, `257:74` with canonical 390x844 and 1440x1024 viewports.
- Runtime inspection confirms semantic main `Технические фразы`, `data-route-client-island="phrases"`, URL-backed query/topic state and RouteChrome ownership.
- `route-navigation.css` resolves 390px to `mobile` and 1440px to `header` navigation.
- Guest catalog filtering is the deterministic source for Travel-search and empty-search states; authenticated quality-gate API fixtures intentionally do not filter returned phrases.

### Finding

The existing Phrases visual owner has strong content-addressed screenshot, browser zoom/reflow and focus/geometry coverage, but it does not yet encode the canonical #205 Figma node provenance/state matrix as executable route-level parity.

### Root cause

Issue #199 delivered the production Phrases slice and later visual baselines, but final umbrella #205 requires explicit route-to-node parity evidence for the canonical mobile/desktop Light/Dark catalog states.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Agent Harness mandatory documents re-read.
- Live `main` and branch base verified.
- Existing Phrases visual owner, runtime owner, catalog presentation, route navigation, URL-state parser, quality-gate fixtures and approved Figma handoff inspected.
- Live Figma MCP limitation classified as external; repository-approved node mapping remains the permitted evidence source.

### Checks failed

None yet.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Record execution provenance, then add four canonical Phrases catalog cases to the existing visual owner without changing production code or visual baselines.
