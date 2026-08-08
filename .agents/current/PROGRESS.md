# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Prior Active Lesson Issue #74 slice #435 is fully delivered through exact-SHA main CI and Stage/public validation.
- Current-task reset #437 restored canonical `.agents/current/**` templates.
- Repository-memory drift from #439 was corrected by #440; exact-SHA main CI #3034 / run `31236793082` succeeded.
- Concurrent #441 is an empty docs squash; PR #442 remains based exactly on `faf466e56e05b6d365b8a0acf14d63a25140a36b` and within the seven allowed files.
- Existing Phrases search-clear is independently covered; its compact target expands only toward inline-start and its painted control sits at `right: 80px`, leaving clearance for the submit target.
- CI #3038 / run `31237309890` diagnosed the first topic-margin regression; relative `var(--ak-space-lg)` compensation restored desktop layout and browser-zoom separation.
- CI #3039 was cancelled after branch advancement and is not merge evidence.
- CI #3040 / run `31237750501` on `1b3afc313f84e58d3431f3910d09305ee0e31520` restored desktop Phrases Light/Dark baselines and true 200% browser-zoom no-overlap.
- CI #3040 Visual job `93053573636` fails only compact Light/Dark: expected `390x1628`, received `390x1678`; retained current and historical green screenshots show `Найти` alone falling into a separate full-width row.
- Retained compiled CSS proves the source: the mixed route `:is(...)` positioning selector inherits type specificity from `.lx-phrases-topic-chips button`, outranking the submit-only compact override.
- Concurrent commit `8a8cd37c10cf7b38ecb3e81ce6725fa7e043a7f4` independently removes submit from that mixed selector; commit `477103ee1b69864ba1333215e22aa4ce178a3cee` additionally centers target probes away from fixed mobile-nav occlusion and relaxes compact lesson paint from exact 40px to a legitimate >=40px minimum. Both are preserved.
- The only live native Phrases select is the catalog-sort select; the filter sidebar contains radio rows, not a select.

### Finding

The final candidate must combine the proven specificity fix with two containment/preservation details: desktop submit still needs `position: relative` so its absolute pseudo-element is button-relative, and coarse sort needs a 48px semantic target without changing the approved 44px painted select.

### Root cause

CSS `:is()` takes the specificity of its most specific argument. Removing submit from the mixed rule fixes compact positioning, but leaving desktop submit static would make its absolute `::before` resolve against the positioned search container. Direct `min-height: 48px` on the native select would change compact visual geometry. Equal-specificity standalone submit rules plus a 48px wrapping-label target solve both without redesign.

### Changed files

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live `main` remains exact PR base `faf466e56e05b6d365b8a0acf14d63a25140a36b`.
- #3040 confirms desktop baselines and true-browser 200% Phrases no-overlap are restored.
- New acceptance remains explicitly collected by both `test:e2e:ui` and `test:e2e:a11y`.
- Existing search-clear geometry was re-read and remains separated from the submit's symmetric target.
- Concurrent `8a8cd37c...` and `477103ee...` were inspected and retained rather than overwritten.
- No backend, dependency, lockfile, snapshot or catalog-semantic change is required.

### Checks failed

- #3040 compact Phrases Light/Dark baselines remain red because the submit computed to flow layout on that head; #3040 is diagnostic only.
- A first non-force publication attempt correctly failed when the branch advanced concurrently; no history was overwritten.

### Current branch head

- Resolve from live branch after this merged specificity/semantic-label remediation commit.

### Next action

Require a fresh complete immutable-head CI. The candidate must restore exact compact content-addressed baselines without snapshot updates, keep desktop/200% zoom green, execute the UI/a11y target acceptance, prove real coarse label-padding activation, and pass every backend/container/product gate.
