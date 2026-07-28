# Executable architecture-documentation ownership

## Scope

This rule applies whenever a production route entry, runtime owner, compatibility boundary or client-island inventory changes.

## Confirmed failure

After Issue #199 extracted canonical `/phrases` and `/phrases/[slug]` into `LexigoPhrasesApp`, the executable bootstrap and production-root tests were correct, but `README.md` and `docs/architecture.md` still stated that Phrases or Active Lesson remained inside `LexigoPremiumApp`.

## Root cause

Route extraction updated runtime owners, source tests, browser contracts, visual evidence and bundle budgets, but public architecture documents were treated as passive follow-up text rather than downstream consumers of the ownership contract.

## Why it escaped

The existing `production-app-entry.test.ts` protected imports and application roots but did not read public documentation. Full browser and bundle CI can therefore pass while users and future agents receive a historical ownership model from README or architecture.

## Mandatory prevention

1. Treat README, architecture documents, source contracts and repository memory as downstream consumers of every route-owner change.
2. Update executable ownership and public documentation in the same atomic slice unless the harness requires a separate explicitly tracked documentation completion slice.
3. Describe compatibility components by their actual fallback boundary. A loaded fallback must not be documented as the canonical owner of an extracted route.
4. Maintain an executable documentation contract that reads the current bootstrap source and public documents, verifies the canonical route-entry inventory and rejects confirmed stale ownership phrases.
5. Keep the contract semantic: verify component names, route ownership and retired claims rather than full paragraph formatting.
6. Documentation outside the pure Agent Docs allow-list requires the normal full CI path; do not misclassify README or general architecture changes as lightweight repository-memory maintenance.
7. Do not claim legacy cleanup is complete while compatibility source remains. Deletion and CSS consolidation stay under their dedicated Issue and require bundle/browser/visual evidence.

## Regression gate

- `frontend/components/production-app-entry.test.ts` remains the executable production-root inventory.
- `frontend/components/architecture-documentation-contract.test.ts` verifies README and `docs/architecture.md` against bootstrap dynamic imports and rejects the confirmed stale Phrases/Active Lesson claims.
- Full required CI must pass for changes to README or general architecture documentation.

## Reusable lesson

Architecture documentation is a versioned consumer of executable ownership. A route extraction is not fully complete while public documents still describe the previous runtime graph.
