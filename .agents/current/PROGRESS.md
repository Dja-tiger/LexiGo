# Current Task Progress

## 2026-07-26 11:05 Europe/Berlin

### Verified

- Live `main` remains `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`; Draft PR #233 is isolated in `feat/issue-197-dictionary-catalog` and is zero commits behind.
- Stage Issue #12 reports the same image SHA in run `30186886444`, with deploy, public smoke and 12/12 public browser checks successful.
- Issue #197 and its E2E comment were read in full. The approved Figma nodes are Mobile Light `78:54` and Desktop Light `78:193`; Dark is derived from semantic tokens and requires separate Linux evidence.
- The existing `/dictionary` route already has a dedicated `LexigoDictionaryApp` island, authenticated server pagination/filtering, URL state, Back/Forward restoration, canonical `/words/[id]` navigation and a cold-route budget.
- The route-local catalog JSX and CSS now implement the approved heading, search, quick filters, desktop filter rail, vertical results and single pagination without a catalog-level Lesson Composer CTA.
- Current `ResourceStatus`, validated `CatalogPageInfo`, keyed remote-detail state, server page/order ownership and navigation intents from live `main` are preserved in the corrected component.

### Finding

CI #1889 (`30193718864`) failed at frontend lint before typecheck or browser validation. The failed checkpoint had reconstructed `dictionary-catalog.tsx` from an obsolete component shape and therefore replaced current runtime owners with stale `AsyncResourceStatus`, raw `CatalogPage` and unkeyed detail state. The lint symptoms were unused symbols and direct state updates in effects, but the architectural regression was the blocking defect.

### Root cause

The initial implementation used an earlier catalog representation rather than applying the Figma presentation delta to the exact current `main` blob. That made the diff appear locally coherent while silently reverting later route-island hardening. The correction restored the exact current component contracts first, then reapplied only route-local presentation changes.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/dictionary-catalog.tsx`
- `frontend/app/dictionary-catalog.css`

### Checks passed

- Live repository, open PR, current stage and roadmap verification.
- Exact Figma context and semantic-variable inspection.
- Runtime/API/history/CSS/test impact-map reconstruction.
- Branch isolation and read-back after every successful write.
- Draft PR #233 publication.
- CI #1889 failure classification from the exact frontend-core job and diagnostic artifact.
- Corrected component read-back confirms current `main` runtime owners are retained.

### Checks failed

- CI #1889 frontend lint on obsolete first-checkpoint component reconstruction. This head is revoked and will not be used as validation evidence.
- Browser, accessibility, visual and bundle validation have not yet run on the corrected head.

### Current branch head

Resolve from live branch after this documentation write.

### Next action

Update the Dictionary regression contracts for the new user-facing heading, semantic filter controls, Enter-search, catalog-kind switch and removed catalog-level Lesson Composer CTA. Then inspect frontend core on the corrected head before using Linux visual output for manual review.
