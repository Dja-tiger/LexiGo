# Accessibility reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md), [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md) and [`../AGENTS.progress-pr214-ci1732.md`](../AGENTS.progress-pr214-ci1732.md).

- Accessible names, semantic owners and focus order are product contracts, not test implementation details.
- Use accessibility snapshots before exact selectors; scope by semantic owner instead of truncating names.
- Expand progressive disclosure and confirm `open` before locating nested controls.
- Validate keyboard focus, route announcements, dialogs, axe, reduced motion and 200% text zoom in responsive variants.
- CSS custom properties declared only on a feature root do not reach a portal-rendered dialog; declare required semantic aliases on the portal owner and run axe against the rendered modal state.
- Do not use decorative accent colors directly for 12–14 px semantic text without measured contrast; derive a route-local foreground from the accent and semantic text token while preserving the intended hue.
- A 200% reflow audit must include fixed/global route chrome such as skip links and responsive header labels, not only descendants of the main card; diagnose exact viewport offenders and constrain their intrinsic inline size without hiding document overflow.
- Responsive keyboard tests must select the actually visible trigger and verify focus restoration to that same element; hidden desktop controls are not valid mobile owners.
- Normalize CSS durations semantically in milliseconds; values `<= 0.01ms` are zero-equivalent only when no active Web Animations exist.
