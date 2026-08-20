# Current Task Execution

## Task

- Issue: #630
- Branch: `test/issue-630-semantic-route-independent-tab`
- Base SHA: `651a35541061cd9d667e440a1a57fffa4cf5cb56`
- PR: pending publication

## Evidence

- exact-main CI run `32386739134`;
- failed shard 1 job `96483659178`;
- Playwright artifact `9413582203`, digest `sha256:27aa3d8539d8de1323dcdc1501c8d5eb9486641b6c1c9783e6bda645312bac4d`;
- exact failed source blob `42f252b1cd55b402ed013c62d61a95f7ec6daa1e`;
- PR #629 exact-head CI #3908 green and identical source tree after merge.

## Diagnosis

Both Playwright attempts fail before LexiGo history assertions because native Chromium middle-click/background-tab lifecycle is nondeterministic: one attempt receives a page but never surfaces the awaited load state, the retry never receives the page event. This is the same browser-mechanics failure class previously observed in Issue #628.

## Action

Keep desktop Chromium as the owner of this bounded route/history test, but test only application-owned semantics: assert the `/learn` anchor href, create an independent context page explicitly, navigate it to that href, verify Learn renders, then keep the existing primary-page click and real Back/Forward sequence unchanged.

## Safety boundaries

No production runtime, router implementation, authenticated API fixture, dependencies, visual baselines, CSS/design or runtime-error filtering are changed. No retry or timeout inflation is used to hide the failure.

## Validation

Final acceptance requires a new immutable-head full CI with shard 1 green, clean review/thread audit, expected-head squash merge, and green exact-main CI before any subsequent slice.
