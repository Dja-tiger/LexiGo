# CI reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md) and [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md).

- Classify every failure before changing code: production defect, stale test, stale fixture, browser-specific behavior, flake, runner/infrastructure or external transient failure.
- Do not fix timeouts by increasing waits, ambiguous selectors with `.first()`, or failures by weakening required gates.
- Temporary workflows are not a reliable branch-local maintenance mechanism and must not remain in the final diff.
- Final required CI must run on the developer-authored final head after canonical workflows are restored.
- Green PR CI and green stage deployment are separate evidence; record both.
