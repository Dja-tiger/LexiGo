# Current Task Progress

## 2026-07-26 06:20 Europe/Berlin

### Verified

- Live `main` is `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`; no PR was open at task selection.
- Stage Issue #12 reports the same image SHA in run `30186886444`, with deploy, public smoke and 12/12 public browser checks successful.
- Branch `feat/issue-197-dictionary-catalog` was created from the exact live `main` and read back as zero behind before the first write.
- Issue #197 and its E2E comment were read in full. The approved Figma nodes are Mobile Light `78:54` and Desktop Light `78:193`; Dark is derived from semantic tokens and requires separate Linux evidence.
- The existing `/dictionary` route already has a dedicated `LexigoDictionaryApp` island, authenticated server pagination/filtering, URL state, Back/Forward restoration, canonical `/words/[id]` navigation and a cold-route budget.
- Current presentation diverges from Figma: generic heading, four select toolbar, three-column tall cards, duplicate top/bottom pagination, catalog-kind banner and a catalog-level Lesson Composer CTA.

### Finding

The required product slice is primarily a route-local presentation and interaction reconciliation. Backend/API semantics, route-island architecture and canonical URL/history ownership already exist and should remain unchanged.

### Root cause

Dictionary behavior was previously hardened as a functional scalable catalog before the approved Foundation V1 Dictionary frames became the active production visual source. The route therefore contains correct data/navigation infrastructure but legacy information hierarchy and duplicated lesson-delegation UI.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live repository, open PR, current stage and roadmap verification.
- Exact Figma context and semantic-variable inspection.
- Runtime/API/history/CSS/test impact-map reconstruction.
- Branch isolation and post-write read-back for `.agents/current/TASK.md`.

### Checks failed

- None. Product implementation has not started.

### Current branch head

Resolve from live branch after this documentation write.

### Next action

Record execution inputs, then implement the bounded Dictionary catalog presentation in `dictionary-catalog.tsx` and route-local CSS while preserving server/API/history ownership and leaving Word Detail unchanged.
