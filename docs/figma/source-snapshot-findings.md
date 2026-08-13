# Offline Figma audit findings

The local copy exported on 2026-08-13 was inspected directly from its decompressed Kiwi document payload.

## Confirmed production-oriented content

The snapshot includes named material for:

- Home mobile/desktop Light/Dark;
- Active Lesson mobile states and desktop study/recall states;
- Progress and Technical Scenario mobile/desktop states;
- Learn, Dictionary and Word Detail mobile/desktop states;
- Profile and resilient system states;
- First Use / Onboarding mobile material;
- Product Screen Map & Handoff;
- application shell desktop/mobile patterns;
- interaction components and semantic lesson state components;
- accessibility/engineering handoff;
- Dynamic Type evidence at 120%, 150% and 200%.

## Exact offline node inventory

The embedded Kiwi schema and document payload were decoded offline. The document contains 6,707 node changes with stable Figma GUIDs in `sessionID:localID` form.

Verified First Use / onboarding nodes:

- page `17 — Profile & System States`: `79:2`;
- canonical `Mobile / Onboarding / Light`: `79:46`;
- First Use product pattern `Pattern/First Use/Mobile`: `68:117`;
- First Use documentation section `Section/First Use`: `69:429`;
- interactive `Prototype / Mobile / Onboarding / Light`: `98:7`;
- Product Screen Map `LexiGo / Product Screen Map`: `82:3`;
- `/onboarding` Screen Map entry text: `82:20`.

The canonical mobile frame `79:46` contains the `1 из 3` first-use step, role choices (`Data Engineer`, `Backend Engineer`, `SRE / Platform`, `Technical Manager`) and the `Продолжить` action. The interactive prototype `98:7` mirrors this composition.

## Issue #201 implication

The source already contains `Pattern/First Use/Mobile`, `First Use / Onboarding`, `Mobile / Onboarding / Light`, `Prototype / Mobile / Onboarding / Light`, and `/onboarding` in the Screen Map. The remaining #201 design gap must therefore be re-audited narrowly rather than described as total absence of onboarding design.

The direct full-screen inventory of page `79:2` is:

- `79:6` — Mobile / Profile / Light;
- `79:46` — Mobile / Onboarding / Light;
- `79:69` — Mobile / Home Loading / Dark;
- `79:93` — Mobile / Dictionary Empty / Light;
- `79:117` — Mobile / Error / Dark;
- `79:129` — Desktop / Profile / Light;
- `79:194` — Desktop / Offline / Dark.

The supplied snapshot contains no separately named `Guest Home` or `Diagnostic` production/prototype frame, and page `79:2` contains no onboarding desktop or onboarding Dark full-screen frame.

Still requiring canonical design before code:

- Guest Home mobile and desktop;
- onboarding desktop;
- diagnostic question and answer-reveal states;
- explicit skip and continue states;
- onboarding-specific loading/error/recovery where behavior differs from shared system states;
- complete Light/Dark coverage, or an explicit token-derived decision recorded in Screen Map.

## Source-of-truth consequence

Exact GUID recovery removes the earlier offline-audit limitation for the nodes listed above. It does **not** make every concept or prototype frame a production source. Existing route mappings in `frontend/docs/adaptive-knowledge-coach.md`, the Product Screen Map and explicit production-slice nodes remain authoritative. Missing #201 states must be designed before implementation rather than inferred from adjacent screens.
