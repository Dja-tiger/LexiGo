# Accessibility reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md), [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md) and [`../AGENTS.progress-pr214-ci1732.md`](../AGENTS.progress-pr214-ci1732.md).

- Accessible names, semantic owners and focus order are product contracts, not test implementation details.
- Use accessibility snapshots before exact selectors; scope by semantic owner instead of truncating names.
- Expand progressive disclosure and confirm `open` before locating nested controls.
- Validate keyboard focus, route announcements, dialogs, axe, reduced motion and 200% text zoom in responsive variants.
- Normalize CSS durations semantically in milliseconds; values `<= 0.01ms` are zero-equivalent only when no active Web Animations exist.
