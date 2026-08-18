# Current Task Progress

## 2026-08-18 Europe/Moscow

### Verified

- live `main`: `2edf865448fb47951bd80963215cb3a6a76b01a4`;
- Issue #589 / Draft PR #591 remain the active runtime repair; sibling Phrase Detail defect remains isolated as #590;
- branch `fix/min-mobile-learn-contrast` remains based directly on exact main (`behind_by=0`);
- CI #3758 / run `32078860455` on head `f53efcff30ba04e5dd282d4ea5776cd70a40cb03` proved the first viewport-only compact foreground override was too broad;
- exact CI #3758 Linux Visual artifact `9304580365`, digest `sha256:ed10f90ced5b382543cf1f06d743338ab00c7c6cfc67b944b2e20bf2020fea41`, was manually inspected before rejecting those broad-repair fingerprint changes;
- corrected immutable CI #3763 / run `32093144691` on developer head `928b0186a688545aadcd9b82d84e5940f79f0ab6` passed backend, frontend core, integration, accessibility, performance, iOS PWA, service-worker, content-security and every completed browser/visual case except exactly one expected explicit-Light transition fingerprint;
- authoritative #3763 Linux Visual artifact `9309266622`, digest `sha256:1d8f7c5c423a8113d11599df4b647d60bc804e260019907ecebbad50a29c0656`, was downloaded and inspected;
- prior approved `learn.light` transition source artifact from CI run `32046365625`, head `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`, was downloaded and the exact old SHA-256 `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169` screenshot was extracted for side-by-side review;
- the critical Auto/default Lesson Composer compact baseline remains unchanged and passed at `390×1212`, SHA-256 `e0f44f118b272b898cfaf635e81c7a808c274dd6834594c4a20245ff4f34a423`.

### Corrected finding

Manual inspection of the exact CI #3758 Linux actual proved that the first `@media (max-width: 767px)` override was too broad. The canonical Auto/default 390px Learn state intentionally keeps the dark navy hero and therefore correctly uses the fixed light heading foreground. The broad semantic override changed that heading to dark text on the dark hero and caused the three Visual failures.

The defect discovered by the 320px audit is limited to **explicit user Light appearance**. Explicit Light makes the compact hero transparent on the semantic light canvas, while Auto/default and explicit Dark must retain the approved fixed light foreground.

CI #3763 then isolated the expected consequence correctly: all Auto/default and Dark visual contracts reproduced, while only `learn after Home client navigation — light` changed from old SHA `95e13c…` to new SHA `14732c…`, with geometry unchanged at `390×1212`.

Manual comparison confirmed the old `95e13c…` frame encodes the production defect: the heading is absent/invisible against the light hero. The new `14732c…` frame renders the intended dark readable heading on the same light surface. This is a legitimate reviewed visual change, not baseline drift.

### Root cause

`adaptive-lesson-composer-accessibility.css` owns a fixed `#f4f7f5` hero foreground after the base responsive stylesheet. The first repair neutralized that foreground for every compact state. The required ownership boundary is instead `max-width: 767px` **and** `html[data-lexigo-appearance="light"]`.

The route-transition visual baseline had separately frozen the defective explicit-Light frame, so once runtime ownership was repaired that one fingerprint necessarily had to be re-approved from exact Linux evidence.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/adaptive-lesson-composer-accessibility.css`
- `frontend/app/adaptive-lesson-composer-accessibility.test.ts`
- `frontend/e2e/learn-route-island.spec.ts`
- `frontend/e2e/route-transition-runtime-visual.spec.ts` — reviewed `learn.light` hash/provenance only

### Current implementation

- compact semantic heading override is scoped to explicit Light only;
- source contract rejects the previous broad compact semantic rule and rejects `data-lexigo-resolved-appearance` as the selector boundary;
- canonical 390×844 Learn browser cases assert computed heading foreground:
  - explicit Light: `rgb(16, 33, 29)` / `#10211d`;
  - explicit Dark: `rgb(244, 247, 245)` / `#f4f7f5`;
- desktop Light/Dark continue to require the fixed `#f4f7f5` dark-hero foreground;
- `route-transition-runtime-visual.spec.ts` changes only `learn.light`:
  - SHA-256: `14732c934d4b91a89415174ccd01a9c1a9c4134c9b07c21229401c48bb544425`;
  - source run: `32093144691`;
  - source developer head: `928b0186a688545aadcd9b82d84e5940f79f0ab6`;
- dictionary, phrases, `learn.dark` and critical Auto/default Lesson Composer fingerprints are untouched.

### Checks passed

- mandatory Agent Harness and CSS-specificity rules re-read before corrective writes;
- live Issue/PR/main and review state reconstructed;
- exact #3758 Visual failure classified and broad baseline updates rejected after manual review;
- exact #3763 Visual failure classified as one intended explicit-Light transition change;
- old and new exact Linux screenshots manually compared before the single fingerprint write;
- new screenshot is deterministic across initial run and retry and remains `390×1212`;
- critical Auto/default Lesson Composer baseline and explicit Dark transition pass unchanged in #3763;
- branch/main compare remains clean, `behind_by=0`, and limited to seven allowed paths after the reviewed visual evidence write;
- no unresolved PR review threads or submitted reviews existed at the last review audit.

### Checks pending

- new full immutable-head CI after the reviewed `learn.light` fingerprint/provenance and harness reconciliation;
- authoritative Linux Visual confirmation that `14732c…` reproduces and every untouched fingerprint remains stable;
- final review/main-drift audit, Ready, expected-head squash merge, exact-main CI and Stage/public validation.

### Next action

Finish harness reconciliation, then run and inspect full immutable-head CI on the final developer-authored head. No further code, CSS, docs or baseline writes are allowed after that CI turns green; proceed directly to review/main-drift audit and merge.