# Current Task

## Identity

- Issue: #687
- Branch: `fix/issue-687-error-boundary-semantic-palette`
- Base SHA: `8fac9124f967bc18a02de4a273a8d5575d9b3873`
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Objective

Remove the production-reachable legacy navy/purple presentation from the globally mounted `ApplicationErrorBoundary` and bind its effective Light/Dark paint to current semantic Foundation appearance tokens without changing error detection or recovery behavior.

## Scope

- `frontend/app/error-boundary.css` semantic presentation ownership.
- Fail-closed source/consumer/import-order coverage for `.lx-fatal-error`.
- Browser computed-style evidence under explicit Light and Dark using the real global stylesheet cascade.
- Blocking Playwright collection wiring for the new effective-style proof.
- Agent current task/progress/execution evidence for this atomic slice.

## Non-goals

- No `ApplicationErrorBoundary` lifecycle, logging, reload, version-mismatch, Service Worker cleanup or navigation recovery changes.
- No `frontend/app/global-error.tsx` changes; that root-layout replacement has a different bootstrap/styling boundary.
- No shared #202/#641 state redesign.
- No RouteChrome changes or repetition of #678/#681/#684.
- No broad legacy CSS cleanup or OpenPencil source mutation.
- No blind visual fingerprint update.

## Allowed paths

- `.agents/current/**`
- `frontend/app/error-boundary.css`
- `frontend/components/application-error-boundary-semantic-css-ownership.test.ts`
- `frontend/e2e/application-error-boundary-appearance.spec.ts`
- `frontend/package.json`

## Prohibited paths

- Backend/API/schema/migrations.
- `frontend/components/application-error-boundary.tsx` unless a reproduced behavioral defect proves it is required.
- `frontend/app/global-error.tsx`.
- Other route presentation files.
- OpenPencil/design source files.
- Workflows/dependency versions.

## Runtime owners

- `ApplicationErrorBoundary` remains the application render/version-mismatch lifecycle and recovery owner.
- `error-boundary.css` remains the sole presentation owner for `.lx-fatal-error` / `.lx-fatal-error-mark`.
- `design-tokens.css` plus `appearance.css` own the semantic `--ak-color-*` values consumed by the boundary.
- Existing `.lx-button` owners remain action geometry/interaction owners; this slice only verifies they do not reintroduce legacy fatal-surface paint.

## Documentation owners

- `.agents/current/**` for branch-local execution context.
- Issue #687 / its PR for reviewable evidence.

## Invariants

- Error lifecycle, diagnostics, copy and recovery actions remain unchanged.
- Existing fatal-screen geometry and compact action stacking remain unchanged.
- Explicit Light and Dark must resolve from semantic appearance tokens rather than fixed dark literals.
- The legacy purple radial treatment and known old fatal-error paint must not remain effective.
- Browser evidence must inspect computed styles after the complete global stylesheet cascade, not infer ownership from source order alone.

## Acceptance criteria

- Light and Dark fatal surfaces resolve canvas/text paint from current semantic tokens.
- Mark, label, body and code resolve weak/muted/surface semantics with readable contrast.
- Known legacy fatal-error literals are absent from the live stylesheet.
- Source contract proves global import + component consumer + semantic-token ownership + blocking E2E collection.
- Browser computed-style evidence proves effective Light/Dark ownership.
- Existing application error recovery tests remain green.
- Full immutable-head CI succeeds before merge.
- Clean review/thread and main-drift audit precedes expected-head squash merge.
- Runtime merge receives exact-main CI and exact-SHA Stage/public validation.

## Required checks

- Frontend lint, typecheck, Vitest, build and dependency audit.
- Blocking UI Playwright shard collecting `application-error-boundary-appearance.spec.ts`.
- Existing `application-error-boundary.test.ts` recovery contract.
- Full PR CI plus review/thread audit.
- Exact-main push CI and Stage/public validation after runtime merge.

## Risks

- Later generic button or accessibility CSS can win the cascade; browser evidence must inspect final computed styles rather than add broad `!important`.
- Weak-state contrast can regress if raw error tones are mixed against the wrong semantic surface.
- A synthetic browser fixture could drift from component markup; the source contract must fail closed on the exact selector family rendered by `ApplicationErrorBoundary`.

## Rollback

Revert the atomic #687 presentation/test squash merge. Error detection and recovery behavior are intentionally unchanged.
