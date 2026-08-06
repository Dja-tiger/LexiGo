# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-word-detail-related-phrase-targets`
- Base SHA: `078f842740bbed27deed92888e8f482cb133f616`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Guarantee a minimum 44 CSS px fine-pointer and 48 CSS px coarse-pointer effective target for every live related-phrase action on canonical `/words/[id]`, while preserving the approved 34px painted pill presentation and existing phrase-detail navigation.

## Scope

- Confirm the canonical authenticated Word Detail related-phrase list as the only runtime owner in this slice.
- Add one route-scoped interaction layer for `.lx-word-detail-phrase-list button`.
- Preserve inline dimensions and expand only the block-axis event surface.
- Reserve sufficient wrapped-row separation for coarse-pointer targets without changing the painted pills.
- Add fail-closed source ownership and cross-browser geometry, hit-testing, focus, navigation and compact-overflow evidence.
- Register the browser proof in the blocking UI and accessibility commands.

## Non-goals

- Related-phrase loading/error retry action.
- Word Detail Back, speech, practice or sticky knowledge actions.
- API, session, History, storage or route-owner changes.
- Text, typography, color, border, radius, painted padding or visual-baseline changes.
- Whole-application 200% browser zoom or physical-device closure of Issue #74.
- Dependabot PRs #304, #305 and #403.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/word-detail-related-phrase-touch-targets.css`
- `frontend/components/word-detail-related-phrase-touch-target-source.test.ts`
- `frontend/e2e/word-detail-related-phrase-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- `frontend/components/word-detail-presentation.tsx`
- `frontend/app/word-detail.css`
- API, backend, migrations, session, navigation, storage and service-worker owners.
- Existing visual snapshots.
- Workflow files.
- Dependabot branches and manifests beyond the required test-script registration.

## Runtime owners

- Canonical route entry: `LexigoDictionaryApp` on `/words/[id]`.
- Data/state owner: `WordDetailRoute`.
- Native related-phrase actions and callbacks: `RelatedPhrases` in `frontend/components/word-detail-presentation.tsx`.
- Phrase-detail navigation: `DictionaryCatalog` maps the selected phrase slug to canonical `/phrases/[slug]` navigation.
- Painted presentation and focus owner: `frontend/app/word-detail.css`.
- New interaction-only owner: `frontend/app/word-detail-related-phrase-touch-targets.css`.

## Documentation owners

- Current task facts: `.agents/current/**`.
- Final completed evidence: `.agents/PROJECT_STATE.md` and Issue #74 in the later reconciliation slice.

## Invariants

- Each related phrase remains a native button with its exact English accessible name and existing callback.
- Painted minimum height remains 34px; padding, border, radius, typography, colors and hover/focus presentation remain owned by `word-detail.css`.
- Fine-pointer target is at least 44px; coarse-pointer target is at least 48px.
- Inline target expansion remains zero so adjacent same-row phrase targets cannot overlap.
- Wrapped coarse-pointer rows reserve at least the combined block-axis expansion and do not overlap.
- Clicking any effective target perimeter navigates to the selected canonical phrase detail.
- No horizontal overflow at desktop, 390px and 320px widths.
- Existing Back target and all unrelated Word Detail controls remain outside the new selector ownership.

## Acceptance criteria

- Every visible canonical related-phrase action has a 44px fine-pointer or 48px coarse-pointer effective block size.
- The existing 34px painted pill geometry remains unchanged.
- Effective targets are transparent, borderless and shadowless.
- Same-row targets retain non-overlapping inline geometry and visible separation.
- Wrapped rows retain non-overlapping effective block geometry on coarse-pointer projects.
- All four effective perimeter points resolve to the owning native button.
- Keyboard focus remains visible through the existing Word Detail focus owner.
- A perimeter click preserves the phrase slug and opens canonical `/phrases/[slug]`.
- Desktop Chromium, Android Chromium and iOS WebKit prove the contract at applicable compact/desktop widths.

## Required checks

- Source ownership contract.
- Frontend lint and TypeScript.
- Frontend unit suite and production build.
- Targeted Playwright proof in desktop Chromium, Android Chromium and iOS WebKit.
- Blocking UI and accessibility commands.
- Existing Word Detail, Dictionary/Phrases navigation, accessibility, visual, performance, PWA, security and container gates through authoritative full CI.
- Final developer-authored immutable-head CI, no unresolved review threads, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.

## Risks

- Transparent block-axis expansion can overlap wrapped rows if coarse-pointer row gap remains 10px.
- Long phrase text can produce a painted control taller than the nominal 34px; the interaction rule must use a minimum target rather than force a fixed height.
- Pseudo-element hit testing can be masked by adjacent stacking contexts or escape the Word Detail content owner.
- Cross-island phrase navigation can expose stale fixtures if the test asserts destination presentation rather than the canonical URL handoff.

## Rollback

Remove the route-scoped interaction stylesheet and its import, source contract, browser proof and package-script registrations. The existing 34px painted related-phrase controls and navigation callbacks remain intact in `word-detail.css` and `word-detail-presentation.tsx`.