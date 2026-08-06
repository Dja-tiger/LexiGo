# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-word-detail-related-phrase-retry-target`
- Base SHA: `f4de7ead2851065d8bb0df083ac3203bc7828d9e`
- Head SHA: resolve from live branch ref
- PR: #415 (Draft)

## Objective

Guarantee a minimum 44 CSS px fine-pointer and 48 CSS px coarse-pointer effective touch target for the conditional Word Detail related-phrase retry action `Повторить`, without changing its painted 36px presentation or retry behavior.

## Scope

- Add one route-scoped interaction-only stylesheet for `.lx-word-detail-inline-error button` on canonical `/words/[id]`.
- Preserve the existing error copy, native button semantics, exact accessible name and `onRetryRelated` callback.
- Add a fail-closed source ownership contract.
- Add desktop Chromium, Android Chromium and iOS WebKit geometry, hit-testing, focus, retry-request and compact-overflow evidence.
- Register the browser proof in the blocking UI and accessibility commands.
- Maintain factual Agent Harness task records.

## Non-goals

- No change to Word Detail runtime, API clients, ResourceStatus mapping, History, session or storage ownership.
- No change to the painted Word Detail stylesheet, typography, colors, borders, spacing or visual baselines.
- No remediation of other preview, sticky, header/icon or route-specific controls.
- No whole-application 200% browser-zoom or physical-device acceptance in this slice.
- No dependency or CI workflow changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/word-detail-related-phrase-retry-touch-targets.css`
- `frontend/components/word-detail-related-phrase-retry-touch-target-source.test.ts`
- `frontend/e2e/word-detail-related-phrase-retry-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- `frontend/components/word-detail-presentation.tsx`
- `frontend/components/word-detail-route.tsx`
- `frontend/components/dictionary-catalog.tsx`
- `frontend/app/word-detail.css`
- API, backend, migrations, deployment, workflows, snapshots and dependency manifests outside `frontend/package.json` script registration.

## Runtime owners

- `frontend/components/word-detail-presentation.tsx` owns the conditional retry button, exact `Повторить` name and `onRetry` callback.
- `frontend/components/word-detail-route.tsx` owns related-phrase request/retry state.
- `frontend/app/word-detail.css` owns painted geometry, layout, focus, forced-colors and responsive presentation.
- The new stylesheet owns only transparent block-axis event geometry for the conditional retry button.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- The retry control remains a native button rendered only for retryable related-phrase failures.
- The accessible name remains exactly `Повторить`.
- Clicking the control retries the same semantic phrase lookup for the current word and restores the related-phrase list on success.
- The painted button remains 36px high with unchanged padding, border, radius, color and background.
- Inline expansion remains zero; the transparent target must not cover the adjacent error message or create horizontal overflow.
- Existing Word Detail focus-visible and forced-colors owners remain effective.
- No visual baseline update is expected.

## Acceptance criteria

- Fine-pointer effective target height is at least 44px.
- Coarse-pointer effective target height is at least 48px.
- All four effective-target perimeter points resolve to the retry button.
- Effective target width equals the painted button width and does not overlap the error message.
- Keyboard focus remains visible.
- Retry sends the same related-phrase request semantics and replaces the error state with canonical related phrases.
- The route has no horizontal overflow at 1440px, 390px and 320px.
- Source contract proves import order, selector ownership, native semantics, callback ownership, preserved 36px painted geometry and absence of visual declarations.

## Required checks

- Agent Harness and allowed-path contracts.
- Frontend unit/source contracts, lint, TypeScript and production build.
- Focused Playwright proof in desktop Chromium, Android Chromium and iOS WebKit.
- Blocking UI and accessibility suites.
- Full authoritative product CI on the final developer-authored head.
- Unchanged Linux visual baselines unless authoritative artifacts prove an intentional deterministic delta.
- Expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.

## Risks

- Pseudo-element hit slop can be obscured by another stacking owner or extend outside the viewport.
- A broad request fixture could fail the initial related-phrase request instead of only the intended retryable state.
- Source-order or selector changes could accidentally take painted presentation ownership.

## Rollback

Remove the interaction stylesheet, its layout import, source/browser contracts and package-script registrations. Existing Word Detail runtime and painted presentation then remain byte-for-byte unchanged.
