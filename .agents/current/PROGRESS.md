# Current Task Progress

## 2026-08-05 17:40 Europe/Moscow

### Verified

- live `main`: `091b8ffdbf0bb70edbbe963f9fd88e40c3ef848a`;
- latest deployed product SHA: `346b9690ab6029776eeac614f2d26472160af927`;
- Draft PR #397 targets `main` from `fix/issue-74-mobile-navigation-labels`;
- Issue #74 remains open;
- canonical mobile navigation is rendered by `RoutePrimaryNavigation` as `.lx-route-nav--mobile` with exactly four links;
- current mobile link targets remain at least 48×54px in the effective late Figma owner;
- the previous effective cascade forced 11px labels and a fixed 92px content reserve;
- legacy `.lx-mobile-nav`, route/history runtime and canonical navigation ownership remain unchanged;
- PR head advanced through `c4b682b1f5469cb39e623394501df89494ddb9e9`; resolve the final live head after documentation commits.

### Finding

The runtime implementation is correct, but CI #2843 exposed two test-contract consequences of the approved 11px→12px compact navigation change:

1. the focused reserve assertion compared independently serialized subpixel values and failed by 0.000025 CSS px;
2. content-addressed compact screenshots containing the canonical mobile navigation changed, while desktop and unaffected screenshots remained stable.

### Root cause

- CSS layout and `DOMRect` values can be serialized with slightly different fractional precision across the browser/Playwright boundary; exact `>=` comparison was stricter than the product invariant.
- The visual gate hashes the complete compact viewport. Raising the visible navigation labels from 11px to 12px intentionally changes every compact screenshot carrying that navigation even when route geometry is otherwise preserved.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/mobile-navigation-labels.css`
- `frontend/components/mobile-navigation-labels-source.test.ts`
- `frontend/e2e/mobile-navigation-labels.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/profile-visual.spec.ts`
- `frontend/e2e/system-states-visual.spec.ts`
- `frontend/e2e/word-detail-visual.spec.ts`
- `frontend/package.json`

`frontend/e2e/visual-regression.spec.ts` remains the only reviewed baseline owner not yet committed because the available connector transport did not reproduce its exact local Git blob SHA; a mismatching invalid UTF-8 blob was explicitly discarded and never attached to the branch.

### Checks passed

- repository and Harness pre-flight;
- live `main`, open PR and Issue verification;
- runtime visibility, final cascade and route-owner inspection;
- source contract for import order, mounted live owner, rem growth and default 72px/54px/92px geometry;
- focused proof for 390px default, 320px narrow and 200% root text in desktop Chromium, Android Chromium and iOS WebKit;
- CI #2843 core, backend, accessibility, PWA, service-worker, security, performance and smoke gates;
- manual inspection of all failed visual artifacts from CI #2843: meaningful deltas are confined to the compact bottom navigation labels; desktop hashes remain unchanged;
- exact local Git blob verification for the five committed test files;
- branch update to `c4b682b1f5469cb39e623394501df89494ddb9e9` without force-push;
- task-scope reconciliation authorizing only the reviewed compact visual contracts.

### Checks failed or superseded

- CI #2832 rejected an obsolete broad exact-selector conflict; corrected with the mounted-navigation semantic selector.
- CI #2836 was superseded because its obsolete formula changed default navigation geometry.
- CI #2843 failed the focused test by 0.000025 CSS px and failed expected compact visual hashes after the intentional label-size change.
- UI shard 2 also recorded a first-attempt iOS WebKit Lesson Result textbox miss; this is outside the changed ownership and must only be acted on if reproduced on the current immutable head.
- CI #2844 started on `c4b682b1f5469cb39e623394501df89494ddb9e9` but became non-authoritative after the required task-handoff update.

### Current branch head

Resolve from live branch `fix/issue-74-mobile-navigation-labels`; `c4b682b1f5469cb39e623394501df89494ddb9e9` is the last product/test commit before handoff documentation updates.

### Next action

Run authoritative CI on the final documented head. Expected result: focused UI shards and the five reconciled visual owners turn green; any remaining visual failure should be limited to the five reviewed compact baselines still stored in `frontend/e2e/visual-regression.spec.ts`. Do not merge until that final owner is reconciled exactly and the complete immutable-head CI is green.
