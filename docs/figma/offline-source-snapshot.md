# LexiGo Figma offline source snapshot

This document records the offline Figma source supplied for LexiGo and the evidence extracted from the local `.fig` bundle.

## Source artifact

- File name: `LexiGo Design System.fig`
- Exported file name in metadata: `LexiGo Design System`
- Export timestamp: `2026-08-13T13:08:25.240Z`
- Size: `1,191,055` bytes
- SHA-256: `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`
- Archive format: ZIP
- Archive members:
  - `canvas.fig` — 1,178,789 bytes
  - `thumbnail.png` — 11,235 bytes
  - `meta.json` — 324 bytes
  - `images/`
- `canvas.fig` prelude: `fig-kiwi`
- Kiwi version: `106`
- decompressed document payload inspected offline: approximately 5.2 MiB

The binary `.fig` itself is not committed by this PR because the currently connected GitHub write action accepts UTF-8 text only and would corrupt a native binary blob. The hash above is the immutable identity of the supplied source and must be checked before any later binary/LFS import.

## Verified design inventory from the supplied snapshot

Offline inspection of the decompressed Kiwi payload confirms that the file contains the approved Adaptive Knowledge Coach direction and production-oriented design material rather than only exploratory screenshots.

Confirmed areas include:

- `Adaptive Knowledge Coach` foundations and components;
- Light and Dark theme foundations;
- `Interaction Components`;
- `Navigation/Primary/Desktop` persistent rail;
- `Navigation/Primary/Mobile` bottom navigation;
- lesson progress states: Start, In Progress, Near End, Completed;
- lesson rating controls;
- answer feedback states: Neutral, Correct, Incorrect, Pending, Offline;
- product patterns for Daily Recommendation, Focused Lesson, Knowledge Report, Technical Scenario, First Use and Application Shell;
- Home mobile/desktop Light/Dark screens;
- Active Lesson full-screen matrix;
- Progress and Scenario matrices;
- Learn, Dictionary and Word Detail matrices;
- Profile and system-state matrices;
- `Screen Map & Handoff` / `Product Screen Map & Handoff`;
- mobile and desktop interactive flows;
- accessibility and engineering handoff content;
- Dynamic Type / text-scale evidence at 120%, 150% and 200% for Home, Active Lesson, Progress, Learn, Dictionary, Word Detail and Profile;
- Progressive Lesson Composer production material.

## Route evidence visible in the snapshot

The supplied source explicitly contains handoff references for the following application routes:

- `/`
- `/learn`
- `/lesson/active`
- `/progress`
- `/dictionary`
- `/words/[id]`
- `/profile`
- `/onboarding`
- scenario lesson entry through `/lesson/active?scenario`

The snapshot also contains Phrases/technical-phrase design language, but route-level Phrases production-source verification should continue to use the explicit node mapping already maintained in `frontend/docs/adaptive-knowledge-coach.md`.

## First Use / onboarding finding

The offline source contains at least the following First Use evidence:

- `Pattern/First Use/Mobile`;
- `First Use / Onboarding`;
- `Mobile / Onboarding / Light`;
- `Prototype / Mobile / Onboarding / Light`;
- `/onboarding` in the Product Screen Map.

Therefore Issue #201 should no longer be treated as if Figma contains no onboarding material at all. Before implementation, the remaining design gap must be re-audited specifically for the states required by #201: Guest Home mobile/desktop, onboarding desktop, diagnostic-question states, skip/continue states, loading/error/recovery and complete Light/Dark coverage. Exact node IDs remain mandatory before a production implementation PR.

## Source-of-truth rules

This offline snapshot supplements, but does not replace, the canonical cloud Figma file key `3xXmBWnf38jbvLjtziwber` and the explicit node mappings in `frontend/docs/adaptive-knowledge-coach.md`.

When cloud Figma MCP access is available again:

1. verify the cloud file against SHA/provenance of this exported snapshot;
2. resolve exact node IDs for any newly discovered First Use states;
3. update Issue #201 and Screen Map only after node-level verification;
4. keep concept/exploration matrices marked as reference-only;
5. use #203 for the final one-route/one-production-source reconciliation and #205 for route-by-route visual parity.

## Binary preservation follow-up

The native `.fig` should be stored through one of these binary-safe repository mechanisms when available:

- Git LFS; or
- a GitHub release asset / binary-capable upload action.

Do not reconstruct or commit the native artifact through a UTF-8 contents API. Any binary import must reproduce SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423` exactly.
