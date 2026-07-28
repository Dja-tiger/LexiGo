# Current Task

## Identity

- Issue: #70 — remove one proven-dead Phrases compatibility runtime family.
- Branch: `refactor/issue-70-remove-phrases-compat`.
- Base SHA: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Head SHA: resolve from live branch ref.
- PR: not opened yet.

## Objective

Remove the unreachable Phrases catalog/detail compatibility family from `LexigoPremiumApp` while preserving guest/auth fallback and every shared phrase lesson-domain contract.

## Scope

- Delete only route-level Phrases catalog/detail state, derived values, API loaders, lifecycle effects, URL/filter synchronization, navigation handlers and presentation branches from `frontend/components/lexigo-premium-app.tsx`.
- Remove imports, types, helpers and icon branches only when TypeScript/source evidence proves they became unused because of that route-family deletion.
- Replace the compatibility candidate-presence contract with exact absence assertions while retaining canonical Phrases island ownership and shared lesson-domain assertions.
- Measure exact line/byte reduction and controlled route bundle output without raising any permanent budget.
- A temporary branch-local edit workflow may be used only to apply fail-closed exact transformations through the connected GitHub environment; it must be deleted before PR creation and must not appear in the final diff.

## Non-goals

- No CSS selector, stylesheet, visual redesign or baseline update.
- No changes to `LexigoBootstrappedApp`, `LexigoPhrasesApp`, canonical Phrases catalog/detail components or route ownership.
- No auth/account fallback extraction.
- No lesson, review, answer-suggestion, backend, API, schema, migration, deployment or permanent CI workflow changes.
- No broad deletion of `LexigoPremiumApp` or unrelated compatibility families.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/phrases-route-island-source.test.ts`
- `.github/workflows/temporary-issue70-edit.yml` only as a transient branch-local implementation mechanism; absent from final PR diff.

## Prohibited paths

- `frontend/app/*.css`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-phrases-app.tsx`
- `frontend/components/phrases-catalog.tsx`
- `frontend/components/phrase-detail-presentation.tsx`
- backend, database, API, deployment and permanent workflow files
- visual or performance baseline files

## Runtime owners

- `LexigoBootstrappedApp` remains the canonical route selector and persistent runtime shell.
- `LexigoPhrasesApp` remains the sole canonical `/phrases` and `/phrases/[slug]` owner for guest and authenticated entry.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery and non-Phrases compatibility fallback states.
- Shared lesson lifecycle, phrase conversion, cloze judgement and answer suggestions remain owned by their existing runtime paths.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md` remains the deletion manifest and stop-condition authority.
- `.agents/PROJECT_STATE.md` is updated only in a separate post-merge reconciliation PR.

## Invariants

- `LessonSource = WordSection | "phrases"` remains supported.
- Lesson Composer keeps the “Технические фразы” source option.
- Mixed lessons retain words/phrases composition and fallback messaging.
- `toLearningItem` retains phrase slug/cloze fallback behavior.
- Phrase-containing Active Lesson review and `exerciseKind: "cloze"` answer suggestions remain intact.
- Guest/auth/account-recovery fallback remains reachable.
- Canonical Phrases direct entry, reload, new tab and Browser Back/Forward continue selecting `LexigoPhrasesApp` before `LexigoPremiumApp`.
- No CSS or permanent budget changes.

## Acceptance criteria

- Every marker listed by the compatibility deletion contract is absent from `LexigoPremiumApp`.
- Canonical Phrases reachability/ownership assertions remain green.
- Shared phrase lesson-domain assertions remain green.
- The final diff contains only the five persistent allowed files and no temporary workflow.
- Lint, TypeScript, unit/source contracts, production build, full browser/device/accessibility/PWA/visual/performance/container CI all pass.
- Controlled bundle evidence is available and no permanent budget increases.
- Review audit is empty or all actionable feedback is resolved.
- Expected-head squash merge and exact-SHA stage/public validation succeed.

## Required checks

- Agent Harness source contract.
- Frontend lint and TypeScript.
- All frontend unit/source contracts and production build.
- Direct `/phrases` and `/phrases/[slug]` guest/auth entry, reload, search/filter/sort/pagination and Back/Forward.
- Learn handoff, phrase lesson creation, phrase Active Lesson review, cloze judgement and answer suggestion behavior.
- Desktop Chromium/WebKit, Android/iOS, keyboard, axe, reduced motion, forced colors and 200% reflow.
- Authoritative Linux visual regression without baseline promotion.
- Controlled bundle comparison and existing permanent budgets.
- Full backend/frontend/browser/container CI.

## Risks

- A candidate symbol may still have a non-route lesson/auth consumer.
- Broad string deletion can damage adjacent legacy fallback code.
- Removing a route-only import may accidentally remove a shared lesson fallback dependency.
- Pure dead-code deletion can still perturb chunking or visual output and must be measured.

## Rollback

Revert the atomic squash merge. Stop immediately before PR publication if exact source assertions, TypeScript, visual hashes, bundle evidence or scope boundaries cannot be proven.