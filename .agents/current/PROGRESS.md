# Current Task Progress

## 2026-08-09 Europe/Moscow

### Verified

- Live `main` base before branch creation: `d202c193928e28366606990683067403802ec55b`.
- `RouteChrome` renders `LearningSectionSwitch` on canonical `/learn`.
- `LexigoScenarioCatalogApp` renders the same semantic `Разделы обучения` switch on canonical authenticated `/scenarios`.
- `scenario-catalog.css` owns a painted `min-height: 44px` and `minmax(120px, 1fr)` columns for both links.
- No existing interaction layer expanded this switch to the `48px` coarse-pointer Issue #74 contract.
- Lesson Result CTA (`52px`), Learn primary CTA (`54px`), route brand (`48px`), route header navigation (`48px`), rail (`>=48px`) and mobile navigation (`52px`) were explicitly inspected and rejected as false-positive gaps before selecting this slice.
- PR #454 is open against `main` for this atomic slice.

### Finding

The shared Learning subsection switch passes the `44px` fine-pointer minimum but has no live owner for the `48px` coarse-pointer effective target.

### Root cause

The original Scenario Catalog presentation established a fixed painted `44px` link height. The later `/learn` placement reused the same semantic switch, but no input-modality-specific interaction layer was added when Issue #74 introduced the `44px` fine / `48px` coarse contract.

### Changed files

- `frontend/app/learning-section-switch-touch-targets.css` — new paint-inert block-axis effective target owner.
- `frontend/app/layout.tsx` — loads the interaction layer after both presentation/placement owners.
- `frontend/components/learning-section-switch-touch-target-source.test.ts` — fail-closed ownership/reachability/collection contract.
- `frontend/e2e/learning-section-switch-touch-targets.spec.ts` — desktop Chromium, Android Chromium and iOS WebKit effective geometry proof for `/learn` and `/scenarios`.
- `frontend/package.json` — registers the browser proof in blocking UI and accessibility commands.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md` — current task harness.

### Checks passed

- Branch created from the exact verified `main` SHA.
- Every GitHub write was read back from the explicit feature branch.
- CSS source inspection confirms the painted owner remains unchanged at `44px`.
- New interaction layer source confirms `44px` fine / `48px` coarse variables, block-only expansion, transparent background, zero border/shadow and real pointer ownership.
- Layout read-back confirms the new layer loads after `scenario-catalog.css` and `learning-section-switch.css` and before scenario lesson presentation.
- Package read-back confirms the browser spec is registered in both blocking `test:e2e:ui` and `test:e2e:a11y` commands; the fail-closed source test enforces uniqueness in CI.
- Pre-PR comparison reported `ahead 8 / behind 0`, the expected merge base, and only the eight declared paths.

### Checks failed

- None observed yet.
- Local lint/type/unit/browser execution is unavailable because this environment has no repository checkout/network clone path; these checks must be executed by GitHub CI and are not claimed as locally passed.

### Current branch head

Resolve from the live `fix/issue-74-learning-section-switch-touch-targets` branch ref after this harness commit; treat that resulting PR head as immutable unless CI identifies a concrete defect.

### Next action

Inspect all GitHub workflow runs for PR #454. Fix only evidenced failures, otherwise merge the immutable green head and perform the required post-merge Agent Harness reconciliation.