# LexiGo Agent Harness

## 1. Назначение

Agent Harness превращает repository в устойчивую инженерную память. Новый агент должен восстановить правила работы, живой статус, текущий atomic slice, применимые skills, доказательства и оставшийся roadmap без зависимости от старого чата.

## 2. Источники истины и приоритет

1. live GitHub: `main`, refs, Issues, PR, checks, artifacts, deployment;
2. код, tests, migrations и source contracts в актуальном `main`;
3. точные production Figma nodes и variables;
4. `AGENTS` rules;
5. `.agents/PROJECT_STATE.md`;
6. текущий Issue;
7. старые handoff.

При расхождении repository memory с GitHub сначала исправляется memory в отдельной branch.

## 3. Repository memory architecture

- `AGENTS.md` — короткая обязательная точка входа.
- `.agents/AGENTS.md` — индекс всех нормативных правил.
- `.agents/AGENTS*.md` — подтверждённые специализированные правила и error lessons.
- `.agents/PROJECT_STATE.md` — проверенный Completed/In progress/Remaining/Validation pending.
- `.agents/SKILLS.md` — стабильные воспроизводимые procedures.
- `.agents/current/TASK.md` — scope и contract текущего slice.
- `.agents/current/PROGRESS.md` — короткий factual log.
- `.agents/current/EXECUTION.md` — применённые skills и результаты.
- `.agents/templates/**` — чистые шаблоны следующей задачи.
- `.agents/lessons/**` — предметные reusable lessons со ссылками на normative sources.
- `docs/agent-harness.md` — полный lifecycle.

## 4. Startup loop

1. Прочитать root `AGENTS.md`.
2. Прочитать индекс и все обязательные документы.
3. Проверить live GitHub.
4. Сопоставить GitHub с `PROJECT_STATE`.
5. Восстановить текущий task из `current/**`.
6. Выбрать только один atomic slice.
7. Заполнить pre-flight до первой write-операции.

## 5. Pre-flight

Зафиксировать:

- repository и актуальный `main` SHA;
- open PRs, branches, latest merged PR и required CI;
- stage/prod status;
- Issue, acceptance criteria и exact Figma nodes;
- branch, base/head и parallel work;
- scope, non-goals, allowed/prohibited paths;
- runtime, presentation, state, API, CSS, history, storage, mock, fixture и test owners;
- expected checks и rollback.

Write до завершённого pre-flight запрещён.

## 6. Current-state reconstruction

Не переносить старый handoff как факт. Для каждой заявленной завершённой части нужны Issue/PR/merge SHA/checks/code evidence. Различать:

- Completed — contract реализован и доказан;
- In progress — есть живая branch/PR или текущий harness slice;
- Remaining — acceptance criteria ещё не закрыты;
- Validation pending — код существует, но отсутствует manual/stage/security/external evidence;
- Blocked — отсутствует dependency, Figma node, contract или внешнее исследование.

## 7. Atomic task protocol

Один PR содержит один product или tooling slice. Не смешивать redesign, architecture cleanup, dependencies, deployment и unrelated test repair. Сначала определить минимальный contract и regression protection.

## 8. Contract matrix

Для product tasks проверить:

- route/direct entry;
- default/loading/empty/error/retry/offline/restored;
- guest/authenticated;
- desktop Chromium/WebKit, Android/iOS;
- compact/medium/desktop;
- Light/Dark;
- normal/reduced motion;
- mouse/touch/keyboard/screen reader;
- reload/Back/Forward/deep link/repeat submit;
- API fields, versions and mutation order;
- storage/history;
- visual/bundle/performance.

## 9. Implementation loop

Observe
→ Reconstruct context
→ Select one atomic slice
→ Define contract
→ Verify branch
→ Implement smallest change
→ Targeted tests
→ Broader tests
→ Draft PR
→ Analyze CI
→ Fix root cause
→ Full required CI
→ Review artifacts
→ Ready
→ Squash merge
→ Validate main
→ Validate stage
→ Update project memory
→ Reset current context

## 10. Feedback loops

- Every newly discovered failure category adds a confirmed lesson with symptom, root cause, why it escaped, prevention, regression gate and scope.
- Task-specific facts remain in PR/EXECUTION.
- Stable procedure changes go to `SKILLS.md`.
- Production failure categories go to `AGENTS*.md` or `lessons/**`.
- Final status only goes to `PROJECT_STATE.md`.

## 11. Testing ladder

source contract
→ format
→ lint/typecheck
→ unit
→ integration
→ production build
→ Chromium
→ WebKit
→ Android
→ iOS
→ keyboard
→ axe
→ reduced motion
→ 200% zoom
→ history/recovery/offline
→ Linux visual
→ bundle/performance
→ full CI

Run only the applicable lower layers locally/targeted first; never weaken required full CI.

## 12. CI classification

Every failure is classified as:

- production defect;
- stale test;
- stale fixture;
- browser-specific behavior;
- flake;
- runner/infrastructure;
- external transient failure.

Record evidence and root cause. Blind retry is not diagnosis.

## 13. Visual artifact procedure

1. Render on Linux.
2. Download a specific artifact.
3. Inspect every actual against exact Figma nodes.
4. Verify dimensions and SHA-256.
5. Import only allow-listed paths.
6. Run visual comparison without update mode.
7. Keep temporary workflows out of final diff.

## 14. PR lifecycle

- Compare branch to `main`.
- Verify allowed paths, no secrets and no generated artifacts.
- Create Draft PR with scope/non-goals/validation/risks/rollback.
- Analyze every CI failure.
- Keep current files and PR body factual.
- Close unresolved review threads.
- Re-check final head before Ready.

## 15. Ready and squash merge

Ready requires:

- focused diff;
- regression protection;
- full required CI green on final developer-authored head;
- reviewed Linux artifacts when applicable;
- no unresolved threads;
- no temporary workflows or secrets.

Squash merge uses the expected head SHA to prevent merging a moved branch.

## 16. Post-merge validation

- Read new `main` SHA.
- Confirm merged files from `main`.
- Confirm main CI.
- Confirm stage deploy, public smoke and public browser checks when applicable.
- Do not call the task complete if stage evidence is absent or failing.

## 17. PROJECT_STATE update

Update after merge, Issue/roadmap change, deployment or discrepancy. GitHub wins on conflict. Record only verified status, not private reasoning.

## 18. Current context reset

After promotion of durable information:

1. leave one-off run IDs, temporary artifacts and transient failures in PR history;
2. move stable skill rules to `SKILLS.md`;
3. move new production failure categories to AGENTS/lessons;
4. move final outcome to `PROJECT_STATE.md`;
5. recreate `current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` from templates.

Because direct `main` writes are prohibited, reset may be a tiny dedicated follow-up documentation PR.

## 19. Skills registry

Each skill records purpose, source, verification date, prerequisites, procedure, tools, artifacts, restrictions, fallback and regression gates. It does not accumulate task history.

## 20. Execution log

`EXECUTION.md` records reproducible engineering process, not every tool call. Never store chain of thought, hidden prompts, tokens, cookies, `.env`, keys, signed URLs, raw large logs or personal data.

## 21. Error-learning loop

A new category is promoted only with factual evidence. Do not invent lessons. Preserve links to the original normative rule and exact regression gate.

## 22. Stop conditions

Stop writes when:

- `main` changed unexpectedly;
- branch is not based on current `main`;
- Issue conflicts with code contract;
- exact Figma node is absent;
- API contract is unknown;
- diff leaves allowed paths;
- visual actual was not reviewed;
- CI failure is not classified;
- a parallel PR conflicts;
- a write hit the wrong branch;
- secrets are detected.

Reconstruct context before resuming.

## 23. Completed / In progress / Remaining

Use `.agents/PROJECT_STATE.md`. Never infer these states from Issue title, branch name or chat summary alone.

## 24. Актуальная LexiGo roadmap

At the 2026-07-25 verification:

- retained-learning report and weak-area completion are merged (#214/#215; Issue #19 closed);
- Scenario backend/content contract is merged (#216), while Issue #24 remains open;
- next product slice is Scenario UI #196;
- then Dictionary #197, Word Detail #198, Phrases design/implementation #199, Profile #200;
- personalization/First Use #18/#201;
- system/offline states #202/#170;
- audio/custom terminology #25;
- route islands/budgets #115 and legacy cleanup #70;
- Figma handoff #203, visual parity #205 and moderated usability #133.

Always re-verify before use.

## 25. Пример запуска нового агента

Продолжи production-разработку Dja-tiger/LexiGo.

До любых write-операций прочитай в актуальном main:

1. AGENTS.md
2. .agents/AGENTS.md
3. все обязательные документы, на которые он ссылается
4. .agents/SKILLS.md
5. .agents/PROJECT_STATE.md
6. .agents/current/TASK.md
7. .agents/current/PROGRESS.md
8. .agents/current/EXECUTION.md
9. docs/agent-harness.md

Затем проверь живое состояние GitHub:

- main SHA;
- открытые PR;
- branches;
- active Issue;
- CI;
- stage deployment.

Если PROJECT_STATE расходится с GitHub, сначала актуализируй его в отдельной branch.

После этого продолжи текущий atomic production slice.

Не начинай новую product task, пока текущая не доведена до:

- regression protection;
- полного required CI;
- Ready;
- squash merge;
- post-merge main validation;
- stage validation;
- PROJECT_STATE update;
- current context reset.
