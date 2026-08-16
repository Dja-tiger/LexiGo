# Current Task Progress

## 2026-08-16 21:09 Europe/Berlin

### Verified

- Live main is `126d059f0ae980e7a50425a23a378c29a1e8b641`; no open PR existed when the branch was created.
- Issue #203 live Figma Screen Map sync is externally blocked by the connected Starter/View seat MCP limit; no fake close was attempted.
- Issue #18 backend already persists and returns selection reasons `recent_failure`, `due`, `weak_topic`, `new`, `scheduled`, `manual`.
- Diagnostic onboarding and adaptive queue backend slices are already merged; First Use `/onboarding` UI is already delivered by #201/#558.
- Current Learn composer still POSTs selected `source`, `studyMode`, `lessonSize` and optional topic for preview and lesson creation.
- OpenPencil is the active production design source. Active Lesson is the focused route owner; Learn design includes a visible “Почему предложено” rationale pattern.

### Finding

The remaining executable Issue #18 gap is item-level transparency: the backend sends `reason` on active lesson items, but the current frontend type/mapping/presentation drops it, so the learner cannot see why the current item was selected.

### Root cause

`isLearningItemPayload` does not validate `reason`; `APIItem`/`LearningItem` do not preserve it; `toLearningItem()` does not map it; Active Lesson presentation has no visible selection-reason metadata.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Repository/harness preflight and live GitHub reconciliation.
- Design-source audit against `design/openpencil/LexiGo Design System.op` and `docs/figma/openpencil-screen-map.json`.
- Source audit of backend lesson reason contract and current Learn manual POST contract.

### Checks failed

- Live Figma MCP call for #203: external Starter-plan call limit; not a product failure.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Implement the narrow frontend selection-reason contract, copy, mapping, visible metadata and regression tests without touching backend or composer behavior.
