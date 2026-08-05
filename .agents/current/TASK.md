# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-mobile-navigation-labels`
- Base SHA: `091b8ffdbf0bb70edbbe963f9fd88e40c3ef848a`
- Head SHA: resolve from live branch ref
- PR: #397

## Objective

Make the canonical route-owned mobile navigation labels readable at the default compact viewport and responsive to enlarged root text without clipping, ellipsis, horizontal overflow, target overlap or inaccessible navigation.

## Scope

- the live `.lx-route-nav--mobile` rendered by `RoutePrimaryNavigation`;
- a dedicated post-cascade typography/reflow owner for mobile route labels;
- default compact label size of at least 12 CSS px, including widths at or below 390px;
- rem-responsive label sizing under enlarged root text;
- wrapped, non-clipped labels with an automatically expanding navigation block;
- matching application bottom reserve so enlarged navigation does not cover route content;
- source-level ownership contract;
- focused Playwright proof in desktop Chromium, Android Chromium and iOS WebKit;
- blocking registration in UI, accessibility and responsive commands;
- exact compact visual-baseline reconciliation only for screenshots whose rendered canonical mobile navigation changed from the approved 11px state to the approved 12px state.

## Non-goals

- legacy `.lx-mobile-nav` compatibility navigation;
- route transition, history, scroll-restoration or tab-snapshot behavior;
- changing navigation labels or information architecture;
- desktop header or tablet rail presentation;
- 200% browser zoom acceptance for the whole application;
- physical-device acceptance;
- unrelated touch targets in Issue #74;
- unrelated desktop, tablet or compact visual baseline changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/mobile-navigation-labels.css`
- `frontend/components/mobile-navigation-labels-source.test.ts`
- `frontend/e2e/mobile-navigation-labels.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/profile-visual.spec.ts`
- `frontend/e2e/system-states-visual.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/word-detail-visual.spec.ts`
- `frontend/package.json`

## Prohibited paths

- backend and database code;
- navigation runtime/state owners;
- `frontend/components/route-primary-navigation.tsx`;
- `frontend/lib/navigation.ts`;
- compatibility runtime and `.lx-mobile-nav` owners;
- visual baselines not proven by CI #2843 artifacts to contain the changed canonical compact mobile navigation;
- workflow and deployment files;
- dependency manifests other than the test-script entries in `frontend/package.json`.

## Runtime owners

- `frontend/components/route-primary-navigation.tsx` owns the live route links, semantics and navigation callbacks and must remain unchanged.
- `frontend/app/route-navigation.css` owns canonical route-navigation presentation and remains unchanged.
- `frontend/app/mobile-navigation-labels.css` owns only compact mobile label typography, text reflow, navigation growth and matching content reserve.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- exactly four canonical mobile navigation links remain present;
- each link keeps at least a 48×48 CSS px target;
- link roles, accessible names, hrefs, active state and route navigation are unchanged;
- labels are not clipped or ellipsized;
- default compact labels compute to at least 12px;
- enlarged root text increases label size and navigation height;
- navigation links and effective boxes do not overlap;
- no horizontal document overflow is introduced;
- application bottom reserve remains at least navigation height plus 20px within a 0.1 CSS px geometry tolerance;
- header and rail variants remain unaffected;
- compact visual baselines are promoted only after manual artifact review confirms that the intended navigation-label change is the sole meaningful rendered delta;
- desktop and unaffected compact visual hashes remain unchanged.

## Acceptance criteria

- 390px default mobile viewport exposes all four visible labels at 12px or larger.
- 320px compact viewport retains four non-overlapping targets and readable labels without horizontal overflow.
- 200% root text size increases each label to at least 24px, permits wrapping, removes clipping/ellipsis and expands navigation and content reserve.
- all label scroll boxes fit inside their link boxes.
- all four links remain keyboard-focusable and one representative link completes canonical navigation.
- focused tests pass in desktop Chromium, Android Chromium and iOS WebKit.
- all affected compact visual hashes are content-addressed to CI #2843 artifacts at immutable head `6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2`.
- full authoritative product CI passes on one immutable branch head.
- expected-head squash merge, exact-SHA main CI and exact-image stage/public validation complete before reconciliation.

## Required checks

- fail-closed changed-path audit;
- source contract via Vitest;
- frontend lint, TypeScript, unit tests and production build;
- focused mobile-navigation-label browser matrix;
- full UI, accessibility, responsive, PWA, visual, performance and security gates selected by CI;
- backend and container gates selected by product CI;
- manual review of all changed compact visual artifacts before hash promotion;
- no PR comments, reviews or unresolved review threads before merge;
- exact merge-SHA stage and public browser validation.

## Risks

- rem-based growth can increase the fixed bottom bar beyond the previous content reserve;
- long labels may wrap inside narrow grid tracks and increase navigation height;
- late global CSS may accidentally affect tablet/desktop navigation if selectors are insufficiently narrow;
- content-addressed screenshots may expose every compact route carrying the canonical mobile navigation;
- Linux rasterization may produce a bounded alternate hash for an otherwise visually identical masked compact profile screenshot.

## Rollback

Revert the dedicated stylesheet import, stylesheet, source contract, focused browser proof, package-script registration and the exact compact visual hash promotions as one atomic change. The unchanged canonical route-navigation owner then restores the previous 11/12px ellipsized behavior and prior visual contracts.
