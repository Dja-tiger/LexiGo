# Current Task

## Identity

- Issue: #70 — remove one proven-dead Phrases compatibility runtime family.
- Branch: `refactor/issue-70-remove-phrases-compat`.
- Base SHA: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Implementation SHA: `2b607c37faabed4030b8c88f298d62ab8c0b5124`.
- Current head SHA: resolve from live branch ref.
- PR: #281, Draft.

## Objective

Remove the unreachable Phrases catalog/detail compatibility family from `LexigoPremiumApp` while preserving guest/auth fallback and every shared phrase lesson-domain contract.

## Scope

- Delete only route-level Phrases catalog/detail state, derived values, API loaders, lifecycle effects, URL/filter synchronization, navigation handlers, resource notices and presentation branches from `frontend/components/lexigo-premium-app.tsx`.
- Remove imports, types, helpers and icon branches only where the deleted route family was the sole consumer.
- Replace compatibility candidate-presence assertions with exact identifier-level absence assertions while retaining canonical Phrases island ownership and shared lesson-domain assertions.
- Measure source reduction and controlled route bundle output without raising any permanent budget.
- Transient branch-local workflows were used only to apply exact fail-closed transformations through the connected GitHub environment; all have been deleted and are absent from the PR diff.

## Non-goals

- No CSS selector, stylesheet, visual redesign or baseline update.
- No changes to `LexigoBootstrappedApp`, `LexigoPhrasesApp`, canonical Phrases catalog/detail components or route ownership.
- No auth/account fallback extraction.
- No lesson, review, answer-suggestion, backend, API, schema, migration, deployment or permanent CI workflow changes.
- No broad deletion of `LexigoPremiumApp` or unrelated compatibility families.

## Final allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/phrases-route-island-source.test.ts`

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
- `DEFAULT_PHRASE_CATALOG` and `toLearningItem` retain phrase slug/cloze fallback behavior.
- Phrase-containing Active Lesson review and `exerciseKind: "cloze"` answer suggestions remain intact.
- Guest/auth/account-recovery fallback remains reachable.
- Canonical Phrases direct entry, reload, new tab and Browser Back/Forward continue selecting `LexigoPhrasesApp` before `LexigoPremiumApp`.
- No CSS or permanent budget changes.

## Acceptance criteria

- Every declaration and residual use of the retired Phrases compatibility identifiers is absent from `LexigoPremiumApp`.
- Canonical Phrases reachability/ownership assertions remain green.
- Shared phrase lesson-domain assertions remain green.
- The final diff contains only the five final allowed files and no transient workflow.
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

- A candidate symbol may still have a non-route lesson/auth consumer despite source proof.
- Pure dead-code deletion can perturb chunking or visual output and must be measured.
- Existing CSS selectors remain intentionally untouched and require a later proof-gated slice.

## Rollback

Revert the atomic squash merge. Stop before merge if exact source assertions, TypeScript, visual hashes, bundle evidence or scope boundaries cannot be proven.