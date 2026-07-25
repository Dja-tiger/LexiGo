# LexiGo agent entrypoint

This file is the mandatory entrypoint for every AI agent and contributor before any repository write.

Read, in order:

1. this `AGENTS.md`;
2. [`.agents/AGENTS.md`](.agents/AGENTS.md);
3. every mandatory document indexed by `.agents/AGENTS.md`;
4. [`.agents/SKILLS.md`](.agents/SKILLS.md);
5. [`.agents/PROJECT_STATE.md`](.agents/PROJECT_STATE.md);
6. [`.agents/current/TASK.md`](.agents/current/TASK.md);
7. [`.agents/current/PROGRESS.md`](.agents/current/PROGRESS.md);
8. [`.agents/current/EXECUTION.md`](.agents/current/EXECUTION.md);
9. [`docs/agent-harness.md`](docs/agent-harness.md);
10. the live Issue, PR, architecture documents and exact Figma nodes for the selected task.

Mandatory rules:

- Live GitHub state has priority over saved handoffs and repository snapshots.
- No write is allowed before the production-safe pre-flight is complete.
- Direct writes to `main` are prohibited.
- One PR contains one atomic production or tooling slice.
- After each branch write, read the changed path back, verify its blob SHA and branch head, and confirm that `main` did not move unexpectedly.
- Merge only after the full required CI passes on the final developer-authored head and unresolved review threads are closed.
- After merge, validate `main`, validate stage when applicable, update `.agents/PROJECT_STATE.md`, promote reusable lessons, and reset `.agents/current/**` from templates before starting another task.

Do not duplicate the detailed harness here. The normative process is defined by the indexed repository documents.
