# LexiGo Project State

## Verification

- Last verified: 2026-08-14 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live repository `main`: `07503e6fdd619a924b72c9f48f80f482bf36e28d` after PR #507.
- Latest fully verified Stage/public runtime: `1fae52ab9dda9bc807d60a20cdb8cee594172e0d` from PR #506, Stage run #3298.
- PR #507 exact-main push CI #3457 is running on `07503e6fdd619a924b72c9f48f80f482bf36e28d`; do not claim its Stage delivery until that run and the exact-SHA Stage/public gate are green.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require scope-selected frontend/backend/browser/accessibility/performance/container gates.
- Runtime delivery requires immutable-head PR CI, clean review audit, SHA-guarded squash merge, exact-main validation and Stage/public validation.
- Agent Docs changes use the fail-closed lightweight classifier and must not deploy runtime.
- Physical-device acceptance remains manual when the Issue explicitly requires it.

## Figma source of truth

- Canonical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- PR #488 preserves the audited offline source provenance in `docs/figma/`.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- PR #501 merged repository route → Figma node → Issue mapping as `83bfd5ddfbee3d2ee858e1d0f00e79ba47791ea9`.
- PR #502 merged Git LFS routing for `design/figma/*.fig` as `c4b3f0145cee93be6e53de3775f8406bf6ed3e6e`.
- The native `design/figma/LexiGo Design System.fig` binary is not stored in GitHub. Issue #487 remains open until binary-safe upload and SHA-256 verification.
- A 2026-08-14 live metadata audit confirmed First Use mobile node `79:46` and shared state nodes `79:69`, `79:117`, `79:129`, `79:194`; #487 marks the node-level #201 re-audit complete.
- Figma `get_design_context`, `use_figma` and later metadata reads are blocked by the connected Starter-plan MCP call limit. Do not claim canvas or Screen Map synchronization while that limit is active.

## Figma/PWA delivery

- PR #505 upgraded Go `1.26.5 → 1.26.6` and cleared reachable stdlib `govulncheck` findings; merge `9bf6f26899fbdf937f5612c08da7bab64e38af69`.
- PR #506 aligned manifest/theme/icon/offline palette/service-worker install assets with the canonical appearance contract; merge `1fae52ab9dda9bc807d60a20cdb8cee594172e0d`; exact-main CI and Stage #3298 are green.
- PR #507 aligned static `offline.html` theme-color with canonical Dark `#10211d` and added regression ownership; merge `07503e6fdd619a924b72c9f48f80f482bf36e28d`; PR CI #3456 is green, exact-main delivery is pending final verification.
- Issue #508 owns physical iOS/Android/desktop installed-app icon/splash/cold-start QA. Automated CI must not be used as substitute evidence.

## Issue #201 design gate

- Existing `Mobile / Onboarding / Light` node: `79:46`.
- Remaining canonical design gap: Guest Home mobile/desktop, desktop onboarding, diagnostic states, Light/Dark coverage, recovery/error states and stable Screen Map registration.
- Delivered backend diagnostic state contract uses `not_started`, `in_progress`, `completed`, `skipped` and pre-reveal self-marks `known` / `unsure` / `new`.
- Do not implement First Use UI until missing production node IDs are canonical.

## Current state

- #68 engineering implementation is merged through #506/#507; exact-main/Stage #507 remains the final engineering delivery gate. Physical install QA is separated into #508.
- #201 remains design-gated by missing canonical frames and current Figma write limits.
- #203 repository mapping is complete; live Screen Map/archive synchronization remains open.
- #205 remains the final route-by-route parity audit and should follow #201/#203.
- #487 remains blocked only on the native `.fig` binary plus downstream #203/#205 source-of-truth completion.

## Remaining roadmap

- Finish #507 exact-main CI/Stage, then close engineering Issue #68 and keep physical-device evidence in #508.
- #487: upload the exact native `.fig` through a binary-safe path and verify SHA-256.
- #203: synchronize live Screen Map/archive status when Figma MCP write access is available.
- #201: complete canonical First Use design states, then implement the approved flow.
- #205: final route-by-route visual parity after #201/#203.
