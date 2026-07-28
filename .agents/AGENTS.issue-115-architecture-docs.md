# Executable architecture-documentation ownership

## Scope

This rule applies whenever a production route entry, runtime owner, compatibility boundary or client-island inventory changes.

## Confirmed failures

### 2026-07-28 — Public architecture remained on the previous route graph

After Issue #199 extracted canonical `/phrases` and `/phrases/[slug]` into `LexigoPhrasesApp`, the executable bootstrap and production-root tests were correct, but `README.md` and `docs/architecture.md` still stated that Phrases or Active Lesson remained inside `LexigoPremiumApp`.

- **Root cause:** route extraction updated runtime owners, source tests, browser contracts, visual evidence and bundle budgets, but public architecture documents were treated as passive follow-up text rather than downstream consumers of the ownership contract.
- **Why it escaped:** `production-app-entry.test.ts` protected imports and application roots but did not read public documentation. Full browser and bundle CI could therefore pass while users and future agents received a historical ownership model.
- **Regression gate:** the root-level architecture contract in `scripts/ci/agent_docs_scope_test.py` reads README, architecture and bootstrap from the same checkout.

### 2026-07-28 — Frontend-isolated unit test could not read root documents

The first documentation contract was placed in `frontend/components`. CI executed it inside the isolated `/workspace` volume created by `frontend-container.sh`, which copies only `frontend/`. Resolving `process.cwd()` to the repository parent therefore produced `/README.md` and failed with `ENOENT`.

- **Root cause:** the test assumed frontend unit CI retained the repository directory hierarchy, while the container intentionally exposes only the frontend source tree plus deploy data.
- **Why it escaped:** local path reasoning used the repository checkout layout instead of reading the authoritative CI workspace construction before selecting the test owner.
- **Prevention:** contracts that consume root-level files must run in an existing root-level CI boundary. Do not widen shared container mounts or duplicate documents only to satisfy a misplaced test.
- **Regression gate:** `python3 scripts/ci/agent_docs_scope_test.py` runs from the complete checkout in the always-required classifier job before lightweight/full CI routing.

## Mandatory prevention

1. Treat README, architecture documents, source contracts and repository memory as downstream consumers of every route-owner change.
2. Update executable ownership and public documentation in the same atomic slice unless the harness requires a separate explicitly tracked documentation completion slice.
3. Describe compatibility components by their actual fallback boundary. A loaded fallback must not be documented as the canonical owner of an extracted route.
4. Maintain an executable documentation contract that reads the current bootstrap source and public documents, verifies the canonical route-entry inventory and rejects confirmed stale ownership phrases.
5. Select the contract owner from the actual CI filesystem boundary. Root-document contracts belong in a root-checkout job, not an isolated frontend workspace.
6. Keep the contract semantic: verify component names, route ownership and retired claims rather than full paragraph formatting.
7. Documentation outside the pure Agent Docs allow-list requires the normal full CI path; do not misclassify README or general architecture changes as lightweight repository-memory maintenance.
8. Do not claim legacy cleanup is complete while compatibility source remains. Deletion and CSS consolidation stay under their dedicated Issue and require bundle/browser/visual evidence.

## Regression gate

- `frontend/components/production-app-entry.test.ts` remains the executable production-root inventory.
- `scripts/ci/agent_docs_scope_test.py` verifies README and `docs/architecture.md` against bootstrap dynamic imports and rejects the confirmed stale Phrases/Active Lesson claims from the full repository checkout.
- The classifier job must execute that root-level contract before it publishes CI scope.
- Full required CI must pass for changes to README or general architecture documentation.

## Reusable lesson

Architecture documentation is a versioned consumer of executable ownership, and its contract must live where all required files actually exist. A route extraction is not fully complete while public documents describe the previous runtime graph or the validation gate is unreachable in CI.
