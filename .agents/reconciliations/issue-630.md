# Issue #630 Delivery Reconciliation

## Delivery

- Issue: #630 — remove native middle-click lifecycle race from semantic route coverage
- PR: #631 — `test(navigation): make semantic independent-tab coverage deterministic`
- Final developer head: `c548dba41c0560a187b0b0910be773deb19de48e`
- Final immutable-head CI: #3910 / run `32397842688` — `success`
- Squash merge / delivered main: `eeffe2e65b5c855593b9c23a46465b3f17a62f6b`
- Exact-main CI: run `32399133251` — `success`
- Issue state after merge: closed/completed

## Exact-main validation

The exact merged SHA passed the full selected product CI rather than only an aggregate status:

- Backend integration: job `96522930398` — success
- Backend unit and security: job `96522930481` — success
- Frontend core quality: job `96522930488` — success
- Accessibility audit: job `96523424554` — success
- Lesson completion: job `96523424576` — success
- Content security: job `96523424578` — success
- UI tests shard 1/2: job `96523424586` — success
- Controlled service worker: job `96523424593` — success
- Dictionary smoke: job `96523424600` — success
- Performance budgets: job `96523424607` — success
- iOS PWA dictionary: job `96523424610` — success
- Visual regression: job `96523424629` — success
- UI tests shard 2/2: job `96523424717` — success
- Frontend quality aggregate: job `96525985730` — success
- Container build API: job `96526022448` — success
- Container build Web: job `96526022466` — success

## Delivered acceptance

- The semantic Learn route link still asserts the application-owned `href=/learn` contract.
- Independent route loadability is verified with an explicitly created page in the same authenticated browser context and navigation using the asserted href.
- The primary page still exercises real in-app navigation and browser Back/Forward semantics.
- The acceptance no longer depends on Chromium creating and scheduling a native background tab from a middle mouse gesture.
- Desktop Chromium scope remains explicit for this browser-specific acceptance.
- Strict runtime-error behavior and production route ownership were not weakened.

## Failure classification and root cause

Post-merge exact-main CI for the previous main `651a35541061cd9d667e440a1a57fffa4cf5cb56` failed only in generic UI shard 1/2 because the older semantic-route acceptance coupled LexiGo coverage to Chromium's browser-owned middle-click/background-tab lifecycle.

The two attempts failed at different points of that external handshake: one emitted a page but timed out waiting for its load-state transition, while the retry did not emit the expected page event. The source tree itself had already been validated on the preceding immutable PR head, so this was classified as browser/CI nondeterminism rather than a production routing defect.

The repair moved the test boundary back to contracts LexiGo owns: semantic href, independent route loadability, visible Learn ownership, and real Back/Forward behavior.

## Runtime / Stage

This delivery changes only E2E test ownership and Agent Harness task records. It does not change React runtime, CSS, backend/API behavior, dependencies, visual baselines, workflows, deployment topology, or design source. No Stage redeploy is required or claimed for #630.

## Repository memory

`.agents/current/TASK.md`, `PROGRESS.md`, and `EXECUTION.md` are reset byte-for-byte to the canonical repository templates in the reconciliation PR that adds this record.

`.agents/PROJECT_STATE.md` is intentionally not rewritten through a truncated connector response. This dedicated immutable reconciliation record preserves the verified delivery evidence without risking loss of historical project state.

## Next work

After this pure Agent Docs reconciliation passes its fail-closed lightweight CI and merges, resume the remaining open dependency PR #622 only after rebasing/regenerating it against the then-current `main`; its existing branch is stale and its historical CI is not valid delivery evidence for the current base.
