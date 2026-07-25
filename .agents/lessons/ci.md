# CI reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md) and [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md).

- Classify every failure before changing code: production defect, stale test, stale fixture, browser-specific behavior, flake, runner/infrastructure or external transient failure.
- Do not fix timeouts by increasing waits, ambiguous selectors with `.first()`, or failures by weakening required gates.
- Temporary workflows are not a reliable branch-local maintenance mechanism and must not remain in the final diff.
- A controlled calibration failure may be used to force an existing canonical job to publish measurement artifacts, but the sentinel must be removed immediately and the final head must pass the unchanged production gate.
- Content-addressed visual baselines must record dimensions, SHA-256, source run and source head; update them only after the corresponding production change and Linux actual have been manually reviewed.
- When an overflow assertion fails, attach exact offending elements and computed geometry; do not replace the assertion with `overflow-x: hidden` or a looser tolerance.
- Before every mutation, compare the exact tool recipient and schema with the intended action; similar write names are not interchangeable.
- After any wrong-recipient mutation, stop all further writes, verify `main`, clean up only the accidental artifact, run tool discovery again, and inspect the exact intended schema before the next mutation. Repeating the previous write path before rediscovery is prohibited. This rule was reinforced after accidental Issues #223/#224 were created and immediately closed without repository changes.
- Final required CI must run on the developer-authored final head after canonical workflows are restored.
- Green PR CI and green stage deployment are separate evidence; record both.