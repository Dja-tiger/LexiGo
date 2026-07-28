# Current Task

## Identity

- Issue: #132 post-merge validation recovery.
- Branch: `agent/issue-132-dictionary-submit-recovery`.
- Base SHA: `fb3f482a4e2c065e151dab6e8009ae775d7b9ea4`.
- Head SHA: resolve from live branch ref.
- PR: pending.

## Objective

Restore truthful Dictionary query retention for an immediate keyboard submit in iOS WebKit, then complete full post-merge CI and exact-SHA stage validation for Issue #132.

## Scope

- remove the stale initial filter-to-input synchronization frame from the Dictionary controlled-input lifecycle;
- add source-level protection for the synchronization owner and retain the existing cross-browser empty/error journeys;
- promote the confirmed failure category to a focused mandatory Agent Harness lesson;
- complete full CI, expected-head squash merge, post-merge CI and stage/public validation.

## Non-goals

- no moderation backend changes;
- no Dictionary redesign, API change, CSS or visual baseline update;
- no timeout increase, retry-only workaround or browser-project exclusion;
- no unrelated roadmap work.

## Allowed paths

- runtime recovery: `frontend/components/dictionary-catalog.tsx` and focused source/browser tests;
- focused `.agents/AGENTS*.md`, `.agents/AGENTS.md` and `.agents/current/**`.

## Prohibited paths

- backend, migrations, OpenAPI and moderation behavior;
- workflows, dependencies, deployment scripts and visual snapshots;
- Phrases or other route runtime.

## Runtime owners

- `DictionaryCatalog`: controlled search draft and filter navigation;
- `navigation.query`: canonical committed URL/filter state;
- Dictionary route island: page loading and cross-browser presentation.

## Documentation owners

- `.agents/PROJECT_STATE.md`: verified merge, CI and stage facts;
- focused Agent Harness lesson: prevention and regression gate;
- `.agents/current/**`: recovery pre-flight and evidence.

## Invariants

- a user-entered query cannot be overwritten by delayed synchronization from an older route state;
- URL/Back/Forward changes still restore the canonical committed query;
- empty/error/retry states retain the submitted query;
- reset and clear actions still clear both draft and committed filters;
- no visual, API or bundle contract changes.

## Acceptance criteria

- the existing Dictionary empty-state journey passes repeatedly in iOS WebKit without retry;
- Chromium/WebKit desktop and compact projects retain the submitted query;
- source protection rejects reintroduction of delayed initial synchronization;
- full CI passes on the final developer-authored head;
- recovery merge, post-merge main CI and exact-SHA stage/public validation pass.

## Required checks

- focused source/unit contract;
- frontend lint, TypeScript, unit and production build;
- repeated focused iOS WebKit journey plus desktop Chromium/WebKit and Android Chromium;
- full required CI, review-thread audit, expected-head squash merge;
- post-merge main CI and Deploy Stage public validation.

## Risks

- removing synchronization entirely would break Back/Forward query restoration;
- changing submit to read only DOM state could create a second state owner;
- a test-only wait could hide the real runtime race.

## Rollback

Restore the prior input synchronization implementation; no API, schema or persisted data is changed.
