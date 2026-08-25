# Current Task

## Identity

- Issue: #692
- Branch: `fix/global-error-semantic-palette`
- Base SHA: `2ceb77a682710aeaed3b27f0f62ea26c0c54af51`
- Head SHA: resolve from live branch ref
- PR: #693

## Objective

Make the production-reachable Next.js root `global-error` fallback self-contained for current Foundation Light/Dark appearance and remove its fixed legacy dark palette without changing root failure detection, diagnostics or recovery behavior.

## Scope

- semantic root-error presentation in `frontend/app/global-error.css`;
- one minimal self-contained root-error CSS asset that mirrors only the Foundation semantic color tokens required by the special root replacement, with fail-closed source synchronization against the canonical token/appearance owners;
- runtime reapplication of stored/system appearance through the existing appearance owner;
- fail-closed source ownership coverage;
- explicit Light/Dark computed-style evidence in the existing authoritative application-error UI E2E owner using the live CSP nonce;
- measured initial-request ceiling reconciliation only where the unavoidable single root-fallback CSS asset consumes previously zero-headroom route budgets; JavaScript byte ceilings remain unchanged;
- factual current task/progress/execution evidence.

## Non-goals

- no changes to `ApplicationErrorBoundary` or `frontend/app/error-boundary.css`;
- no shared `system-states.css` redesign or system-state baseline changes;
- no root failure detection, logging, `reset()`, version-mismatch, Service Worker/cache cleanup, reload or Home-navigation changes;
- no session, API, backend, route, workflow or dependency changes;
- no OpenPencil mutation;
- no blind visual fingerprint update;
- no broad legacy CSS cleanup;
- no general bundle-budget reset or JavaScript budget increase.

## Allowed paths

- `frontend/app/global-error.tsx`
- `frontend/app/global-error.css`
- `frontend/components/global-error-semantic-ownership.test.ts`
- `frontend/e2e/application-error-boundary-appearance.spec.ts`
- `frontend/bundle-budgets.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/error-boundary.css`
- `frontend/app/system-states.css`
- `frontend/app/layout.tsx`
- `frontend/package.json`
- existing visual snapshot/fingerprint files
- `design/**`
- backend/API/migrations
- `.github/workflows/**`

## Runtime owners

- Next.js App Router special boundary: `frontend/app/global-error.tsx`;
- root-boundary presentation/bootstrap mirror: `frontend/app/global-error.css`;
- canonical semantic Foundation tokens: `frontend/app/design-tokens.css`;
- canonical explicit Light/Dark overrides: `frontend/app/appearance.css`;
- appearance runtime/storage/system resolution: `frontend/lib/appearance-preference.ts`;
- root version-mismatch recovery: `frontend/lib/service-worker-update.ts`.

## Documentation owners

- Issue #692;
- PR #693;
- parent visual-parity umbrella #205;
- active OpenPencil map `docs/figma/openpencil-screen-map.json`, shared Error provenance `state.error.dark` / `fig_4222`;
- `.agents/PROJECT_STATE.md` only after completed runtime delivery in separate reconciliation.

## Invariants

- `global-error` remains a valid root replacement with its own `<html lang="ru">` and `<body>`;
- existing localized copy and two recovery actions remain unchanged;
- non-version-mismatch retry still calls `reset()`;
- version mismatch still clears LexiGo Service Worker/cache runtime state then reloads;
- Home action still navigates to `/`;
- no React-owned body replacement/mutation is introduced by browser evidence;
- explicit Light/Dark and Auto/system appearance reuse the existing appearance runtime rather than adding a second storage contract;
- root fallback does not pull the full normal-layout `design-tokens.css` / `appearance.css` assets into every canonical route;
- the minimal root-error token mirror must remain byte-semantically synchronized for its required tokens with the canonical owners through source tests;
- no existing reviewed visual baseline changes without separate Linux review evidence;
- performance reconciliation changes only request ceilings proven to have no pre-existing headroom after consolidating the fallback to one CSS asset.

## Acceptance criteria

- root canvas/surface/text/muted/weak/action paint derives from current `--ak-color-*` semantic ownership;
- legacy root-error literals `#050914`, `#f7f9ff`, `#33415c`, `#0c1324`, `#b7c2d8`, `#66738e` are absent from the root-error presentation owner;
- root boundary imports only the dedicated root-error stylesheet and subscribes to the existing appearance runtime; the stylesheet owns the minimal required semantic token mirror for base/system-dark and explicit Light/Dark states;
- fail-closed source test protects semantic mirror synchronization, imports, recovery invariants, banned legacy paint, CSP-compatible E2E evidence and authoritative E2E collection;
- browser computed-style evidence passes for explicit Light and Dark without replacing the React-owned body and without violating the runtime Content Security Policy;
- normal canonical routes no longer load the two extra full semantic/appearance fallback dependencies introduced by the superseded three-import implementation;
- route JavaScript transfer remains within unchanged byte ceilings; only exact request ceilings with zero pre-existing headroom may increase by one for the single unavoidable fallback stylesheet;
- full immutable-head CI is green;
- clean reviews/threads and no main drift before expected-head squash merge;
- exact-main CI and exact-SHA Stage/public validation succeed after merge;
- repository memory is reconciled/reset separately after runtime delivery.

## Required checks

- frontend lint/typecheck/unit/build;
- existing global application error recovery source tests;
- targeted/application error Light/Dark E2E in Chromium/WebKit through `test:e2e:ui`;
- accessibility, visual regression, content security, PWA/SW, performance and full required CI;
- exact route-bundle report review confirming unchanged JavaScript ceilings and only the intended request-budget delta;
- expected-head merge, exact-main CI and Stage/public checks.

## Risks

- root `global-error` replaces the normal root layout, so implicit normal-layout CSS/bootstrap assumptions can leave the fallback unstyled or fixed-theme;
- importing normal-layout semantic/appearance styles from the special boundary can leak their CSS chunks into ordinary routes and inflate cold-route request counts;
- a minimal self-contained token mirror can drift from canonical owners unless source synchronization fails closed;
- browser proof must not repeat the #689 hydration race by replacing React-owned document content;
- browser evidence must reuse the live nonce or CSP will reject dynamically injected exact stylesheet text;
- Playwright spec collection runs through a CommonJS-compatible loader, so Node-side evidence helpers must not require `import.meta`.

## Rollback

Revert the atomic #692 presentation/test/performance-contract squash merge. Root failure detection and recovery state machines remain unchanged by design.
