# Current Task

## Identity

- Issue: #230 — Progress session continuity, PWA route exit and interruptible scroll restoration
- Branch: `fix/issue-230-progress-session-navigation`
- Base SHA: `b1f92920af88c9d82b00c50e13b4d0450666989f`
- Head SHA: resolve from live branch ref
- PR: create as Draft before runtime fixes, then keep the PR body factual as evidence is added

## Objective

Fix one route-boundary ownership defect across authentication and navigation: a session established inside `LexigoPremiumApp` must remain authoritative when entering the dedicated `/progress` island, Progress must remain escapable through the persistent primary navigation in installed PWA contexts, and asynchronous scroll restoration must stop immediately when the user expresses scroll/navigation intent instead of repeatedly fighting input for up to 300 frames.

## Scope

- Synchronize the Premium product graph's session changes with `LexigoBootstrappedApp`, including login, adopted replacement access tokens and logout.
- Preserve the existing bootstrap cache and avoid a new refresh-session preflight during ordinary route-island navigation.
- Preserve authenticated Progress rendering after a login performed in the same browser/PWA context.
- Preserve native App Router transitions from `/progress` to Home, Learning and Dictionary and back.
- Make route-boundary restoration use immediate scroll writes rather than smooth animation.
- Cancel pending asynchronous restoration on explicit wheel, touch, primary pointer and scroll-navigation keyboard intent.
- Retain bounded retry while saved content is not yet reachable and the user has not intervened.
- Add focused unit/source/browser regression contracts in desktop and mobile WebKit/Chromium projects.

## Non-goals

- No backend, cookie, refresh-token, CSRF or authentication API change.
- No Progress data, recommendation, scheduler or retained-evidence change.
- No route redesign, CSS/token change or visual baseline update.
- No global routing rewrite or replacement of App Router/history ownership.
- No dependency or workflow change.
- No timeout inflation, skipped browser project or weakened assertion.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS*.md` or `.agents/lessons/**` only if final evidence proves a new reusable failure category
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/route-primary-navigation.tsx` only if a proven PWA handoff defect requires a narrow correction
- `frontend/components/production-app-entry.test.ts`
- `frontend/lib/navigation-scroll-restoration.ts`
- `frontend/lib/navigation-scroll-restoration.test.ts`
- `frontend/lib/navigation-history.ts` and its test only if the scroll behavior contract requires an owner-level correction
- focused existing E2E fixture/spec files for authentication, route focus/history, adaptive navigation and iOS PWA
- a new focused E2E spec only when existing owners cannot express the complete journey without fixture duplication

## Prohibited paths

- `backend/**`
- `api/**`
- database migrations and seed data
- `.github/workflows/**`
- service-worker implementation except an objective regression proves it owns the failure
- Progress presentation/CSS and visual baselines
- authentication form copy or account-security semantics
- route bundle budgets unless measured code movement changes a protected route
- unrelated flaky tests or architecture cleanup

## Runtime owners

- Bootstrap session cache and route-island session source of truth: `frontend/components/lexigo-bootstrapped-app.tsx` and `frontend/lib/session-bootstrap.ts`.
- Product-graph login, token adoption and logout state: `frontend/components/lexigo-premium-app.tsx`.
- Persistent route shell, route-boundary focus/scroll and announcement lifecycle: `frontend/components/routed-lexigo-app.tsx`.
- Primary navigation and App Router route-island handoff: `frontend/components/route-primary-navigation.tsx`.
- Retry algorithm for asynchronous scroll reachability: `frontend/lib/navigation-scroll-restoration.ts`.
- Per-tab destination and saved position: `frontend/lib/route-tab-snapshots.ts`, unchanged unless a regression disproves its contract.
- Progress API/presentation: `frontend/components/lexigo-progress-app.tsx`, expected unchanged unless evidence shows a consumer defect.

## Documentation owners

- User-visible bug and acceptance contract: Issue #230.
- Production routing/session architecture: `README.md` and `docs/architecture.md`, unchanged unless implementation alters the documented boundary.
- Active execution evidence: `.agents/current/**`.
- Durable completion state: `.agents/PROJECT_STATE.md` in a separate post-merge reconciliation.

## Invariants

- `main` remains unchanged until squash merge.
- Every write names this branch explicitly, is read back and is followed by a live `main` check.
- A valid login performed inside the product graph becomes bootstrap-owned before a separate route island consumes session state.
- A replacement access token is never downgraded to a stale parent token during route transition.
- Logout clears both local product state and bootstrap session/cache.
- Ordinary primary navigation does not invoke an additional refresh-session preflight.
- Scroll restoration never uses smooth behavior and never continues writing after explicit user interruption.
- Retry remains bounded and only serves temporarily unreachable saved positions.
- Focus and live-region announcements settle once per completed route transition.
- Back/Forward, direct entry and per-tab destination semantics remain intact.

## Acceptance criteria

- Login from guest Profile in one browser context, then select Progress: `/progress` renders authenticated weekly evidence rather than the guest gate.
- Session/token changes made in PremiumApp propagate to the bootstrap owner; no duplicate login or page reload is required.
- Logout propagates `null` to bootstrap ownership and a later `/progress` correctly renders the guest gate.
- From `/progress`, all visible primary navigation entries remain actionable in standalone iOS WebKit/PWA and route to the expected URL, main landmark and active item.
- Back/Forward between Progress and a long primary route restores the matching route and a reachable saved position.
- Route-boundary writes use `behavior: "auto"` regardless of motion preference.
- Wheel, touchstart/touchmove, primary pointerdown and PageUp/PageDown/Home/End/Arrow/Space keyboard intent cancel a pending restoration before another write occurs.
- Without user interruption, a target that is initially unreachable can still settle after asynchronous content increases document height.
- Existing keyboard, axe, reduced-motion, controlled-service-worker, mobile and desktop route contracts pass.
- Final developer-authored head passes the complete required CI; comments/reviews/threads are clean; squash merge uses expected head SHA; exact squash SHA passes stage/public validation.

## Required checks

- Frontend lint, typecheck, unit tests, production build and dependency audit.
- Session/bootstrap and production-entry source contracts.
- `navigation-scroll-restoration` unit suite, including cancellation/no-further-write assertions.
- Focused authentication → Progress regression.
- Route focus/history and explicit scroll-interruption regression.
- Desktop Chromium/WebKit, Android Chromium and iOS WebKit/PWA primary navigation journey.
- Keyboard, reduced motion, 320 px/200% reflow and existing axe gates.
- Full repository CI on final immutable developer head.
- Exact-squash stage deploy, public smoke and public browser matrix.

## Risks

- Propagating every local session render without equality guards can create remount loops because the bootstrap key changes from guest to user.
- Propagating logout incompletely can leave authenticated chrome over a revoked cookie session.
- Cancelling on generic `scroll` events would also cancel programmatic restoration; only explicit user-intent events are safe.
- Removing retry entirely would regress history restoration for routes whose loading state temporarily collapses document height.
- Touch/pointer listeners can suppress PWA navigation if they call `preventDefault`; cancellation listeners must remain passive/non-blocking.
- A test that begins with refresh-authenticated state would miss the guest-bootstrap → in-app login ownership defect.

## Rollback

Revert the single Issue #230 squash merge. Existing route islands and auth API remain available; no schema, data or deployment rollback is required.
