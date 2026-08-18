# Current Task Progress

## 2026-08-18

### Verified

- Live task is Issue #583 under umbrella #205.
- Branch `fix/issue-583-compact-reminder-library-geometry` was created from exact `main@0ff82f22404f94ed8f3fe568af0924fe65fc5f68` after confirming no open PR and no pre-existing Issue #583 branch.
- Active design source is repo-owned OpenPencil mapping; `dictionary.mobile.light` (`fig_4008`), `phrases.mobile.catalog.light` (`fig_7281`) and `learn.mobile.recommended` (`fig_6826`) are 390×844 active mobile anchors. No separate 430px design screen exists, so 430px is treated as responsive continuation, not a new design slice.
- `calendar-reminder-entry.css` shows the Reminder label is hidden only at `max-width: 390px`; at 430px the same fixed route-level owner expands into a text pill while remaining positioned relative to the compact header.
- `phrases.css` adds `24px` inline padding to `.lx-phrases-catalog` at `max-width: 767px`; `dictionary-catalog.css` does not add an equivalent compact inline inset to `.lx-dictionary-catalog`. This creates route-dependent outer/Materials geometry at 430px.
- `CatalogKindNavigation` is already one shared semantic component for Dictionary/Phrases, so divergent geometry is cascade/container ownership rather than duplicated markup.
- Existing Issue #577 transition evidence is canonical 390×844 and checks one-line Materials labels, semantic Reminder tokens, no X overflow and client navigation. It does not assert equal Dictionary/Phrases outer geometry at 430px.

### Finding

Two breakpoint ownership gaps explain the user-visible 430px regression without requiring markup or product redesign:

1. Reminder presentation changes at 391px because text visibility has its own `max-width: 390px` cutoff inside the broader mobile `max-width: 719px` header layout.
2. Phrases owns additional compact inline padding while Dictionary relies on the outer shell, so the same shared Materials component is rendered inside different route widths.

### Root cause

The previous 390×844 transition contract validated route ownership at exactly the breakpoint where the Reminder label is hidden and did not compare cross-route container bounding boxes. Route-specific compact padding in Phrases and a separate 390-only Reminder label rule therefore escaped the regression suite.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live main/open-PR/Issue #583 preflight.
- OpenPencil mapping inspection.
- Reminder CSS breakpoint inspection.
- Dictionary/Phrases compact CSS ownership comparison.
- Existing #577 transition regression inspection.

### Checks failed

- None yet; runtime code has not been changed.

### Current branch head

Resolve from live branch after current-task documentation synchronization.

### Next action

Record execution details, then implement the smallest owner-scoped runtime slice: keep Reminder icon-only across the full compact mobile range and unify Dictionary/Phrases compact catalog inline geometry without touching shared semantics. Add a blocking 430px WebKit geometry/evidence regression while keeping the 390×844 contract green.
