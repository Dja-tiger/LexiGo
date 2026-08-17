# Current Task

## Identity

- Issue: #581
- Branch: `test/issue-581-desktop-route-parity`
- Base SHA: `d073fcf21707deb73fda6b54b969fcb937673f9f`
- Head SHA: resolve from live branch ref
- PR: #582

## Objective

Deliver one consolidated `1440×1024` desktop route-parity evidence matrix for the ten canonical routes owned by parent #205, with explicit Light/Dark coverage and exact Linux fingerprints reviewed before approval.

## Scope

- Extend the existing consolidated route parity owner rather than create a parallel fixture stack.
- Cover `/`, `/learn`, `/lesson/active`, `/progress`, `/dictionary`, `/words/[id]`, `/phrases`, `/phrases/[slug]`, `/profile`, `/onboarding`.
- Run desktop evidence at an actual `1440×1024` viewport under the existing Linux `visual-desktop` project.
- Assert canonical route owner, RouteChrome/focused ownership, reduced-motion invariant, no runtime errors, no horizontal document overflow, no partially clipped rendered focusable controls and valid main/owner geometry.
- Require no visible legacy `product` compatibility owner for the desktop matrix only; existing tablet #568 acceptance remains unchanged.
- Attach exact full-page PNG + JSON evidence for every route/theme state.
- Match only manually reviewed exact Linux fingerprints from diagnostic CI #3746 / run `32065112367`.

## Non-goals

- No Figma Cloud editing.
- No OpenPencil source mutation.
- No runtime/CSS/backend/API redesign in this audit PR.
- No 200% zoom, minimum-mobile or system-state matrix in this slice.
- No broad snapshot regeneration or tolerance increase.

## Allowed paths

- `frontend/e2e/route-tablet-parity.spec.ts`.
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime application/CSS/backend files unless a separate defect Issue is created first.
- `design/openpencil/**`
- archived Figma sources.
- CI/workflow/deploy topology.
- visual baselines unrelated to the 20 new desktop states.

## Runtime owners

- Existing route islands and `RouteChrome`; this task observes ownership but does not change it.
- Focused routes: Active Lesson and Onboarding suppress ordinary RouteChrome.

## Documentation owners

- #581 is the atomic task owner under umbrella #205.
- `.agents/current/**` records execution state until delivery/reconciliation.

## Invariants

- Auth/session/API fixture semantics remain unchanged; the existing onboarding CSRF fixture value is retained.
- Existing tablet 768×1024 reviewed fingerprints remain byte-for-byte unchanged.
- Desktop tests set an actual viewport of `1440×1024`; canonical OpenPencil/Figma frame sizes are not relabeled.
- Exact hashes were fail-closed until manual Linux artifact review.
- Product defects discovered by the matrix must be split into separate Issues/PRs instead of hidden by baseline approval.

## Acceptance criteria

- 10 routes × Light/Dark execute at `1440×1024`.
- Structural ownership and geometry assertions pass before the review gate.
- 20 exact Linux PNG states are attached and manually reviewed.
- Reviewed fingerprints reproduce in immutable-head CI without snapshot update mode.
- Review audit/main-drift gate is clean before expected-head squash merge.
- Exact-main post-merge CI passes; Stage is not claimed unless runtime files actually change.

## Required checks

- Repository frontend lint/type/unit/build gates selected by CI.
- Linux Visual regression job with the reviewed matrix.
- Full immutable-head CI after reviewed fingerprints are committed.
- Exact-main CI after squash merge.

## Risks

- Full-page dimensions differ by route; width, reviewed height and content SHA remain exact per state.
- A pre-existing System State visual can render an unapproved antialias variant; it must be classified separately and must not be absorbed into #581.
- Shared Reminder/profile masking must remain deterministic across existing route evidence.

## Rollback

Revert the isolated test/evidence commits. No runtime rollback is required because #581 changes no runtime product code.
