# Current Task

## Identity

- Issue: #581
- Branch: `test/issue-581-desktop-route-parity`
- Base SHA: `d073fcf21707deb73fda6b54b969fcb937673f9f`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Deliver one consolidated, fail-closed `1440×1024` desktop route-parity evidence matrix for the ten canonical routes owned by parent #205, with explicit Light/Dark coverage and exact Linux fingerprints reviewed before approval.

## Scope

- Extend the existing consolidated route parity owner rather than create a parallel fixture stack.
- Cover `/`, `/learn`, `/lesson/active`, `/progress`, `/dictionary`, `/words/[id]`, `/phrases`, `/phrases/[slug]`, `/profile`, `/onboarding`.
- Run desktop evidence at an actual `1440×1024` viewport under the existing Linux `visual-desktop` project.
- Assert canonical route owner, RouteChrome/focused ownership, reduced-motion invariant, no runtime errors, no horizontal document overflow, no partially clipped rendered focusable controls and valid main/owner geometry.
- Attach exact full-page PNG + JSON evidence for every route/theme state.
- Keep new fingerprints at `REVIEW_REQUIRED` until exact Linux CI artifacts are manually inspected.

## Non-goals

- No Figma Cloud editing.
- No OpenPencil source mutation.
- No runtime/CSS/backend/API redesign in this audit PR.
- No 200% zoom, minimum-mobile or system-state matrix in this slice.
- No broad snapshot regeneration or tolerance increase.

## Allowed paths

- `frontend/e2e/route-tablet-parity.spec.ts` or a narrowly justified consolidated route-parity replacement.
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

- Auth/session/API fixture semantics remain unchanged.
- Existing tablet 768×1024 reviewed fingerprints remain byte-for-byte unchanged.
- Desktop tests set an actual viewport of `1440×1024`; canonical OpenPencil/Figma frame sizes are not relabeled.
- New exact hashes fail closed until manual Linux artifact review.
- Product defects discovered by the matrix are split into separate Issues/PRs instead of hidden by baseline approval.

## Acceptance criteria

- 10 routes × Light/Dark execute at `1440×1024`.
- Structural ownership and geometry assertions pass before the review gate.
- 20 exact Linux PNG states are attached and manually reviewed.
- Reviewed fingerprints reproduce in immutable-head CI without snapshot update mode.
- Review audit/main-drift gate is clean before expected-head squash merge.
- Exact-main post-merge CI passes; Stage is not claimed unless runtime files actually change.

## Required checks

- Repository frontend lint/type/unit/build gates selected by CI.
- Linux Visual regression job with the new matrix.
- Full immutable-head CI after reviewed fingerprints are committed.
- Exact-main CI after squash merge.

## Risks

- A real desktop runtime defect can surface; baseline approval must stop and a child runtime Issue must be created.
- Full-page dimensions can differ by route; width and content SHA must remain exact while reviewed height is recorded per state.
- Shared Reminder/profile masking must remain deterministic across existing route evidence.

## Rollback

Revert the isolated test/evidence commits. No runtime rollback is required unless a separate runtime repair is introduced through its own Issue/PR.
