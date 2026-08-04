# Current Task Progress

## 2026-08-05 02:03 Europe/Moscow

### Verified

- Live task base is docs reconciliation `main` SHA `b42f540f240883cfd4b23ce6e248512ac1f21316`; latest deployed product SHA remains `0535f6641b6624b5f07266137942c3c5ae73c167`.
- Issue #74 remains open after completed PRs #387, #389 and #391.
- Open PRs #304–#306 are unrelated Dependabot maintenance work.
- Expanded mobile `/learn` exposes three live radiogroups: `Режим обучения`, `Раздел обучения` and `Размер урока`.
- Current mobile presentation sets every direct radio button in these groups to at least 44px but has no coarse-pointer 48px owner.
- Existing visual gap between adjacent options is 6px.
- Figma file `3xXmBWnf38jbvLjtziwber`, expanded Learn node `203:5`, defines mode node `203:66` at 32px painted height, material node `203:77` at 45px and size node `203:92` at 32px, all with 6px spacing.
- Draft PR #393 contains exactly the eight allowed paths and remains based on the exact task base.

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

- Moved geometry measurement inside each Playwright `evaluate`/`evaluateAll` callback because outer helper functions are not serialized into browser context.
- Aligned the size-group contract to its real `<legend>` plus `aria-labelledby` accessible-name owner.
- Replaced inferred whole-file role counts with exact option-map and `CollectionCard` ownership evidence.
- Corrected a pre-rerun source assertion from `sourceOptions` to the exact runtime owner `SOURCE_OPTIONS` after read-back.
- No production CSS or runtime component changed during these corrections.

### First CI diagnosis

CI #2775 / run `30958010741` ran on developer head `02be8af2e74cd0e18932dace0c74a47dd7cc0835`.

Passed before failure:

- classifier and full product-pipeline selection;
- frontend lint and TypeScript;
- 96 unrelated unit files and 595 tests.

Failed:

- Frontend core quality job `92155520449`, unit/source-contract step.

Evidence and correction:

- a global `role="radiogroup"` count included one unrelated group in the large runtime file;
- raw substring `width:` incorrectly matched allowed `max-width: 767px`;
- removed the global group count and replaced raw CSS substrings with line-anchored declaration regexes;
- correction commit `4826f8225f87634ab6d22aefc59f87430e4d1ae8`;
- production CSS, runtime source and Playwright proof were unchanged.

### Second CI diagnosis

CI #2778 / run `30958253291` ran on developer head `bc9ca34ed00646779956502e96466c41fac68d5a`.

Passed before failure:

- classifier and full product-pipeline selection;
- frontend lint and TypeScript;
- all declaration-level source checks introduced after the first diagnosis;
- 96 unrelated unit files and 596 tests.

Failed:

- Frontend core quality job `92156308008`, one source-contract assertion.

Exact evidence:

- `runtime.match(/role="radio"/g)` expected four templates but found five because `lexigo-learn-app.tsx` contains an unrelated radio owner outside this slice;
- the three exact radiogroup-owner strings, import order, interaction-only CSS checks and blocking-script registrations all passed.

Correction:

- removed the remaining whole-file role count;
- asserted exact `MODE_OPTIONS`, `SOURCE_OPTIONS`, `SIZE_OPTIONS` maps plus the reusable `CollectionCard` radio owner;
- corrected the exact source-map identifier to uppercase `SOURCE_OPTIONS` during mandatory read-back before the next CI run;
- corrections committed as `b346fa47f5c985e88733f2cc8c4dabf3d1c71465` and `769b0b3f13c0e5ffabc4d012511d93430f1afdac`;
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
- Branch compares limited to the eight allowed paths, with no runtime component, adaptive presentation or snapshot change.
- Exact search confirmed no existing conflicting `::before` owner on the targeted option buttons.
- Both superseded CI runs passed lint and typecheck and isolated their failures to the new source contract.

### Checks failed

- CI #2775: two ambiguous source-contract assertions on superseded head `02be8af2…`.
- CI #2778: one remaining whole-file radio-count assertion on superseded head `bc9ca34e…`.

### Current branch head

Resolve from the live branch after the remaining execution-record write. No final CI claim is made yet.

### Next action

Complete the execution record, verify the final eight-path diff and require a fresh full authoritative CI run on the resulting immutable developer head before any Ready or merge transition.
