# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Live `main` is `ad404b84cd26f063fa189abac3fd4a8ca10ab4e6` and remained unchanged through the feature-branch writes.
- Runtime Stage remains healthy on `faa62cc2ea023d8e52aecc5d97c8cabe97748daf` with public browser 12/12 green.
- Audit PR #564 remains Draft/test-only on `fafec6e19f9195b73b79eb0d75a69ffd09d74b30`.
- Audit CI #3686 is green everywhere except deterministic First Use desktop visual hashes.
- Exact Linux visual artifact #9270206798 from #3686 reproduced the structural desktop Resume mismatch against OpenPencil `n378/n550`.
- Issue #565 was created as the separate runtime defect required by #563.
- Branch `fix/first-use-desktop-parity` was created from exact `main`; Draft PR #566 owns the isolated runtime fix.
- Existing `first-use-route-contract.test.ts` protects First Use Light foreground WCAG AA, so Guest primary token changes are outside this defect.
- Production `DiagnosticPrompt` exposes `lemma`, `phonetic`, `partOfSpeech` and `topic`, but no OpenPencil demo-sentence field.

### Finding

Desktop diagnostic runtime used the compact-oriented single-panel hierarchy: progress track + title/copy + nested term card. Approved desktop diagnostic states use a separate step/title intro followed by one diagnostic surface with the prompt and controls directly inside it.

The production runtime must not fabricate the OpenPencil demonstration sentence. Server-owned `topic` remains the truthful dynamic context. The authenticated runtime header also remains authenticated rather than copying the design fixture's guest `Войти` action.

### Root cause

The runtime implementation correctly delivered the #18 state machine but reused one presentation hierarchy across compact and desktop. The original runtime visual approval proved deterministic rendering but did not establish route-level OpenPencil structural parity at the canonical desktop state family; #563 exposed the mismatch.

### Implemented

- Added a desktop-only diagnostic intro matching the approved `ШАГ 2 ИЗ 3` / title / explanatory-copy hierarchy.
- Preserved one React state owner and one set of interactive mark controls.
- Kept the semantic diagnostic `progressbar` in the accessibility tree while visually removing its desktop track.
- Flattened the nested desktop diagnostic term card into the single approved surface.
- Reordered desktop mark controls, saved-progress note and action through the `min-width: 720px` presentation boundary.
- Kept compact/mobile base presentation and backend mutation ordering unchanged.
- Added a fail-closed source contract for the desktop hierarchy and an explicit prohibition on the design-only demo sentence.

### CI and visual evidence

- Initial PR #566 CI #3687 failed only in the newly added source contract because the assertion omitted the existing `lx-first-use-kicker` class. Production lint/typecheck were already green. The assertion was corrected without changing runtime code.
- CI #3688 / run `31973695264` on developer head `0abca00d0acf0a4f8fa46d2cb1118bcdad6037d0` passed frontend core completely: lint, typecheck, 773 unit tests, production build and dependency audit.
- #3688 also passed backend unit/security, backend integration, accessibility, controlled service worker, dictionary smoke, iOS PWA, content security and performance budgets as those jobs completed.
- #3688 Visual regression intentionally failed only the two changed desktop Resume fingerprints; all unrelated First Use Guest/compact baselines and all other executed visual baselines stayed stable.
- #3688 Linux visual artifact: ID `9270548108`, digest `sha256:47025250f8aaeb6eb2c49fb530d58d31d6b64a2c7f73bf834519bc6361e22342`.
- Manually reviewed Linux Resume Light against OpenPencil `n378` and Resume Dark against `n550` before changing any hash.
- Reviewed geometry now has the approved desktop hierarchy and `720×540` single diagnostic surface; intentional content/state divergences are documented rather than hidden.
- Reviewed legacy runtime fingerprints approved from the exact Linux PNGs:
  - Resume Light: `320524d4c4fe03f5bd086bac871957854f31f08f3b4e7a00d05071a1a627e466`
  - Resume Dark: `6827f78bb2f4beb3304b0b939ebaa5a19d4577c9f68fd406525ba4b67525b545`
- Guest, role-compact and all unrelated visual hashes were left unchanged.

### Intentional divergences preserved

- PR #566's legacy 1440×1024 visual fixture captures the server-resumed prompt before local selection; #564 separately owns the corrected canonical fixture that selects `Не уверен` before save at 1440×900.
- Production renders truthful server `topic` rather than hardcoding the OpenPencil example sentence.
- Authenticated `/onboarding` retains authenticated header semantics rather than the guest-design `Войти` label.
- Accessibility-safe Light primary tokens remain unchanged.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`
- `frontend/e2e/first-use-visual.spec.ts` — only the two manually reviewed Resume fingerprints.

### Current branch head

Resolve from the live branch ref after the final harness write; the last runtime/evidence commit before this progress update is `8a225132011cf02f635d257e57132686d85244b9`.

### Next action

Finish the harness execution record, then require one final full immutable-head CI on the resulting developer-authored head. If fully green, move PR #566 out of Draft only after checking reviews/mergeability; after merge, verify exact-main CI and exact-SHA Stage/public runtime before returning to #564 for the canonical 1440×900 selected-Resume provenance closure.
