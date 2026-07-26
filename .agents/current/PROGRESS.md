# Current Task Progress

## 2026-07-26 — Issue #200 Profile production slice

### Verified before implementation

- mandatory harness documents were read from live `main`;
- live GitHub state was checked: `main` was `66104ed2f92bfb288bee57962bab6ee06e134719`, no product PR was open, Issue #198 and its reconciliation were complete, and stage/public validation was green;
- `.agents/PROJECT_STATE.md` agreed with GitHub and `.agents/current/**` was clean;
- Issue #199 remained blocked by missing approved Phrases frames;
- Issue #200 was the next unblocked roadmap slice;
- Figma design context, variables and screenshots were read for mobile `79:6` and desktop `79:129`;
- branch `feat/issue-200-profile` was created from the exact main SHA and compared identical before the first write;
- Draft PR #237 was opened before runtime implementation.

### Implemented

- authenticated `/profile` now uses a dedicated `LexigoProfileApp` client island;
- unauthenticated `/profile` continues to use the existing login/register/reset compatibility boundary;
- Profile follows the responsive information architecture of Figma `79:6` and `79:129`;
- identity values come from the restored session rather than Figma sample copy;
- daily goal remains server-owned through the existing authenticated progress contracts;
- calendar reminders remain browser/calendar-owned through `CalendarReminderIntegration`;
- password, active sessions, email change, export and deletion remain owned by the existing confirmed account components;
- Profile actions move keyboard focus to those canonical owners instead of duplicating sensitive forms;
- Auto/Light/Dark appearance preference is persisted under a versioned browser-only key;
- RootLayout applies appearance, `color-scheme` and PWA `theme-color` before first paint;
- Auto preserves the established `prefers-color-scheme` owners; only explicit Light/Dark override semantic tokens;
- explicit Light provides a route-scoped compatibility palette for legacy account panels;
- logout preserves the local appearance preference, invalidates the authenticated session and returns to canonical guest Home;
- session bootstrap is the sole post-logout route owner;
- architecture documentation records Profile, appearance and account boundaries.

### Validation added

- appearance normalization, persistence, storage-denial and no-flash bootstrap unit tests;
- Profile route and sensitive-operation source ownership tests;
- production application-root ownership update;
- authenticated Profile Chromium interaction tests;
- iOS WebKit reflow and logout lifecycle tests;
- roving keyboard radio-group tests;
- explicit Light/Dark axe coverage;
- forced-colors and reduced-motion contracts;
- 200% text reflow and horizontal-overflow checks;
- cold-route Profile bundle measurement;
- deterministic 390×844 and 1440×1024 Light/Dark visual hash baselines.

### Visual evidence

The four Linux actuals were inspected manually against Figma before promotion:

- compact Light, Figma `79:6`: `e89a8d931de7854a56235bff661afe23317505333dc9671d392076c76bd8198c`;
- compact Dark semantic adaptation: `ecea257dca01358a66be1078938b202f7ad8194baeae80cb43c45d8ebcefa92d`;
- desktop Light, Figma `79:129`: `3da62f1cd51197f7b10ab5ec6cf51fc3c6f6d9503f2ea8d40fdc5ff1518816b1`;
- desktop Dark semantic adaptation: `f5670eaaa3ca527f081698c7629bd0c96de9117553fe9b16ff97739c191010ae`.

Unrelated Auto-route visual changes were rejected and fixed at the token-owner level rather than promoted.

### Confirmed failures and fixes

- synchronous calendar state reset in an effect failed lint: removed the redundant state write;
- the production root allow-list rejected the new island: registered Profile and protected bootstrap-only graph loading;
- Auto mode globally applied explicit Light tokens: scoped overrides to explicit preferences only;
- reused account forms failed Light/Dark contrast: added route-scoped accessible color pairs;
- old keyboard tests expected the legacy identity H1: updated the locator to the approved `Профиль` page heading;
- logout returned Home after the authenticated island was already unmounted: moved the transition before session invalidation in bootstrap;
- Profile and bootstrap both attempted post-logout navigation: removed navigation from the presentation island and added a single-owner contract;
- the first source ordering assertion matched an unrelated earlier invalidation call: sliced the `handleLoggedOut` owner before comparing call order.

No gate was disabled, weakened or bypassed.

### Near-head CI passed

CI #2014 on developer-authored head `77a64efcadaadee1882d2f1b13fc033ea71a52f4` completed successfully, including:

- frontend lint, typecheck, 401 unit tests, production build and dependency audit;
- backend unit, formatting, static analysis, race tests, coverage and vulnerability scan;
- backend integration with race detector;
- both frontend UI shards;
- accessibility audit;
- performance budgets;
- iOS PWA dictionary gate;
- dictionary browser smoke;
- controlled service worker;
- visual regression and Profile visual hashes.

Review timeline is empty; there are no unresolved review threads.

### Current branch state

- branch: `feat/issue-200-profile`;
- base: `66104ed2f92bfb288bee57962bab6ee06e134719`;
- PR: Draft #237;
- live head must be resolved after this documentation write;
- `main` remains unchanged.

### Next action

Wait for full immutable-head CI after the final agent-memory writes. If green, verify PR head and review state, mark PR ready, squash merge with `expected_head_sha`, validate the exact merge SHA on stage/public checks, then reconcile `.agents/PROJECT_STATE.md` and clear `.agents/current/**` in a separate documentation branch.
