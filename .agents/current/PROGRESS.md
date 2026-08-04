# Current Task Progress

## 2026-08-05 01:52 Europe/Moscow

### Verified

- Live task base is docs reconciliation `main` SHA `b42f540f240883cfd4b23ce6e248512ac1f21316`; latest deployed product SHA remains `0535f6641b6624b5f07266137942c3c5ae73c167`.
- Issue #74 remains open after completed PRs #387, #389 and #391.
- Open PRs #304–#306 are unrelated Dependabot maintenance work.
- Expanded mobile `/learn` exposes three live radiogroups: `Режим обучения`, `Раздел обучения` and `Размер урока`.
- Current mobile presentation sets every direct radio button in these groups to at least 44px but has no coarse-pointer 48px owner.
- Existing visual gap between adjacent options is 6px.
- Figma file `3xXmBWnf38jbvLjtziwber`, expanded Learn node `203:5`, defines mode node `203:66` at 32px painted height, material node `203:77` at 45px and size node `203:92` at 32px, all with 6px spacing.
- Draft PR #393 contains exactly the eight allowed paths and is not behind its base.

### Finding

The live radio controls already satisfy the fine-pointer 44px runtime floor but do not expose an explicit 48px coarse-pointer event-surface contract. Increasing painted geometry would diverge from Figma and create unnecessary visual churn.

### Root cause

The adaptive Lesson Composer presentation predates the Issue #74 input-modality interaction owners. It supplies responsive layout and 44px minimum heights but does not separate painted geometry from effective coarse-pointer target geometry.

### Implementation

- Added `lesson-composer-option-touch-targets.css` after the existing Lesson Composer presentation, accessibility and disclosure-target owners.
- Added a 44px default and 48px coarse-pointer interaction token.
- Expanded only the block-axis event surface for direct mode, source and size radio buttons; inline expansion remains zero.
- Added a source contract protecting exact runtime semantics, import order, visual-owner boundaries and blocking command registration.
- Added a focused browser proof covering every rendered radio, native-plus-pseudo target union, all four perimeter hits, zero pairwise overlap, selected roving focus, alternate selection and compact horizontal reflow.
- Registered the proof exactly once in `test:e2e:ui` and `test:e2e:a11y`.

### Pre-CI read-back corrections

- Initial browser proof referenced an outer helper from a Playwright page callback. Because outer functions are not serialized into browser context, the measurement helper was moved inside each `evaluate`/`evaluateAll` callback before CI.
- Initial source contract expected a literal `aria-label="Размер урока"`. The live runtime correctly names that group through `<legend id="lesson-size-label">` plus `aria-labelledby="lesson-size-label"`; the contract was aligned with the actual accessibility owner.
- Source inspection also confirmed four `role="radio"` templates: three inline option maps plus the reusable collection-card radio component.
- No production CSS or runtime component changed during these corrections.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/lesson-composer-option-touch-targets.css`
- `frontend/components/lesson-composer-option-touch-target-source.test.ts`
- `frontend/e2e/lesson-composer-option-touch-targets.spec.ts`
- `frontend/package.json`

### Checks passed

- Live GitHub, stage, Issue and open-PR reconciliation.
- Mandatory Agent Harness and current-state read.
- Runtime visibility, accessibility-tree semantics, computed source ownership and exact Figma-node inspection.
- Atomic allowed-path and rollback pre-flight.
- Full read-back of every product/test/package write.
- Branch compare: eight allowed paths, `behind_by=0`, no runtime component, adaptive presentation or snapshot change.
- Exact search confirmed no existing conflicting `::before` owner on the targeted option buttons.

### Checks failed

- None executed yet; no CI claim is made.

### Current branch head

Resolve from the live branch after the remaining execution-record write. The PR head before this progress update was `aeb4b64cde0b4243a0e724e9e2d05091c9e49dd5`.

### Next action

Complete the execution record, verify the resulting final diff and require fresh full authoritative CI on the final developer-authored head before any Ready or merge transition.
