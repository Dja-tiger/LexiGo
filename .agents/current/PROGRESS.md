# Current Task Progress

## 2026-08-15 Europe/Moscow

### Verified

- Issue #531 is the atomic `/dictionary` child of umbrella #205.
- Fresh base `main` is `e3cf4054068867012e01f6ccba528dc04498686f` after docs-only PR #530 reconciliation.
- Repository handoff identifies mobile Dictionary Light `78:54` and desktop Dictionary Light `78:193`; Dark uses the same geometry with semantic Dark tokens.
- Live Figma MCP remains Starter-plan tool-call limited; no fresh canvas approval is claimed.
- Existing `dictionary-route-island.spec.ts` owns direct-entry session/bootstrap handoff and route-history semantics and is already included in authoritative `test:e2e:ui` and navigation collections.
- Existing search/filter/pagination, touch targets, iOS PWA, browser zoom, reduced motion, accessibility, Dictionary Empty/Error/System States and Word Detail have separate owners.
- Runtime ownership confirms `LexigoDictionaryApp` exposes `data-route-client-island="dictionary"`, semantic main `#lexigo-main-content[aria-label="Словарь"]`, and `.lx-dictionary-catalog`.
- Shared route-navigation CSS exposes `mobile` at 390px, `header` at 1440px and `rail` only at 720–1099px.
- Canonical semantic appearance colors remain Light `#f4f7f5` and Dark `#10211d`.

### Finding

The missing #205 evidence is a canonical direct-route parity matrix with exact Figma node provenance, exact mobile/desktop viewport ownership, Light/Dark semantic appearance, route-navigation ownership, horizontal containment and reload stability. Existing behavior owners do not encode that final parity matrix.

### Root cause

The Dictionary route-island test predates the final #205 route-by-route visual parity audit and focuses on session bootstrap/history handoff rather than approved Figma viewport/node provenance.

### Changed files

- `.agents/current/TASK.md` — Issue #531 execution contract.
- `.agents/current/PROGRESS.md` — preflight evidence.

### Checks passed

- PR #530 docs reconciliation CI #3537 passed;
- docs-only exact-main CI #3538 passed;
- Stage #3387 correctly skipped deployment for docs-only merge;
- no open PRs before starting Issue #531;
- branch created from exact fresh main;
- task write read back successfully and `main` remained unchanged;
- authoritative owner/route-navigation/collection audit complete.

### Checks failed

None. Live Figma canvas access remains externally quota-blocked and is treated as a documented evidence limitation, not a product failure.

### Current branch head

Resolve from live branch ref after this progress write.

### Next action

Extend only `frontend/e2e/dictionary-route-island.spec.ts` with the four canonical Dictionary cases, read back the mutation, verify the branch diff stays within allowed paths, then open the immutable-head PR and run full CI.
