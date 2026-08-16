# Current Task

## Identity

- Issue: #565
- Branch: fix/first-use-desktop-parity
- Base SHA: ad404b84cd26f063fa189abac3fd4a8ca10ab4e6
- Head SHA: resolve from live branch ref
- PR: #566

## Objective

Fix the reproduced desktop First Use diagnostic presentation defect discovered by #563 without changing the delivered onboarding state machine or compact/mobile product behavior.

## Scope

- Authenticated `/onboarding` desktop diagnostic pre-reveal, reveal and resume presentation.
- Canonical OpenPencil nodes: Light `n342`, `n361`, `n378`; Dark `n514`, `n533`, `n550`.
- Separate desktop step/title intro from the diagnostic surface.
- Flatten the nested desktop term card into the single approved diagnostic surface.
- Preserve one interactive control set and one React state owner.
- Preserve truthful server-owned prompt data and the existing mark/reveal mutation ordering.

## Non-goals

- Guest Home redesign or token changes.
- Backend/API/schema changes.
- OpenPencil, token or screen-map changes.
- Session, route-history, storage or deploy-topology changes.
- Changing `status/start/mark/complete/skip` or `known/unsure/new` behavior.
- Hardcoding OpenPencil demo sentence content that is not present in `DiagnosticPrompt`.

## Allowed paths

- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`
- `frontend/e2e/first-use-visual.spec.ts` only after exact Linux artifact review if the existing reviewed runtime baseline must be updated
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `backend/**`
- `api/**`
- `design/**`
- `docs/figma/**`
- `deploy/**`
- `.github/workflows/**`
- unrelated frontend routes/components/styles/tests

## Runtime owners

- Runtime/state: `frontend/components/lexigo-onboarding-app.tsx`
- Presentation/CSS: `frontend/app/first-use.css`
- API type boundary: `frontend/lib/onboarding.ts` (read-only)
- Current route/accessibility source contract: `frontend/components/first-use-route-contract.test.ts`
- Existing runtime visual approval owner: `frontend/e2e/first-use-visual.spec.ts`

## Documentation owners

- Issue #565 records the defect contract and exact OpenPencil nodes.
- #563 / PR #564 remain the separate parity/provenance audit and are not runtime owners.

## Invariants

- Diagnostic answer/translation is not visible before a successful mark mutation.
- Resume is reconstructed from server `in_progress` state after reload/direct entry.
- `known`, `unsure`, `new` remain the only self-mark values.
- Skip remains non-blocking and does not mutate scheduler state.
- `DiagnosticPrompt.topic` remains dynamic server-owned content; no design-only example sentence is fabricated.
- Compact/mobile First Use behavior and interactive ownership remain unchanged.
- First Use Light foreground/accessibility token contract remains unchanged.

## Acceptance criteria

- Desktop diagnostic intro and single-surface hierarchy match the approved OpenPencil state family.
- Desktop Resume displays the selected local `Не уверен` state before save and without translation reveal.
- Desktop saved-progress note/action hierarchy matches the approved design structure.
- No nested bordered term card or diagnostic progress track remains in the desktop presentation.
- Compact/mobile state-machine and presentation remain regression-safe.
- Light/Dark, keyboard, axe, 200% zoom/reflow, direct entry/reload/history and configured browser matrix pass.
- Exact Linux actual is manually reviewed before any visual fingerprint update.
- Full immutable-head CI, exact-main CI and exact-SHA Stage/public validation are green before completion.

## Required checks

- First Use source/unit contracts.
- Frontend lint, typecheck, unit and production build.
- Chromium/WebKit/Android/iOS configured E2E.
- Accessibility/axe and focus behavior.
- History/recovery and service-worker/CSP gates selected by repository CI.
- Linux visual regression and manual exact-artifact review.
- Performance budgets and full required CI.
- Post-merge exact-main CI and Stage/public validation.

## Risks

- A desktop-only CSS override can accidentally alter compact layout through selector specificity.
- Moving presentation hierarchy can duplicate accessible headings if hidden/visible states are not scoped correctly.
- Blindly copying OpenPencil demo data would create false production content.
- Updating legacy 1440×1024 hashes before review could hide the reproduced defect; #564 separately owns canonical 1440×900 provenance migration.

## Rollback

Revert the #565 presentation slice only. The backend onboarding contract, active OpenPencil source and previously deployed First Use flow remain independently intact.
