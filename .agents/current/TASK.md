# Current Task

## Identity

- Issue: #230 — Progress session continuity, PWA route exit and interruptible scroll restoration
- Branch: `fix/issue-230-progress-session-navigation`
- Base SHA: `b1f92920af88c9d82b00c50e13b4d0450666989f`
- Head SHA: resolve from live branch ref
- PR: #231 — `fix(navigation): preserve Progress session and interrupt scroll restore`

## Objective

Fix one route-boundary ownership defect across authentication and navigation: a session established inside `LexigoPremiumApp` must remain authoritative when entering the dedicated `/progress` island, Progress must remain escapable through the persistent primary navigation in installed PWA contexts, and asynchronous scroll restoration must stop immediately when the user expresses scroll/navigation intent instead of repeatedly fighting input for up to 300 frames.

## Scope

- Reconcile login/logout state at route boundaries through the document-wide bootstrap cache without a page reload.
- Publish every successful access-token refresh to the bootstrap owner so a route island cannot receive a stale parent token.
- Preserve the existing bootstrap cache and avoid an additional network refresh during ordinary route-island navigation when the cached session and CSRF marker still match.
- Preserve authenticated Progress rendering after a login performed in the same browser/PWA context.
- Preserve native App Router transitions from `/progress` to Home, Learning and Dictionary and back.
- Make route and history restoration use immediate scroll writes rather than smooth animation.
- Cancel pending asynchronous restoration on explicit wheel, touch, primary pointer and scroll-navigation keyboard intent.
- Retain bounded retry while saved content is not yet reachable and the user has not intervened.
- Add focused unit/source/browser regression contracts in desktop and mobile WebKit/Chromium projects.

## Non-goals

- No backend, cookie, refresh-token, CSRF or authentication API change.
- No Progress data, recommendation, scheduler or retained-evidence change.
- No route redesign, CSS/token change or visual baseline update.
- No global routing rewrite or replacement of App Router/history ownership.
- No dependency or workflow change.
- No timeout inflation, skipped required browser project or weakened assertion.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS*.md` or `.agents/lessons/**` only if final evidence proves a new reusable failure category
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-premium-app.tsx` only if direct child-to-parent propagation is objectively required
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/route-primary-navigation.tsx` only if a proven PWA handoff defect requires a narrow correction
- `frontend/components/production-app-entry.test.ts`
- `frontend/lib/auth-session.ts`
- `frontend/lib/auth-session.test.ts`
- `frontend/lib/session-bootstrap.ts` and its test only if the document-wide cache contract itself requires modification
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
- Refresh request coalescing and the document-scoped successful-refresh notification: `frontend/lib/auth-session.ts`.
- Product-graph login and logout state: `frontend/components/lexigo-premium-app.tsx`; the bootstrap owner reconciles the cookie-backed result on pathname changes.
- Persistent route shell, route-boundary focus/scroll and announcement lifecycle: `frontend/components/routed-lexigo-app.tsx`.
- Primary navigation and App Router route-island handoff: `frontend/components/route-primary-navigation.tsx`.
- Retry algorithm for asynchronous scroll reachability: `frontend/lib/navigation-scroll-restoration.ts`.
- Per-tab destination and saved position: `frontend/lib/route-tab-snapshots.ts`, unchanged.
- Progress API/presentation: `frontend/components/lexigo-progress-app.tsx`, unchanged.

## Documentation owners

- User-visible bug and acceptance contract: Issue #230.
- Production routing/session architecture: `README.md` and `docs/architecture.md`, unchanged because the existing bootstrap/cache and App Router boundaries remain authoritative.
- Active execution evidence: `.agents/current/**`.
- Durable completion state: `.agents/PROJECT_STATE.md` in a separate post-merge reconciliation.

## Invariants

- `main` remains unchanged until squash merge.
- Every write names this branch explicitly, is read back and is followed by a live `main` check.
- A valid login performed inside the product graph becomes bootstrap-owned before a separate route island consumes session state.
- A replacement access token is reported to and adopted by the bootstrap owner before later route-island consumption.
- Logout clears the cookie marker and the next pathname reconciliation clears bootstrap session/cache.
- Ordinary primary navigation reuses a matching document-wide cached session without an additional network refresh.
- Scroll restoration never uses smooth behavior and never continues writing after explicit user interruption.
- Retry remains bounded and only serves temporarily unreachable saved positions.
- Focus and live-region announcements settle once per completed route transition.
- Back/Forward, direct entry and per-tab destination semantics remain intact.

## Acceptance criteria

- Login from guest Profile in one browser context, then select Progress: `/progress` renders authenticated weekly evidence rather than the guest gate.
- Successful access-token refreshes propagate to the bootstrap owner; no duplicate login or page reload is required.
- Logout followed by route navigation reconciles the missing cookie marker and a later `/progress` correctly renders the guest gate.
- From `/progress`, all visible primary navigation entries remain actionable in standalone iOS WebKit/PWA and route to the expected URL, main landmark and active item.
- Back/Forward between Progress and a long primary route restores the matching route and a reachable saved position.
- Route/history scroll writes use `behavior: "auto"` regardless of motion preference.
- Wheel, touchstart/touchmove, primary pointerdown and PageUp/PageDown/Home/End/Arrow/Space keyboard intent cancel a pending restoration before another write occurs.
- Without user interruption, a target that is initially unreachable can still settle after asynchronous content increases document height.
- Existing keyboard, axe, reduced-motion, controlled-service-worker, mobile and desktop route contracts pass.
- Final developer-authored head passes the complete required CI; comments/reviews/threads are clean; squash merge uses expected head SHA; exact squash SHA passes stage/public validation.

## Required checks

- Frontend lint, typecheck, unit tests, production build and dependency audit.
- Auth refresh notification, bootstrap and production-entry source contracts.
- `navigation-scroll-restoration` unit suite, including cancellation/no-further-write assertions.
- Focused authentication → Progress regression.
- Route focus/history and explicit scroll-interruption regression.
- Desktop Chromium/WebKit, Android Chromium and iOS WebKit/PWA primary navigation journey.
- Keyboard, reduced motion, 320 px/200% reflow and existing axe gates.
- Full repository CI on final immutable developer head.
- Exact-squash stage deploy, public smoke and public browser matrix.

## Risks

- Reporting every successful refresh without validation can spread malformed session state; the bootstrap listener validates the complete `Session` schema before adoption.
- Adopting a refreshed token while an initial restore is active can race the restore generation; `adoptBootstrappedSession` invalidates the active generation and keeps the newer session authoritative.
- Reconciling every pathname with a real network refresh would rotate refresh state unnecessarily; the existing document cache must short-circuit matching CSRF/session state.
- Logout reconciliation depends on the authoritative CSRF marker being removed by the existing backend logout contract.
- Cancelling on generic `scroll` events would also cancel programmatic restoration; only explicit user-intent events are used.
- Removing retry entirely would regress history restoration for routes whose loading state temporarily collapses document height.
- Touch/pointer listeners can suppress PWA navigation if they call `preventDefault`; cancellation listeners remain passive/non-blocking.
- A test that begins with refresh-authenticated state would miss the guest-bootstrap → in-app login ownership defect.

## Rollback

Revert the single Issue #230 squash merge. Existing route islands and auth API remain available; no schema, data or deployment rollback is required.
