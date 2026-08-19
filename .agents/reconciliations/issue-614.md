# Issue #614 Delivery Reconciliation

## Delivery

- Issue: #614 — consolidated reduced-motion matrix for 10 canonical routes
- Parent: #205
- PR: #615 — `test(a11y): audit reduced motion across canonical routes`
- Final developer head: `db0a1ea87a3471b737885ea9ca2092be4563ae69`
- Final immutable CI: #3868 / run `32250263760` — `success`
- Blocking Accessibility audit job: `96060224197` — `success`
- Squash merge SHA: `c33a627bb226f3729cb642f70ca98be842b3c914`
- Delivered main tree: `23a509e2e4f1912edb8608786dd99cddc948bf32`
- Issue state after merge: closed/completed

## Delivered acceptance

- Added one consolidated executable reduced-motion owner for all 10 canonical routes.
- Matrix covers compact `390×844` and desktop `1440×1024`, explicit Light/Dark: 40 deterministic states.
- The audit emulates `prefers-reduced-motion: reduce` while retaining production motion CSS; it intentionally does not use the deterministic visual helper that disables animation/transition.
- CSS animation/transition durations are normalized to milliseconds and fail above `0.01ms` when active.
- Running/pending Web Animations are prohibited using typed `Animation.playState` and `Animation.pending`.
- Document, route owner and rendered navigation require `scroll-behavior: auto`.
- Representative controls are reached through keyboard Tab and retain painted `:focus-visible` feedback without spatial transform motion.
- Route owner and ordinary/focused RouteChrome ownership remain canonical.
- Per-state machine-readable evidence and runtime-error capture are retained.
- A fail-closed source/collection contract guards the matrix and explicit blocking `test:e2e:a11y` collection.

## Validation history

- Diagnostic CI #3863 / run `32248947266` exposed only a TypeScript DOM typing mistake: `Animation.pending` is a boolean property, not a `"pending"` `playState` literal.
- That source issue was corrected without changing route scope, tolerances or runtime behavior.
- Corrected implementation CI #3865 / run `32249196644` completed successfully.
- Final evidence-sync head `db0a1ea87a3471b737885ea9ca2092be4563ae69` then passed full CI #3868 / run `32250263760`.
- Final CI included frontend core, Accessibility, both UI shards, Visual, Lesson, PWA, service-worker, security, dictionary, performance, backend integration/unit and both API/Web container builds.
- Final merge audit found `behind_by=0`, no reviews, no inline review threads and exactly the six allowed test/harness paths.
- Squash merge used expected-head protection.

## Design source

The active production design/handoff source is repository-owned OpenPencil:

- `design/openpencil/LexiGo Design System.op`
- `design/openpencil/LexiGo Design Tokens.json`
- `docs/figma/openpencil-screen-map.json`

Figma Cloud, the historical file key and Figma node IDs are archival/provenance references only. Figma MCP access/quota is not a delivery prerequisite or blocker.

## Runtime / Stage

This delivery changes test/evidence ownership only. No runtime React/CSS/backend/API/OpenPencil source was changed, so no Stage redeploy is required or claimed for #614.

Physical-device reduced-motion system-setting sign-off remains tracked separately by #461.
