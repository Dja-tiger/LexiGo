# Current Task

## Identity

- Issue: #200 — [Medium][Figma][Production Slice] Реализовать Profile, preferences и appearance control
- Branch: `feat/issue-200-profile`
- Base SHA: `66104ed2f92bfb288bee57962bab6ee06e134719`
- Head SHA: resolve from live branch ref after every write
- PR: Draft PR #237

## Objective

Implement the authenticated `/profile` production slice against Figma nodes `79:6` and `79:129`, preserving the existing account/security contracts while adding a persisted Auto/Light/Dark appearance preference without first-paint theme flash.

## Scope

- create an authenticated Profile route client island with responsive mobile/desktop presentation;
- reuse the canonical App Router shell and persistent route navigation;
- expose the existing server-owned daily goal and browser-owned calendar reminder settings from Profile;
- add a persisted appearance preference (`auto`, `light`, `dark`) and an inline no-flash bootstrap;
- expose session, email, export and delete-account owners through accessible in-page navigation;
- preserve the unauthenticated Profile/auth compatibility boundary in `LexigoPremiumApp`;
- add focused unit, browser, accessibility, history/PWA and route-budget contracts;
- update current task memory throughout the slice.

## Non-goals

- no backend, database, API or OpenAPI changes;
- no redesign of password, email-change, session-revocation, export or account-deletion forms;
- no Phrases implementation while Issue #199 remains design-blocked;
- no broad extraction of legacy PremiumApp owners beyond the authenticated Profile boundary;
- no dependency or workflow changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/appearance.css`
- `frontend/app/profile.css`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-profile-app.tsx`
- `frontend/components/production-app-entry.test.ts`
- `frontend/components/profile-source-contract.test.ts`
- `frontend/lib/appearance-preference.ts`
- `frontend/lib/appearance-preference.test.ts`
- `frontend/e2e/profile.spec.ts`
- `frontend/e2e/accessibility-audit.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/route-bundle-budget.spec.ts`
- `frontend/bundle-budgets.json`
- `frontend/e2e/visual-regression.spec.ts-snapshots/**`
- `docs/architecture.md`

## Prohibited paths

- `backend/**`
- `api/**`
- `deploy/**`
- `.github/workflows/**`
- dependency manifests and lockfiles
- migrations and production secrets
- unrelated product routes or Figma redesigns

## Runtime owners

- `frontend/app/layout.tsx`: document metadata and pre-hydration appearance bootstrap.
- `frontend/components/routed-lexigo-app.tsx`: canonical route shell, focus and history ownership; inspected, unchanged unless a verified contract requires otherwise.
- `frontend/components/lexigo-bootstrapped-app.tsx`: session bootstrap and route-island selection.
- `frontend/components/lexigo-profile-app.tsx`: authenticated Profile presentation and Profile-local preference orchestration.
- `frontend/components/account-security-panel.tsx`: password, sessions and audit behavior; reused unchanged.
- `frontend/components/account-email-panel.tsx`: email-change behavior; reused unchanged.
- `frontend/components/account-data-panel.tsx`: export and deletion behavior; reused unchanged.
- `frontend/components/calendar-reminder-integration.tsx`: reminder dialog and browser persistence; reused through the existing dialog owner.

## Documentation owners

- `.agents/current/**`: active atomic-slice state.
- `docs/architecture.md`: route-island and appearance ownership after implementation.

## Invariants

- `main` remains unchanged until expected-head squash merge.
- Authentication tokens remain memory/cookie owned and are never persisted with appearance settings.
- Account/security actions retain their existing server contracts and confirmation requirements.
- `/profile` guest auth remains usable and is not shadowed by the authenticated route island.
- Auto appearance follows `prefers-color-scheme`; explicit Light/Dark ignores later system changes.
- Appearance is applied before first paint when storage is available, and storage denial degrades to Auto.
- Route navigation, Back/Forward, focus restoration, PWA safe areas and 200% reflow remain intact.

## Acceptance criteria

- authenticated Profile matches the information architecture and responsive composition of Figma `79:6` and `79:129`;
- identity, learning, application and account/data groups are present without duplicating account logic;
- daily-goal changes remain server-owned and reminder changes remain browser/calendar-owned;
- Auto/Light/Dark is keyboard and screen-reader operable, persisted, applied without visible flash and reflected in PWA theme color;
- critical account actions remain behind their existing confirmation forms and Profile navigation moves focus to the target owner;
- mobile, desktop, keyboard, screen reader, forced-colors, reduced-motion and 200% zoom contracts pass;
- final immutable-head CI is green, review threads are resolved, squash merge uses expected head, and exact-SHA stage/public validation succeeds.

## Required checks

- focused unit/source-contract tests;
- frontend lint, typecheck, unit and build;
- Profile Chromium/WebKit browser tests;
- accessibility and keyboard checks;
- visual regression for Linux Light/Dark mobile and desktop;
- route bundle/performance budget;
- full repository CI on final developer-authored head;
- post-merge stage deploy, public smoke and public browser checks.

## Risks

- manual appearance could conflict with existing media-query dark overrides;
- route-island selection could accidentally replace guest authentication;
- Profile overview links could duplicate or bypass critical account owners;
- new CSS could alter non-Profile routes through global selectors;
- visual baselines may expose shell differences not visible in isolated Figma frames.

## Rollback

Revert the single squash merge. The previous authenticated Profile remains in `LexigoPremiumApp`, and backend/account contracts are unchanged.
