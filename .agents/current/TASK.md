# Current Task

## Identity

- Issue: #603
- Parent: #205
- Discovered by: #601 / Draft PR #602
- Branch: fix/issue-603-browser-zoom-720-ordinary-routes
- Base SHA: b1444d5e5153da9b8fe275b7f1f175e9bd25286b
- Head SHA: resolve from live branch ref
- PR:

## Objective

Repair the ordinary routed-app reflow boundary exposed by true 200% browser zoom: at effective `720 CSS px`, the product must not keep a medium rail/content geometry that internally clips route content. Preserve the reviewed 719px compact state and the 768×1024 tablet contract.

## Scope

- Prove the 719→720→767→768 RouteChrome/content ownership boundary.
- Repair ordinary RouteChrome and route content allocation for the `720–767px` gap without changing desktop/tablet behavior from 768px upward.
- Cover `/learn`, `/progress`, `/dictionary`, `/words/[id]`, `/phrases`, `/phrases/[slug]`, `/profile`; keep `/` as a regression control.
- Keep Reminder/header/profile actions aligned with the chosen compact shell in this gap.
- Add blocking true-browser-zoom evidence that detects internal clipping, not only document `scrollWidth`.
- Explicit Light/Dark validation.

## Non-goals

- Active Lesson focused-route repair (#604).
- Onboarding focused-route repair (#605).
- Backend/API/schema/content changes.
- Figma/OpenPencil redesign.
- Weakening or approving #601 fingerprints before runtime repairs are delivered.
- Broad breakpoint cleanup outside the proven 720–767 gap.

## Allowed paths

- frontend/app/route-navigation.css
- frontend/app/adaptive-navigation.css
- frontend/app/calendar-reminder-entry.css if shared Reminder ownership requires boundary alignment
- frontend/app/learning-section-switch.css
- frontend/app/profile-tablet-layout.css
- frontend/app/issue-603-browser-zoom-reflow.css if a late, explicit compatibility owner is safer than widening existing owners
- frontend/app/layout.tsx only if a new owner stylesheet is added
- frontend/components/*issue-603* source-contract test
- frontend/e2e/*issue-603* browser/reflow regression
- frontend/playwright.visual.config.ts only if explicit routing is required
- .agents/current/**

## Prohibited paths

- backend/**
- database/**
- deploy/**
- design/**
- active-lesson runtime owners (#604)
- first-use/onboarding runtime owners (#605)
- direct writes to main
- blind visual fingerprint updates

## Runtime owners

- `frontend/app/route-navigation.css` — canonical routed RouteChrome breakpoint/geometry owner.
- `frontend/app/adaptive-navigation.css` — shared app-shell padding/navigation compatibility boundary.
- `frontend/app/learning-section-switch.css` — Learn subsection switch width/rail alignment.
- `frontend/app/profile-tablet-layout.css` — Profile route-local main reservation for RouteChrome rail.
- `frontend/app/calendar-reminder-entry.css` — shared routed Reminder positioning/target behavior.

## Documentation owners

- `.agents/current/**` — active execution state.
- Issue #603 / PR — exact runtime/evidence lifecycle.

## Invariants

- `768px` remains the first reviewed tablet width from #568/#570 and must keep the rail contract.
- Existing `719px` compact/mobile presentation must not regress.
- Exactly one RouteChrome navigation owner is visible.
- Home standalone browser-owned zoom contract remains green and is not weakened.
- #601 remains fail-closed; its reviewed defect evidence is input, not a baseline to approve.
- No hidden text/control clipping behind `overflow`, even when document-level horizontal overflow is zero.

## Acceptance criteria

- At true browser zoom 2.0 from 1440px, effective 720px ordinary routes render full readable content without right-edge clipping.
- `/learn`, `/progress`, `/dictionary`, `/words/101`, `/phrases`, `/phrases/[slug]`, `/profile` pass internal text/control containment checks in Light/Dark.
- Exactly one appropriate compact RouteChrome owner is visible in the 720–767 gap; 768px still uses rail.
- Reminder and profile/header controls remain independently operable and contained.
- 719px compact and 768×1024 consolidated tablet evidence remain green.
- Full immutable-head CI succeeds.
- Squash merge uses expected-head protection.
- Exact-main CI and exact-SHA Stage/public browser validation succeed before Issue #603 is closed.

## Required checks

- Source/readback ownership checks.
- Frontend lint/typecheck/unit/build/dependency audit.
- Blocking true browser-owned 200% zoom test at effective 720px.
- Existing Home/Learn/Phrases standalone browser-zoom owners.
- Existing minimum-mobile and 768×1024 consolidated route parity.
- Accessibility, Visual regression, iOS PWA, security, performance and service-worker CI groups.
- Manual exact Linux Light/Dark evidence review before any fingerprint approval.
- Exact-main CI + Stage/public matrix after runtime merge.

## Risks

- Moving the navigation boundary can affect Reminder/header spacing and compact bottom padding.
- Route-specific medium rules may still assume a rail even after RouteChrome switches; source contracts and route-level evidence must detect this.
- A late compatibility owner can become debt if it duplicates too many existing declarations; prefer aligning proven canonical breakpoint owners where safe.

## Rollback

Revert the Issue #603 runtime squash merge and keep #601 blocked. Do not approve the defective 720px evidence as a replacement baseline.
