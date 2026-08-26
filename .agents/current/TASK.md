# Current Task

## Identity

- Issue: #698 `[High][Frontend][Visual] Semanticize Profile email-change confirmation palette`
- Parent: #205
- Branch: `fix/profile-email-confirmation-semantic-palette`
- Base SHA: `f3c161af7cf4fe91dbb2f05441f848963b80e30f`
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Objective

Repair the production-reachable `/profile#email_change_token=…` confirmation surface so its effective Light/Dark presentation follows the current Foundation semantic token graph instead of the pre-Foundation fixed dark purple/navy palette, without changing email-change behavior or Profile geometry.

## Scope

- semanticize `.lx-email-confirmation-card` paint/elevation and confirmation copy;
- semanticize confirmation-local success/error notice presentation that currently inherits fixed legacy account notice paint outside the Profile route island;
- add fail-closed source/import/collection ownership protection;
- extend the existing account email browser journey with explicit Light/Dark computed-style, geometry and overflow proof;
- add authoritative Linux Profile visual evidence for the token-confirmation state without unrelated baseline churn;
- deliver through immutable-head CI, expected-head squash merge, exact-main CI and exact-SHA Stage/public validation.

## Non-goals

- no email-change API/session/token/history behavior change;
- no Profile redesign or copy change;
- no broad `account-security.css` cleanup;
- no change to existing route-scoped Profile appearance compatibility selectors;
- no legal/footer/global cleanup;
- no blind visual snapshot update or tolerance widening.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/account-email.css`
- `frontend/components/email-change-confirmation-semantic-css-ownership.test.ts`
- `frontend/e2e/account-email-change.spec.ts`
- `frontend/e2e/profile-visual.spec.ts`
- `frontend/e2e/profile-email-confirmation-visual.spec.ts`
- `frontend/playwright.visual.config.ts`

## Prohibited paths

- `frontend/app/appearance.css`
- `frontend/app/account-security.css`
- backend/API/schema/migration/storage files
- Profile route-island component/source files
- visual PNG baselines unless an authoritative Linux artifact proves an intentional reviewed delta and scope is explicitly updated first
- workflow files

## Runtime owners

- bootstrap reachability: `frontend/components/lexigo-bootstrapped-app.tsx`
- confirmation behavior: `frontend/components/email-change-confirmation.tsx`
- presentation owner changed by this slice: `frontend/app/account-email.css`
- semantic token owners: `frontend/app/design-tokens.css`, `frontend/app/appearance.css` (read-only)
- reused legacy notice source: `frontend/app/account-security.css` (read-only; overridden only inside confirmation scope)

## Documentation owners

- active design mapping: `docs/figma/openpencil-screen-map.json`
- Profile source: `profile.mobile.light` / OpenPencil `fig_4305`, `profile.desktop.light` / OpenPencil `fig_4157`; no dedicated email-confirmation screen exists
- issue contract: #698
- current execution evidence: `.agents/current/**`

## Invariants

- `email_change_token` remains fragment-only and is not moved into query/request logging;
- public confirm mutation remains unauthenticated and CSRF-free as designed;
- successful confirmation still invalidates local session and navigates to `/profile?account=email-changed`;
- width, spacing, responsive layout and button/action semantics remain unchanged;
- Profile route-island appearance compatibility ownership remains untouched;
- Light/Dark must share the same semantic selector owners, not appearance-specific hard-coded paint.

## Acceptance criteria

- explicit Light card/label/title/body/action/status surfaces resolve to semantic Light owners;
- explicit Dark resolves to semantic Dark owners;
- computed foreground/background/border/elevation/status pairs are asserted against root semantic tokens;
- confirmation palette no longer depends on legacy hex/`rgba(...)`/fixed dark gradient declarations;
- Light/Dark confirmation geometry is equal and there is no horizontal overflow;
- existing token-confirmation/session invalidation functional journey remains green;
- source contract binds production reachability, semantic CSS and blocking `test:e2e:ui` collection;
- authoritative Linux Profile visual evidence is reviewed with no unrelated baseline changes;
- full immutable-head CI green before Ready/merge; exact-main CI and exact-SHA Stage/public validation green after merge.

## Required checks

- source/unit ownership contract;
- frontend lint, typecheck, unit, production build and dependency audit;
- `test:e2e:ui` Chromium/WebKit account-email journey;
- accessibility/CSP/performance/Service Worker/PWA regression matrix;
- authoritative Linux visual job including Profile confirmation evidence;
- full immutable-head CI;
- review/thread audit and `behind_by=0`;
- expected-head squash merge, exact-main CI and exact-SHA Stage/public browser validation.

## Risks

- generic `.lx-account-notice` declarations are shared; confirmation overrides must be strictly scoped to `.lx-email-confirmation`;
- the confirmation is outside `.lx-routed-app`, so route-scoped Profile selectors cannot be relied on;
- global `.lx-button.primary` may have its own cascade; computed evidence must prove effective action paint before assuming ownership;
- visual proof must not mutate existing canonical Profile baselines merely because the transient confirmation state is added.

## Rollback

Revert the focused semantic declarations/test additions in this branch. No data/API migration or persistent state rollback is required.
