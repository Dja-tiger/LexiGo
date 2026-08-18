# Current Task Progress

## 2026-08-18 23:34 +03:00

### Verified

- Live `main` is `b1444d5e5153da9b8fe275b7f1f175e9bd25286b`.
- Issue #601 Draft PR #602 reached its intended fail-closed visual review gate in CI run `32180791470`; exact artifact `9340975602` was downloaded and manually reviewed.
- The audit evidence is not approvable: ordinary routes show substantial internal right-edge clipping at true browser zoom `2.0` from `1440×900` (effective 720px boundary), despite document-level horizontal overflow assertions passing.
- Separate runtime Issues were created per #601 delivery policy: #603 ordinary routed shell/content, #604 Active Lesson, #605 Onboarding.
- Issue #603 branch was created from exact current main.
- Existing reviewed tablet contract starts at 768×1024; compact RouteChrome currently ends at 719px and rail RouteChrome starts at 720px.
- `route-navigation.css` explicitly reserves `margin-left: calc(var(--lx-navigation-rail-width) + 20px)` for routed main content during `720–1099px`.
- `adaptive-navigation.css` uses the same `720–1099px` medium boundary and switches app-shell/mobile padding only at `max-width:719px`.
- Learn subsection placement has an explicit rail reservation in `720–1099px`, while its compact centered width starts only at `max-width:719px`.
- Profile has a dedicated RouteChrome tablet compatibility owner that reserves the rail during `720–1099px`.
- Reminder positioning also changes at 720px, so a compact RouteChrome extension through 767px must keep the Reminder owner aligned rather than moving navigation alone.

### Finding

There is an unreviewed responsive gap from 720 through 767px: canonical compact/mobile ownership ends at 719px, but the first manually reviewed tablet anchor is 768px. True 200% browser zoom from the canonical 1440px desktop width lands exactly at 720px, activating rail/medium reservations before the route content has enough usable inline space. Internal `overflow`/fixed-width descendants can therefore clip without expanding document `scrollWidth`.

### Root cause

The defect is not a single route typo. Multiple shared owners independently switch from compact to rail/medium at the same 720px boundary (`route-navigation.css`, `adaptive-navigation.css`, Learn subsection placement, Profile rail reservation, Reminder placement). The product has no reviewed design/evidence requirement for a rail below the 768px tablet anchor. The repair should therefore align the narrow medium gap with compact ownership while preserving 768px as the first rail/tablet state, then prove route-specific descendants actually reflow.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live main/open PR/Issue preflight.
- Exact #601 artifact manual review.
- 719/720/768 breakpoint ownership inspection.
- Shared RouteChrome, adaptive shell, Learn switch, Profile rail and Reminder owner inspection.

### Checks failed

- #601 visual evidence intentionally remains unapproved because real runtime clipping was found.

### Current branch head

Resolve from live branch after current documentation synchronization.

### Next action

Record execution details, then implement the smallest shared boundary correction for 720–767px and add a true-browser-zoom regression that asserts internal content/text/control containment across the ordinary routes. Preserve exact 768 rail behavior.
