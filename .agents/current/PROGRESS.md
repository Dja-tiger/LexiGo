# Current Task Progress

## 2026-08-05 18:30 Europe/Moscow

### Verified

- live `main`: `091b8ffdbf0bb70edbbe963f9fd88e40c3ef848a`;
- latest deployed product SHA: `346b9690ab6029776eeac614f2d26472160af927`;
- Draft PR #397 targets `main` from `fix/issue-74-mobile-navigation-labels`;
- Issue #74 remains open;
- canonical mobile navigation is rendered by `RoutePrimaryNavigation` as `.lx-route-nav--mobile` with exactly four links;
- current mobile link targets remain at least 48×54px in the effective late Figma owner;
- the previous effective cascade forced 11px labels and a fixed 92px content reserve;
- legacy `.lx-mobile-nav`, route/history runtime and canonical navigation ownership remain unchanged;
- CI #2847 on head `86b6fbcbb219aac75292241c23d4f13d39b882c6` passed core, backend, UI, accessibility, PWA, service-worker, security, performance and smoke gates; only the expected central compact visual hashes remained stale;
- the last product/test commit is `38ab25a8a5421fb33ba398d218dc967441c3a31b`; resolve the final live head after this handoff update.

### Finding

The runtime implementation is correct. CI #2843 exposed two test-contract consequences of the approved 11px→12px compact navigation change:

1. the focused reserve assertion compared independently serialized subpixel values and failed by 0.000025 CSS px;
2. content-addressed compact screenshots containing the canonical mobile navigation changed, while desktop and unaffected screenshots remained stable.

CI #2847 confirmed the corrected geometry assertion and every product-facing browser gate. Its five stable failures were exactly the previously reviewed compact owners in `visual-regression.spec.ts`: Lesson Composer, Dictionary Light/Dark and Scenario Catalog Light/Dark. One Dictionary empty-state render was flaky on its first attempt and passed the existing hash on retry, so that unrelated hash was not promoted.

### Root cause

- CSS layout and `DOMRect` values can be serialized with slightly different fractional precision across the browser/Playwright boundary; exact `>=` comparison was stricter than the product invariant.
- The visual gate hashes the complete compact viewport. Raising the visible navigation labels from 11px to 12px intentionally changes every compact screenshot carrying that navigation even when route geometry is otherwise preserved.
- The earlier connector transport failure was caused by unsafe manual reconstruction of a 20.5 KB payload. Reading the exact raw Git blob by SHA and verifying the reconstructed Git object before write removed that risk.

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
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/word-detail-visual.spec.ts`
- `frontend/package.json`

### Checks passed

- repository and Harness pre-flight;
- live `main`, open PR and Issue verification;
- runtime visibility, final cascade and route-owner inspection;
- source contract for import order, mounted live owner, rem growth and default 72px/54px/92px geometry;
- focused proof for 390px default, 320px narrow and 200% root text in desktop Chromium, Android Chromium and iOS WebKit;
- CI #2843 core, backend, accessibility, PWA, service-worker, security, performance and smoke gates;
- manual inspection of all failed visual artifacts from CI #2843: meaningful deltas are confined to the compact bottom navigation labels; desktop hashes remain unchanged;
- exact local Git blob verification for the five previously committed visual owners;
- CI #2847 confirmed both UI shards and every non-visual required product gate;
- raw `visual-regression.spec.ts` blob `7a2ea545ebedc5334dca80a3259b7caa07d29b0a` was reconstructed byte-for-byte before modification;
- five reviewed compact hashes were promoted with exact provenance from CI #2843 / run `31009993569` at immutable head `6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2`;
- the replacement file's predicted and GitHub-returned blob SHA both equal `4b3ce87d65ada5164906107c9ddc761586b8294f`;
- branch advanced to product/test commit `38ab25a8a5421fb33ba398d218dc967441c3a31b` without force-push, and `main` remained unchanged.

### Checks failed or superseded

- CI #2832 rejected an obsolete broad exact-selector conflict; corrected with the mounted-navigation semantic selector.
- CI #2836 was superseded because its obsolete formula changed default navigation geometry.
- CI #2843 failed the focused test by 0.000025 CSS px and failed expected compact visual hashes after the intentional label-size change.
- UI shard 2 in CI #2843 recorded a first-attempt unrelated iOS WebKit Lesson Result textbox miss; CI #2847 passed both UI shards.
- CI #2844 started on `c4b682b1f5469cb39e623394501df89494ddb9e9` but became non-authoritative after required handoff commits.
- CI #2847 failed only the five stable central compact hashes now promoted. Its separate Dictionary empty-state first-attempt hash mismatch passed on retry and remains unchanged.

### Current branch head

Resolve from live branch `fix/issue-74-mobile-navigation-labels`; `38ab25a8a5421fb33ba398d218dc967441c3a31b` is the last product/test commit before final handoff documentation updates.

### Next action

Run authoritative full CI on the final documented head. If every required job is green, verify the complete diff, comments, reviews and unresolved threads; mark PR #397 Ready; perform expected-head squash merge; validate exact merge-SHA main CI and exact-image stage/public deployment before reconciliation.
