# Current Task Progress

## 2026-08-03 02:22 Europe/Moscow

### Verified live state

- Live `main` is `df3cd097cbd159a4d441aea4ce783043dabe36ec`.
- No pull request was open before this slice.
- Issue #70 remains open.
- Stage remains successful on product SHA `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`, run `30769451780`.
- Repository memory and public architecture agree with live GitHub state.
- Remaining `LexigoPremiumApp` presentation dispatch is intentionally limited to live Library, guest Profile/auth recovery and Lesson owners.

### Selected atomic slice

Proof-only reachability audit for the legacy Home hero-decoration CSS family in `frontend/app/premium-ui.css`.

Candidate classes:

- `lx-hero-copy` — 5 selector-token occurrences;
- `lx-glow` — 1 occurrence;
- `lx-floating-card` — 4 occurrences;
- `lx-book-base` — 6 occurrences;
- `lx-orbit` — 3 occurrences.

Total bounded inventory: 19 occurrences.

### Finding

- Indexed repository discovery found each candidate only in `premium-ui.css`.
- `LexigoPremiumApp` contains no candidate class and no `renderHome()` presentation.
- Canonical `LexigoHomeApp` still executes `lx-hero-card`, `lx-hero-art`, `lx-word-preview`, `lx-home-next-action-copy` and `lx-progress-panel`; those classes are explicitly excluded from the candidate family.
- `lx-resume-strip` remains live in compatibility Lesson presentation.
- `lx-auth-card` remains live in guest authentication/recovery presentation.
- Global stylesheet order remains `premium-ui.css` → `compact-home.css` → `adaptive-knowledge-coach-home.css`.

### Branch and scope

- Branch: `test/issue-70-prove-home-hero-css-orphaned`.
- Exact base: `df3cd097cbd159a4d441aea4ce783043dabe36ec`.
- Allowed paths: one new source contract and `.agents/current/**` only.
- Production CSS, runtime, snapshots, performance ceilings, workflows and dependencies are prohibited.

### Implementation

- Added `frontend/components/home-hero-orphan-source.test.ts`.
- The contract recursively scans executable TypeScript/TSX from the actual `app`, `components` and `lib` checkout.
- Test/spec files are excluded and comments are stripped before consumer analysis.
- Each candidate must have zero executable consumers.
- Each candidate must be confined to `app/premium-ui.css` with its exact count.
- Exact candidate declaration blocks remain protected until a separate deletion slice.
- Canonical Home, compact Home and live compatibility Lesson/auth owners are protected independently.
- Layout import order is asserted without changing production source.

### Diff evidence

- Current branch is two commits ahead of exact base and not behind.
- Changed paths before execution evidence:
  - `.agents/current/TASK.md`
  - `frontend/components/home-hero-orphan-source.test.ts`
- No production CSS or runtime file changed.
- Every written path was read back from the target branch.
- `main` remained unchanged after writes.

### Checks passed

- Exact branch/base comparison contains only declared paths.
- Source readback confirms the intended actual-checkout contract.
- Candidate count arithmetic is exactly 19.
- Live owner boundaries are represented by positive executable-consumer assertions.

### Checks pending

- Complete authoritative CI on the final developer-authored head.
- Unchanged Linux visual hashes and route-performance budgets.
- Review-surface audit, expected-head squash merge and exact-SHA main/stage validation.

### Next action

Write the execution record, compare the final branch with exact base, open a Draft PR and treat that resulting branch head as the immutable developer-authored candidate unless CI identifies a real contract defect.
