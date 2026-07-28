# Compatibility reachability before dead-code deletion

## Scope

This rule applies when deleting route, state, API, presentation or CSS families from `LexigoPremiumApp` or another compatibility boundary.

## Mandatory rules

1. Extraction into a dedicated route island is not by itself proof that every similarly named compatibility symbol is dead.
2. Prove route reachability for guest and authenticated states from the actual bootstrap predicate and render order.
3. The canonical owner must be selected before the compatibility fallback and must cover direct entry, reload, new tab and Back/Forward.
4. Separate route presentation/data ownership from shared domain behavior. For Phrases, catalog/detail state and API effects can be dead while phrase lesson sources, mixed lessons, cloze judgement and answer suggestions remain live.
5. Before deletion, publish an exact manifest grouped by state, effects/API, presentation/navigation, imports and CSS selectors.
6. Each manifest item must have a canonical replacement owner or an explicit proof that the behavior is intentionally retired.
7. The deletion PR must replace candidate-presence evidence with absence evidence; do not retain a test that protects dead code after removal.
8. Deletion must not broaden to guest authentication, account recovery or unknown-route fallback unless those owners are independently extracted and validated.
9. After source removal, run lint, typecheck, unit/source contracts, production build, full Chromium/WebKit/Android/iOS journeys, authoritative Linux visual regression and a bundle comparison.
10. A changed Linux visual hash is not accepted as cleanup evidence until the actual is reviewed against the exact canonical Figma node and the computed cascade is audited.

## Phrases reachability contract

- `isPhrasesRoute` covers `/phrases` and `/phrases/[slug]`.
- `usePhrasesIsland` is independent of session presence.
- The `LexigoPhrasesApp` render branch precedes the final `LexigoPremiumApp` fallback.
- `LexigoPhrasesApp` owns guest preview data, authenticated catalog reads, independent direct detail, URL/History state and Learn handoff.
- Shared phrase learning behavior is preserved until separately proven dead.

## Regression gates

- `frontend/components/phrases-route-island-source.test.ts` proves route reachability and canonical ownership.
- `frontend/docs/compatibility-cleanup.md` records the exact deletion candidate and preserved-contract manifests.
- The next removal PR must add absence assertions for retired compatibility markers and retain all canonical Phrases browser/visual/performance gates.

## Reusable lesson

Dead-code deletion is a reachability proof across route, session, domain and presentation owners. Similar names are not sufficient evidence, and route extraction must not accidentally delete shared learning behavior.
