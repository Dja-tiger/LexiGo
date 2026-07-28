# Issue #199 — Phrases route-island delivery lessons

## Scope

These rules apply to route-island extraction where a focused catalog/detail route must preserve shell focus, accessible announcements, URL state, direct-entry isolation and legacy smoke compatibility.

## Mandatory rules

1. The semantic `main` label is part of the route-boundary contract. The route island, shell focus scheduler and Playwright focus assertions must use the same stable accessible name.
2. Do not treat a visible heading as proof that route focus and announcement ownership are correct. Verify `document.activeElement`, the focused semantic owner and the live-region announcement after direct entry, in-app navigation and Browser Back.
3. Shell smoke scripts must match a CSS class token, not an exact serialized `class="..."` attribute. React may legitimately add route-specific classes without changing the semantic owner.
4. Direct-detail fixtures must match the exact `/api/v1/phrases/{slug}` request and must not broadly intercept catalog, metadata or progress reads.
5. A controlled evidence probe is not release code. It must run only after the full report or screenshot is serialized, then be removed before immutable-head CI.
6. Content-addressed visual baselines require exact run/head provenance, dimensions, SHA-256 stability across retry and manual review against the approved Figma nodes.

## Confirmed failures

### 2026-07-28 — Route content rendered but the focused semantic owner had a stale name

- **Symptom:** the Phrases page visibly rendered and normal content assertions passed, but `route-focus-management.spec.ts` could not confirm focus/announcement restoration because the focused `main` exposed `Каталог фраз` while the shell contract expected `Технические фразы`.
- **Root cause:** the new island introduced a locally chosen `aria-label` instead of reusing the route boundary's existing semantic name.
- **Why it escaped earlier:** happy-path tests asserted headings and links, not the focused owner or live-region payload after cross-island navigation.
- **Prevention:** define one route-boundary accessible name and assert it at the shell and island owners. Do not create a second screen-local name for the same `main` landmark.
- **Regression gate:** `frontend/e2e/route-focus-management.spec.ts`, `frontend/e2e/adaptive-navigation.spec.ts` and the full UI shards.

### 2026-07-28 — Exact class-string smoke rejected a valid semantic list

- **Symptom:** Dictionary smoke failed after Phrases cards were changed to an ordered semantic list even though `.lx-phrase-grid` remained present.
- **Root cause:** the shell script searched for exact `class="lx-phrase-grid"`; the element legitimately carried additional route-specific classes.
- **Why it escaped earlier:** browser tests queried role/listitem semantics, while the independent shell smoke used HTML serialization.
- **Prevention:** use token-safe class matching or a stable data/role contract. Exact class strings are permitted only when class exclusivity is itself the product invariant.
- **Regression gate:** `frontend/scripts/dictionary-navigation-smoke.sh` and full container CI.

## Reusable lesson

A route island is complete only when visible content, semantic focus, accessible announcement, History state and independent shell smoke all agree on the same owner. Successful rendering alone is not sufficient evidence.
