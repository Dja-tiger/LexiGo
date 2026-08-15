# Current Task Progress

## 2026-08-15 17:29 Europe/Moscow

### Verified

- Issue #536 is the active Figma child under umbrella #205.
- PR #538 is open as a draft from `test/issue-536-phrases-catalog-figma-parity` into `main`.
- Product branch base remains exact `main` SHA `a16a9dc598d61aa35ff7d10317a7a60b75e390e7`; live `main` has not moved during implementation.
- Existing authoritative owner is `frontend/e2e/phrases-visual.spec.ts`; no competing spec was created.
- Repository handoff maps `/phrases` to Figma `255:10`, `257:2`, `255:81`, `257:74` with canonical 390x844 and 1440x1024 viewports.
- Runtime inspection confirms semantic main `Технические фразы`, `data-route-client-island="phrases"`, URL-backed query/topic state and RouteChrome ownership.
- `route-navigation.css` resolves 390px to `mobile` and 1440px to `header` navigation.
- Guest catalog filtering is the deterministic source for Travel-search and empty-search states; authenticated quality-gate API fixtures intentionally do not filter returned phrases.
- `frontend/playwright.visual.config.ts` already collects `phrases-visual.spec.ts` in authoritative `visual-compact` and `visual-desktop` projects.

### Finding

The existing Phrases visual owner had strong content-addressed screenshot and browser zoom/reflow coverage but no executable canonical #205 node/state matrix. The new block adds that evidence without touching the existing owners.

### Root cause

Issue #199 delivered the production Phrases slice and later visual baselines, while final umbrella #205 requires explicit route-to-node parity evidence for canonical mobile/desktop Light/Dark catalog states.

### Changed files

- `frontend/e2e/phrases-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Agent Harness mandatory documents re-read.
- Live branch/main base verified after every write.
- Existing Phrases visual owner, runtime owner, catalog presentation, route navigation, URL-state parser, quality-gate fixtures and approved Figma handoff inspected.
- Four canonical cases added with exact Figma nodes, explicit appearance/canvas, deterministic URL state, route-island/main/catalog ownership, exact visible RouteChrome ownership, horizontal containment and reload stability.
- Pre-PR compare is ahead-only with exactly four allowed files.
- `frontend/e2e/phrases-visual.spec.ts` compare is `+215/-0`; all eight existing content-addressed hashes and the browser-owned zoom block are unchanged.
- Live Figma MCP limitation classified as external; repository-approved node mapping is the permitted evidence source.

### Checks failed

None yet. Full immutable-head CI has not completed yet.

### Current branch head

Resolve from live branch ref after final Agent Docs writes.

### Next action

Finish PR #538 execution metadata, freeze the branch head, then evaluate full immutable-head CI and review/thread gates. Change code only if executable evidence proves a defect.
