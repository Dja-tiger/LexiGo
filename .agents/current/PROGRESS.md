# Current Task Progress

## 2026-08-16 21:22 Europe/Berlin

### Verified

- Base/main SHA: `126d059f0ae980e7a50425a23a378c29a1e8b641`.
- Draft PR: #561.
- Backend already returns the six selection reasons required by Issue #18.
- Learn composer still sends the chosen source, study mode, lesson size and optional topic.
- OpenPencil remains the production design source; the existing recommendation pattern uses “Почему предложено”.

### Finding

The remaining Issue #18 gap was frontend transparency: Active Lesson dropped the server-owned item `reason` before presentation.

### Root cause

The active-lesson validator, local API item type, learning item model and presentation did not carry the selection reason end-to-end.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/learning.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/account-resources.test.ts`
- `frontend/lib/interface-copy.ts`
- `frontend/lib/interface-copy.test.ts`
- `frontend/lib/active-lesson-presentation.ts`
- `frontend/lib/active-lesson-presentation.test.ts`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/components/active-lesson-presentation.tsx`
- `frontend/components/active-lesson-selection-reason-source.test.ts`

### Checks passed

- Harness preflight and live GitHub reconciliation.
- OpenPencil design-source audit.
- Backend and manual-composer source audit.
- Post-write compare confirmed only intended small diffs in the two large TSX owners.
- Read-back confirmed API reason preservation and conditional visible reason wiring.

### Checks failed

- Native Figma MCP for Issue #203 remains externally blocked by the Starter/View plan call limit; this is unrelated to Issue #18.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Run and inspect full PR CI on the resulting immutable branch head, then perform diff/review gates before merge.
