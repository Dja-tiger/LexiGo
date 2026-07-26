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

- authenticated `/profile` uses a dedicated `LexigoProfileApp` client island;
- unauthenticated `/profile` continues to use the existing login/register/reset compatibility boundary;
- Profile follows the responsive information architecture of Figma `79:6` and `79:129`;
- identity values come from the restored session rather than Figma sample copy;
- daily goal remains server-owned through the authenticated progress contracts;
- calendar reminders remain browser/calendar-owned through `CalendarReminderIntegration`;
- password, active sessions, email change, export and deletion remain owned by the existing confirmed account components;
- Profile actions move keyboard focus to those canonical owners instead of duplicating sensitive forms;
- Auto/Light/Dark appearance preference is persisted under a versioned browser-only key;
- RootLayout applies appearance, `color-scheme` and PWA `theme-color` before first paint;
- Auto preserves the established `prefers-color-scheme` owners; only explicit Light/Dark override semantic tokens;
- explicit Light provides a route-scoped compatibility palette for legacy account panels;
- logout preserves the local appearance preference and routes through the canonical App Router owner before session invalidation;
- session restore is suppressed during logout, preventing a refresh request from recreating an expired-session notice or re-adopting the authenticated graph;
- session bootstrap finalizes logout only after pathname `/` has committed;
- dictionary cold-entry ownership remains mounted while the destination history entry is canonicalized, so exact single-word lessons mount the product graph with `/lesson/active` rather than stale Word Detail history;
- architecture documentation records Profile, appearance, account and route ownership boundaries.

### Validation added

- appearance normalization, persistence, storage-denial and no-flash bootstrap unit tests;
- Profile route, logout-owner and sensitive-operation source ownership tests;
- production application-root and dictionary-to-product graph ownership contracts;
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
- Profile and bootstrap both attempted post-logout navigation: removed navigation from the presentation island and added a single-owner contract;
- CI #2016 showed that synchronous History API navigation plus session invalidation could mount the guest Profile graph before App Router committed `/`;
- CI #2020 proved that pathname gating alone was insufficient because a route change could trigger session preflight and because the dictionary island could unmount before destination history canonicalization;
- the Routed shell now owns `router.replace("/")`, bootstrap suppresses session restore while logout is pending, and invalidation runs only after pathname `/` commits;
- the dictionary-to-product transition now renders a loading boundary until the new route history state is canonical, then mounts `LexigoPremiumApp`;
- root-shell and source ownership tests were updated to encode these final boundaries.

No gate was disabled, weakened or bypassed.

### CI evidence

- CI #2014 on head `77a64efcadaadee1882d2f1b13fc033ea71a52f4` was fully green before final route-lifecycle hardening.
- CI #2016 on head `3aeb8cac2efe8ad141c4838290093382fad29f67` localized the first post-logout stale-path failure.
- CI #2020 on head `b568ba1f7c1e3b1d356ea204362a6cbd369dc838` localized the remaining logout preflight race and the stale Word Detail history during exact single-word lesson start.
- CI #2027 on runtime head `3d8e8af24ab571987cc48db0279a6643ee4119e7` completed successfully across the full repository matrix, including:
  - frontend lint, typecheck, unit tests, production build and dependency audit;
  - backend formatting, static analysis, race tests, coverage and vulnerability scan;
  - backend integration with race detector;
  - both frontend UI shards;
  - lesson completion and exact single-word lesson lifecycle;
  - accessibility audit and keyboard semantics;
  - performance and route bundle budgets;
  - iOS PWA dictionary gate and dictionary browser smoke;
  - content security and controlled service worker;
  - visual regression and immutable Profile visual hashes.

Review timeline is empty; there are no unresolved review threads.

### Current branch state

- branch: `feat/issue-200-profile`;
- base: `66104ed2f92bfb288bee57962bab6ee06e134719`;
- PR: Draft #237;
- runtime CI proof: #2027, green on `3d8e8af24ab571987cc48db0279a6643ee4119e7`;
- final live head is the commit containing the completed current-task memory and must be resolved from PR #237 before merge;
- `main` remains unchanged.

### Next action

Run one final immutable-head CI after this completed agent-memory record. If green, verify the exact PR head and review state, mark PR ready, squash merge using `expected_head_sha`, validate the exact merge SHA on stage/public checks, then reconcile `.agents/PROJECT_STATE.md` and clear `.agents/current/**` in a separate documentation branch.
