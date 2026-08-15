# Current Task

## Identity

- Issue: #536
- Branch: `test/issue-536-phrases-catalog-figma-parity`
- Base SHA: `a16a9dc598d61aa35ff7d10317a7a60b75e390e7`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Add executable canonical Figma parity for the `/phrases` catalog under umbrella Issue #205 by extending the existing authoritative Phrases visual owner.

## Scope

- Extend `frontend/e2e/phrases-visual.spec.ts`; do not create a competing test owner.
- Cover the repository-approved canonical catalog sources:
  - mobile Light/default: Figma `255:10`, `390x844`;
  - mobile Dark/search + Travel filter: Figma `257:2`, `390x844`;
  - desktop Light/default: Figma `255:81`, `1440x1024`;
  - desktop Dark/empty search: Figma `257:74`, `1440x1024`.
- Add exact Playwright `figma` annotations and deterministic route-state evidence.
- Prove route-island, semantic main, catalog, URL-backed query/topic state, semantic appearance/canvas, exactly one visible RouteChrome owner, horizontal containment and reload stability.

## Non-goals

- `/phrases/[slug]` Phrase Detail parity.
- Production React/CSS changes unless executable evidence proves a concrete product defect.
- Any visual baseline refresh.
- Route extraction, session ownership changes, navigation redesign or compatibility cleanup.
- Live Figma edits while MCP access is blocked by the Starter-plan tool-call limit.

## Allowed paths

- `frontend/e2e/phrases-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Production frontend components and CSS unless the new executable contract proves an actual defect.
- Existing visual baseline files/hashes.
- `package.json`, lockfiles, Playwright configuration and workflows unless authoritative collection proves a real reachability gap.
- Backend and API implementation.
- `.agents/PROJECT_STATE.md` until post-merge reconciliation.

## Runtime owners

- `LexigoPhrasesApp` owns `/phrases` and URL/history-backed catalog state.
- `PhrasesCatalog` owns catalog presentation, search, topic filtering and result/empty states.
- `RouteChrome` is the sole primary navigation owner.
- `LexigoBootstrappedApp` remains the session restoration/account runtime owner.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md` owns the repository-approved route-to-Figma mapping.
- `.agents/PROJECT_STATE.md` owns durable cross-task memory and is updated only in post-merge reconciliation.

## Invariants

- Existing eight content-addressed Phrases visual baselines remain byte-for-byte unchanged.
- Existing browser-owned zoom/reflow, accessibility, touch and history owners remain authoritative.
- `/phrases` keeps URL-backed `query` and `topic` semantics through reload.
- Guest catalog filtering is used for deterministic search/topic/empty-state parity without extending the API fixture.
- Canonical canvas values remain Light `#f4f7f5` and Dark `#10211d`.
- Canonical 390px viewport exposes one `mobile` RouteChrome owner; canonical 1440px viewport exposes one `header` RouteChrome owner, subject to executable verification.

## Acceptance criteria

- Four canonical Phrases catalog cases run only in their authoritative compact/desktop Playwright projects.
- Every case carries the exact approved Figma node annotation.
- The route has exactly one `data-route-client-island="phrases"` owner and semantic main `Технические фразы`.
- Default, Travel search and empty-search states are deterministically observable from canonical URLs.
- Explicit appearance and computed semantic canvas match the canonical contract before and after reload.
- Exactly one visible RouteChrome owner is contained within the viewport and remains stable after reload.
- No document horizontal overflow is introduced.
- No production code or visual baseline changes are required unless the test proves a real defect.

## Required checks

- Repository Agent Harness validation.
- Frontend lint/typecheck/unit/build and dependency audit selected by CI scope.
- Authoritative browser/UI collection containing `phrases-visual.spec.ts`.
- Existing Phrases content-addressed Visual regression suite.
- Accessibility, PWA, CSP, performance and lesson/browser gates selected by the full frontend CI path.
- Immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-main CI and Stage/public validation.

## Risks

- A canonical state may expose a real geometry/navigation mismatch; do not normalize it with a baseline refresh.
- Authenticated quality-gate API fixtures intentionally ignore phrase filters, so canonical filtered/empty states must use the real guest catalog path.
- Live Figma MCP is unavailable; this slice may only use the already reviewed repository node mapping.

## Rollback

Revert the atomic test-only PR. No runtime schema, backend, production component, CSS or visual baseline migration is part of this slice.
