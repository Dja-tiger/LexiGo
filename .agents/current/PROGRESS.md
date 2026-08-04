# Current Task Progress

## 2026-08-05 01:57 Europe/Moscow

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
- Source inspection confirmed four `role="radio"` templates: three inline option maps plus the reusable collection-card radio component.
- No production CSS or runtime component changed during these corrections.

### CI diagnosis

Authoritative CI #2775 / run `30958010741` ran on developer head `02be8af2e74cd0e18932dace0c74a47dd7cc0835`.

Passed before the frontend-core failure:

- change classifier and full product-pipeline selection;
- frontend lint;
- frontend TypeScript;
- completed backend checks continued independently, but this run is superseded and is not merge evidence.

Failed:

- Frontend core quality job `92155520449`, unit/source contract step.

Exact evidence:

- `lesson-composer-option-touch-target-source.test.ts` produced two failures;
- global `runtime.match(/role="radiogroup"/g)` found four groups because the large source file contains one unrelated radiogroup outside this slice;
- the naive forbidden substring `width:` matched the allowed media query `max-width: 767px` rather than a visual `width` declaration;
- 96 other unit files and 595 tests passed in the same run.

Correction:

- removed the ambiguous global radiogroup count while retaining exact assertions for the three targeted group owners;
- replaced forbidden declaration substrings with line-anchored CSS declaration regexes, so `width:` is prohibited but `max-width:` is allowed;
- correction commit: `4826f8225f87634ab6d22aefc59f87430e4d1ae8`;
- production CSS, runtime components and browser proof remain unchanged.

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
- Branch compare: eight allowed paths, no runtime component, adaptive presentation or snapshot change.
- Exact search confirmed no existing conflicting `::before` owner on the targeted option buttons.
- CI #2775 lint and typecheck passed; failure was isolated to the new source contract.

### Checks failed

- CI #2775 source contract on superseded head `02be8af2…`, for the two exact test-only causes described above.

### Current branch head

Resolve from the live branch after the remaining execution-record write. No final CI claim is made yet.

### Next action

Complete the execution record, verify the final eight-path diff and require a fresh full authoritative CI run on the resulting immutable developer head before any Ready or merge transition.
