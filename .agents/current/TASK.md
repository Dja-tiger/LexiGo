# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-phrase-detail-targets`
- Base SHA: `85c3b69350e87cb5ed399f93a418a020ef9170c9`
- Head SHA: resolve from live branch ref
- PR: #450

## Objective

Close the next verified Issue #74 residual gap on the canonical Phrase Detail route by giving every live Phrase Detail action a minimum 44px fine-pointer / 48px coarse-pointer effective target without changing approved painted geometry or runtime semantics.

## Scope

- Canonical `/phrases/:slug` Phrase Detail only.
- `К списку фраз` back action.
- `Прослушать` speech action.
- `Настроить урок` primary action.
- `К другим фразам` secondary action.
- `Начать практику` side action.
- Route-scoped, paint-inert block-axis hit ownership.
- Desktop Chromium, Android Chromium and iOS WebKit acceptance at representative desktop/tablet/mobile widths.
- Blocking UI and accessibility collection plus a source-level ownership contract.

## Non-goals

- Phrases catalog controls; they are already owned by PR #442 and PR #407.
- AsyncStatePanel recovery controls; they are already owned by PR #444.
- Speech playback semantics or implementation.
- Phrase API, slug, navigation/history or lesson-configuration behavior changes.
- Painted dimensions, colors, borders, typography, layout composition or visual-baseline updates.
- Dependencies, lockfile, workflows, backend or deployment configuration.
- Physical-device acceptance; this remains a final manual Issue #74 gate.

## Allowed paths

- `frontend/app/phrase-detail-touch-targets.css`
- `frontend/app/layout.tsx` — one stylesheet import only
- `frontend/e2e/phrase-detail-touch-targets.spec.ts`
- `frontend/components/phrase-detail-touch-target-source.test.ts`
- `frontend/package.json` — authoritative UI/a11y collection entries only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `.agents/PROJECT_STATE.md`
- `frontend/package-lock.json`
- `frontend/app/phrases.css`
- `frontend/components/phrase-detail-presentation.tsx`
- `frontend/components/speech-player-button.tsx`
- `frontend/app/speech-player.css`
- visual-baseline metadata or binary snapshots
- `.github/workflows/**`
- backend/runtime API files
- dependency/devDependency version fields

## Runtime owners

- `frontend/components/phrase-detail-presentation.tsx` owns the five live Phrase Detail controls and callbacks.
- `frontend/app/phrases.css` owns their painted 44px minimum geometry and route presentation.
- `frontend/components/speech-player-button.tsx` owns speech-button state and activation semantics.
- The new interaction layer owns only effective pointer geometry for the five Phrase Detail actions.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Preserve existing 44px painted minimums and all current visual baselines.
- Expand only block-axis hit ownership; all five text-bearing controls already exceed the modality contract inline.
- Transparent target slop must have no border, background or box-shadow and must not replace existing focus ownership.
- Expanded targets must remain independently clickable and non-overlapping where actions are adjacent or wrapped.
- Existing accessible names and callbacks remain unchanged because runtime/presentation owners are not edited.
- `layout.tsx` may change only by a single stylesheet import.
- `package.json` may change only by adding one acceptance spec once to each authoritative UI/a11y command; all package metadata remains exact-main.
- No binary or content-addressed visual baseline may be updated for this paint-inert slice.

## Acceptance criteria

- On fine pointer, each of the five Phrase Detail controls exposes an effective target >=44px in both dimensions.
- On coarse pointer, each exposes an effective target >=48px in both dimensions.
- Four perimeter probes for every effective target resolve to the owning control in desktop Chromium, Android Chromium and iOS WebKit.
- Painted control heights remain >=44px and no target layer changes border/background/box-shadow paint.
- The two main Phrase Detail actions remain positively separated after expansion when side-by-side or wrapped/stacked.
- Keyboard traversal exposes the existing visible `:focus-visible` treatment.
- The route has no horizontal overflow at the tested widths.
- Existing Phrase Detail content-addressed visual baselines remain unchanged.
- Source contract proves live-selector ownership, import order, paint-inert declarations and authoritative collection.

## Required checks

- Vitest/source ownership contract through frontend unit suite.
- Blocking `test:e2e:ui` and `test:e2e:a11y` collection on the new Playwright spec.
- Existing Phrase Detail visual regression suite without baseline updates.
- Full immutable-head product CI before Ready.
- Clean PR review/comment/thread audit.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.
- Separate docs-only Agent Harness reconciliation after product delivery.

## Risks

- A pseudo hit surface can be clipped or covered by fixed mobile navigation; acceptance must center each owner before real-hit probing.
- Pairwise geometry sampled across different scroll positions can create false overlap; adjacent action targets must be measured in one shared frame.
- `position: relative` or pseudo ownership could accidentally change a speech/control stacking context; existing visual baselines must remain immutable.
- Full-file edits to `layout.tsx` or `package.json` can introduce unrelated drift; fail closed on exact base/head diff before CI.

## Rollback

Revert the route-scoped stylesheet, its single import, dedicated acceptance/source contract and the two package-script collection entries as one atomic slice. No runtime data or API migration is involved.
