# Current Task Progress

## 2026-08-18 Europe/Moscow

### Verified

- live `main`: `2edf865448fb47951bd80963215cb3a6a76b01a4`;
- Issue #589 / Draft PR #591 remain the active runtime repair; sibling Phrase Detail defect remains isolated as #590;
- branch `fix/min-mobile-learn-contrast` remains based directly on exact main (`behind_by=0`);
- CI #3758 / run `32078860455` on head `f53efcff30ba04e5dd282d4ea5776cd70a40cb03` passed backend, frontend core and all browser groups except the authoritative Visual job;
- the Visual job failed exactly three Learn compact content-addressed cases after the first broad compact override;
- exact Linux Visual artifact `9304580365`, digest `sha256:ed10f90ced5b382543cf1f06d743338ab00c7c6cfc67b944b2e20bf2020fea41`, was downloaded and manually inspected before any fingerprint decision;
- the approved existing Lesson Composer compact baseline is `390×1212`, SHA-256 `e0f44f118b272b898cfaf635e81c7a808c274dd6834594c4a20245ff4f34a423`.

### Corrected finding

Manual inspection of the exact CI #3758 Linux actual proved that the first `@media (max-width: 767px)` override was too broad. The canonical Auto/default 390px Learn state intentionally keeps the dark navy hero and therefore correctly uses the fixed light heading foreground. The broad semantic override changed that heading to dark text on the dark hero and caused the three Visual failures.

The defect discovered by the 320px audit is limited to **explicit user Light appearance**. Explicit Light makes the compact hero transparent on the semantic light canvas, while Auto/default and explicit Dark must retain the approved fixed light foreground.

### Root cause

`adaptive-lesson-composer-accessibility.css` owns a fixed `#f4f7f5` hero foreground after the base responsive stylesheet. The first repair neutralized that foreground for every compact state. The required ownership boundary is instead `max-width: 767px` **and** `html[data-lexigo-appearance="light"]`.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/adaptive-lesson-composer-accessibility.css`
- `frontend/app/adaptive-lesson-composer-accessibility.test.ts`
- `frontend/e2e/learn-route-island.spec.ts`

### Current implementation

- compact semantic heading override is scoped to explicit Light only;
- source contract rejects the previous broad compact semantic rule and rejects `data-lexigo-resolved-appearance` as the selector boundary;
- canonical 390×844 Learn browser cases now assert computed heading foreground:
  - explicit Light: `rgb(16, 33, 29)` / `#10211d`;
  - explicit Dark: `rgb(244, 247, 245)` / `#f4f7f5`;
- desktop Light/Dark continue to require the fixed `#f4f7f5` dark-hero foreground;
- no visual fingerprint value has been changed.

### Checks passed

- mandatory Agent Harness and CSS-specificity rules re-read before the corrective write;
- live Issue/PR/main and review state reconstructed;
- exact #3758 Visual failure classified from logs;
- exact Linux failed actual manually reviewed against the existing canonical compact evidence;
- branch/main compare remains clean and limited to allowed paths after every write;
- no unresolved PR review threads or submitted reviews exist.

### Checks pending

- immutable-head CI for the corrected selector/source/browser contract;
- authoritative Linux Visual confirmation that the three previously changed Auto/default fingerprints return to their approved hashes;
- final review/main-drift audit, Ready, expected-head squash merge, exact-main CI and Stage/public validation.

### Next action

Run and inspect the full immutable-head CI on the corrected developer-authored head. Do not update Learn compact visual fingerprints; any remaining visual mismatch must be classified from the exact Linux actual before further runtime or test changes.