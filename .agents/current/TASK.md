# Current Task

## Identity

- Issue: #589
- Branch: `fix/min-mobile-learn-contrast`
- Base SHA: `2edf865448fb47951bd80963215cb3a6a76b01a4`
- Head SHA: resolve from live branch ref
- PR: #591

## Objective

Restore readable Learn intro heading contrast on compact **explicit Light** surfaces exposed by the fail-closed #587 minimum-width audit, while preserving the approved fixed light foreground on Auto/default and explicit Dark dark-hero surfaces.

## Scope

- correct appearance-aware compact heading foreground ownership in the progressive Lesson Composer accessibility stylesheet;
- add fail-closed source protection for the `≤767px + explicit Light` cascade;
- strengthen the canonical Learn browser contract so 390×844 explicit Light/Dark verifies the computed heading foreground, not geometry alone;
- preserve existing content-addressed Auto/default compact and Dark fingerprints;
- after manual review of exact Linux evidence, approve only the explicit-Light route-transition fingerprint that necessarily changes with the repaired foreground;
- validate the corrected 320px explicit Light/Dark audit state before reconstructing #588.

## Non-goals

- no API, state, session, history, navigation or lesson-composition changes;
- no Figma/OpenPencil writes;
- no Phrase Detail repair (#590) in this PR;
- no calendar/WebKit repair;
- no unrelated CSS cleanup or redesign;
- no replacement of already-correct Auto/default or Dark visual baselines.

## Allowed paths

- `frontend/app/adaptive-lesson-composer-accessibility.css`
- `frontend/app/adaptive-lesson-composer-accessibility.test.ts`
- `frontend/e2e/learn-route-island.spec.ts`
- `frontend/e2e/route-transition-runtime-visual.spec.ts` — only reviewed `learn.light` fingerprint/provenance
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- backend/API/migrations;
- Figma/OpenPencil sources;
- route/session/history runtime owners;
- Phrases runtime/CSS;
- workflows and dependencies;
- existing visual fingerprint values other than the manually reviewed `learn.light` route-transition evidence required by this repair.

## Runtime owners

- `frontend/app/adaptive-lesson-composer.css` defines the transparent compact Learn hero and semantic compact heading intent; read-only in this slice.
- `frontend/app/adaptive-lesson-composer-accessibility.css` is imported later and owns the fixed dark-surface WCAG foreground plus the required explicit-Light compact exception.
- `frontend/components/lexigo-learn-app.tsx` owns `/learn` presentation; read-only.
- `frontend/app/appearance.css` defines explicit `data-lexigo-appearance="light"|"dark"` token overrides; read-only.

## Test owners

- `frontend/app/adaptive-lesson-composer-accessibility.test.ts` protects CSS ownership/import order.
- `frontend/e2e/learn-route-island.spec.ts` already owns canonical 390×844 explicit Light/Dark Figma route contracts; this slice adds computed foreground assertions there instead of creating a duplicate route test.
- `frontend/e2e/route-transition-runtime-visual.spec.ts` owns the reviewed explicit-appearance Home→Learn transition evidence; only `learn.light` changes after exact Linux artifact review.

## Documentation owners

- `.agents/current/**` records task scope, evidence and execution.

## Invariants

- canonical `/learn` route ownership remains `LexigoLearnApp`;
- explicit Light compact canvas remains `#f4f7f5` and the transparent heading uses semantic dark text;
- explicit Dark compact canvas remains `#10211d` and the heading keeps the fixed light hero foreground;
- Auto/default compact composition and its existing reviewed content-addressed hashes remain unchanged;
- explicit Dark route-transition fingerprint remains unchanged;
- desktop/tablet dark hero keeps `--lx-composer-hero-foreground: #f4f7f5` in every appearance;
- no accessibility rule, browser project or visual gate is weakened.

## Acceptance criteria

- 320×700 explicit Light heading is visibly readable on the transparent light canvas;
- canonical 390×844 explicit Light route contract computes the semantic dark heading foreground and remains Figma `202:6` geometry-compatible;
- canonical 390×844 explicit Dark computes the approved fixed light heading foreground;
- existing Auto/default compact and explicit Dark visual fingerprints do not change;
- reviewed explicit-Light Home→Learn transition remains `390×1212` and uses SHA-256 `14732c934d4b91a89415174ccd01a9c1a9c4134c9b07c21229401c48bb544425`, approved from CI #3763 / run `32093144691` at developer head `928b0186a688545aadcd9b82d84e5940f79f0ab6`;
- medium/desktop foreground behavior remains unchanged;
- source contract protects the appearance-aware compact cascade;
- full immutable-head CI, clean review audit, exact-main CI and Stage/public validation pass;
- #588 is reconstructed on the repaired main and its 320px states are reviewed again before fingerprint acceptance.

## Required checks

- source contract for accessibility stylesheet/import order and explicit-Light selector boundary;
- canonical Learn explicit Light/Dark browser contract at 390×844;
- frontend core lint/typecheck/unit/build through required CI;
- authoritative Linux Visual collection proving existing reviewed Auto/default/Dark hashes remain stable and the reviewed explicit-Light transition fingerprint reproduces deterministically;
- browser/accessibility/zoom/reduced-motion suites selected by full CI;
- final review-thread and main-drift audit.

## Corrected diagnostic finding

The first repair attempt used a broad `@media (max-width: 767px)` semantic heading override. CI #3758 / run `32078860455` proved that was too broad: it changed already-correct compact fingerprints. Manual inspection of the canonical content-addressed 390px baseline confirmed that its white heading is correctly placed on a dark navy surface.

The actual missing boundary is **explicit user Light appearance**. `learn-route-island.spec.ts` already models explicit Light at 390×844 and confirms the Light canvas token, but historically asserted only geometry, so the white-on-light heading escaped detection.

After the selector was corrected, CI #3763 / run `32093144691` passed the canonical Auto/default Lesson Composer baseline, explicit Dark transition and all other Visual cases, but changed exactly the explicit-Light Home→Learn transition from `95e13c…` to `14732c…`. Manual comparison of the exact old and new Linux screenshots confirmed that the old fingerprint encoded the defect (heading absent against the light hero), while the new fingerprint shows the intended readable dark heading with identical `390×1212` geometry. Only that reviewed fingerprint is therefore updated.

## Risks

- using `data-lexigo-resolved-appearance="light"` instead of the explicit preference selector could unintentionally alter Auto/default rendering; the repair must key off `data-lexigo-appearance="light"` only;
- a too-broad compact override could remove the fixed foreground from explicit Dark or desktop/tablet dark hero surfaces;
- approving any fingerprint beyond the manually reviewed explicit-Light transition would conceal unrelated visual drift and is prohibited.

## Rollback

Revert the explicit-Light compact foreground exception, matching source/browser assertions and the reviewed `learn.light` route-transition fingerprint/provenance. No other visual baseline, backend or data rollback is involved.