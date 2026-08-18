# Current Task

## Identity

- Issue: #601
- Branch: test/issue-601-route-browser-zoom-parity
- Base SHA: b1444d5e5153da9b8fe275b7f1f175e9bd25286b
- Head SHA: resolve from live branch ref
- PR:

## Objective

Close the consolidated true browser-owned 200% zoom/reflow dimension of umbrella #205 for all ten canonical routes in explicit Light and Dark without changing product runtime unless the audit proves a separate defect.

## Scope

- Reuse deterministic route fixtures and canonical ownership semantics from the delivered consolidated route-parity matrix.
- Run the ten canonical routes at real browser zoom factor 2 in explicit Light and Dark from the authoritative desktop Chromium environment.
- Prove the zoom through the existing extension/controller and CDP `cssVisualViewport.zoom`, not synthetic root-font scaling.
- Include route owner, RouteChrome/focused-route ownership, fixed/global chrome, document overflow, horizontal containment, partially visible focusable controls, keyboard-originated focus-visible evidence and runtime-error checks.
- Emit exact Linux PNG/JSON evidence for all 20 states and keep every new fingerprint fail-closed until manual review.
- Preserve existing standalone Home/Learn/Active Lesson/Phrases browser-zoom contracts unchanged.

## Non-goals

- Runtime CSS/React redesign in this audit PR.
- Backend/API/schema/session changes.
- Figma Cloud edits or OpenPencil source mutation.
- Replacing existing route-specific zoom owners.
- Synthetic `font-size: 200%` as the sole zoom proof.
- Blind snapshot/fingerprint approval or tolerance widening.

## Allowed paths

- frontend/e2e/route-browser-zoom-parity.spec.ts
- frontend/playwright.visual.config.ts
- frontend/components/browser-zoom-collection-contract.test.ts
- .agents/current/**

## Prohibited paths

- frontend/app/** runtime CSS/React unless a separate defect Issue/PR is created first
- backend/**
- deploy/**
- database/schema/migrations
- design/**
- .github/workflows/**
- existing reviewed visual baseline owners unrelated to this matrix
- direct writes to main

## Runtime owners

- Existing route runtime owners on `main`; this slice is evidence/test-only.
- Existing browser zoom extension/controller under `frontend/e2e/support/browser-zoom-extension` remains the zoom mechanism.

## Documentation owners

- `.agents/current/**` for active execution memory.
- Issue #601 for audit scope and child-defect policy.

## Invariants

- True browser zoom must be proven by the extension controller plus CDP `cssVisualViewport.zoom` near 2.
- Root font size must not be used as a fake replacement for browser zoom.
- All 20 route/theme states must finish structural/runtime checks before any fingerprint can be approved.
- Fixed/global RouteChrome is part of the reflow surface.
- Focused routes keep ordinary RouteChrome suppressed; ordinary routes expose exactly one visible owner.
- Existing 320×700, 768×1024 and 1440×1024 reviewed route-parity evidence remains unchanged.
- Any genuine reflow defect becomes a separate atomic runtime Issue/PR before this audit proceeds.

## Acceptance criteria

- Ten canonical routes × explicit Light/Dark execute at real browser zoom 2.
- CDP and DOM metrics prove effective browser zoom/reflow.
- Canonical route owner remains mounted in every state.
- No document horizontal overflow or clipped main/route/global-chrome surface.
- No partially clipped rendered focusable control.
- Keyboard-originated focus-visible evidence exists per state.
- Runtime error capture is clean.
- Exact Linux PNG/JSON evidence for all 20 states is manually reviewed before fingerprints are approved.
- Final immutable-head CI succeeds with clean review/drift gate.
- Squash merge uses expected-head protection and exact-main CI succeeds.
- Stage remains on the newest runtime SHA because this PR is test/docs-only.

## Required checks

- Agent Harness validation.
- Browser-zoom collection source contract/unit tests.
- Frontend lint/typecheck/unit/build/dependency audit.
- Diagnostic authoritative Visual run reaching deliberate `REVIEW_REQUIRED` only after structural assertions.
- Manual review of exact Linux Visual artifact for all 20 states.
- Final immutable-head full CI.
- Review threads/reviews/main drift audit.
- Exact-main CI after merge; no Stage redeploy claim.

## Risks

- Browser zoom persists per tab across navigation, so each route must normalize to 1× before opening/capturing the next state.
- Onboarding replaces shared API routing; keep it last in the route order or isolate the context.
- Horizontal scrollers may contain fully off-screen controls; only partially visible controls should fail viewport containment.
- A broad audit can expose unrelated runtime defects; do not weaken assertions or fold fixes into this evidence PR.

## Rollback

Revert the audit-only squash merge. Runtime and deployed product SHA remain unchanged.
