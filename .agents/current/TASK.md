# Current Task

## Identity

- Issue: #554
- Branch: `agent/issue-554-openpencil-self-host`
- Base SHA: `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`
- Head SHA: resolve from live branch ref after each write
- PR: #555 (Draft)

## Objective

Self-host the promoted ZSeven OpenPencil design source as a standalone, authenticated design service and establish a private file-backed `op`/MCP control plane for Codex without coupling it to normal LexiGo Stage/prod runtime deployment.

## Proven inputs

- Active editor source: `design/openpencil/LexiGo Design System.op`.
- Accepted `.op` SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`.
- Active token provenance: `design/openpencil/LexiGo Design Tokens.json`.
- Accepted token SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Primary editor/toolchain: `ZSeven-W/openpencil` v0.8.2.
- Immutable web image: `ghcr.io/zseven-w/openpencil-web:v0.8.2@sha256:e13982f18ba3f87ef422c84738be261a337ceccd877aff6ea69a16354fce9775`.
- linux/amd64 child manifest observed during registry inspection: `sha256:6553c22078f198852a1fc778af7a886e5d941bb5c83f6c1865febf52cb9c7403`.
- Upstream `--mcp-http` binds only `127.0.0.1:<port>`.
- Exact-main CI #3620 and Stage run #3470 are green on base SHA.
- OpenPencil self-host workflow #7 / run `31926560509` is green on branch head `af4cb70d97ab3f3f7ba23477434b47e71f376949`.
- Run #7 artifact: ID `9258022406`, digest `sha256:026004b1af33684f93117b33a88ac2b8fd8ae8ad3c7e5df3f27650b203e757b2`.

## Accepted repository architecture

- Dedicated controlled Git worktree owns the editable `.op`/token pair; canonical `main` checkout is never edited in place.
- Human mode: OpenPencil Web opens the worktree `.op`; raw web port binds host loopback only and browser access goes through standalone Caddy TLS + Basic Auth.
- Agent mode: the same pinned image runs `op-host-web-server --mcp-http` with `network_mode: host`, preserving upstream loopback-only MCP binding.
- Human and agent write modes are mutually exclusive through both operator preflight and atomic shared `/state/write.lock`.
- Every writer session creates a bounded, checksummed backup before service start.
- Resulting design changes leave the service only through a normal Git branch/PR review path.
- Standalone design deployment is absent from LexiGo Stage/prod compose, product Caddy and normal product CD.

## Implemented scope

1. `deploy/openpencil/compose.yml`: standalone human/agent profiles with immutable v0.8.2 image pin.
2. `deploy/openpencil/Caddyfile`: browser-only TLS + Basic Auth proxy; no MCP route.
3. `deploy/openpencil/openpencil.env.example`: non-secret host configuration contract.
4. `deploy/openpencil/container-entrypoint.sh`: atomic writer lock + pre-start backup/rotation.
5. `deploy/openpencil/session.sh`: host preflight/start/stop/status/stale-lock recovery.
6. `deploy/openpencil/self-test.sh`: isolated Linux Web/MCP/security/write/backup smoke.
7. `.github/workflows/openpencil-self-host-check.yml`: registry identity + runtime + Caddy + pin validation.
8. `docs/figma/openpencil-self-host.md`: operator/Codex/SSH-tunnel/recovery workflow.

## Authoritative runtime evidence

Self-host workflow #7 proves on Linux with the immutable image:

- source/security and Compose contracts pass;
- raw Web starts on host `127.0.0.1` only;
- a direct-Compose second writer is rejected by the shared lock;
- MCP starts on host `127.0.0.1` only and is absent from Caddy;
- `get_node(fig_2287)` resolves `Home / Mobile / Dark`;
- `list_variables` reports exactly 92 variables;
- `list_pages` reports 23 pages;
- the write probe switches to `figma-page-21`, resolves `fig_6879`, changes `ОБУЧЕНИЕ` to `ОБУЧЕНИЕ · MCP SMOKE`, verifies it, and restores `ОБУЧЕНИЕ` on the disposable copy;
- canonical source SHA checks remain unchanged;
- backup rotation and explicit stale-lock recovery pass;
- repository Caddy image builds with Cloudflare DNS support;
- authenticated Caddy configuration provisions successfully with a format-only fake token under `--network none`;
- checked-in immutable image pin matches the registry-resolved OCI index digest.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/PROJECT_STATE.md`
- `deploy/openpencil/**`
- `.github/workflows/openpencil-self-host-check.yml`
- `docs/figma/openpencil-self-host.md`
- `docs/figma/openpencil-ai-workflow.md` only if a minimal cross-link is required

## Prohibited paths

- `frontend/**`
- `backend/**`
- `api/**`
- `deploy/compose/docker-compose.stage.yml`
- `deploy/compose/docker-compose.prod.yml`
- `deploy/Caddyfile`
- normal product deploy workflows (`deploy-stage.yml`, `deploy-prod.yml`)
- `design/figma/**`
- `design/openpencil/**`
- existing OpenPencil import/visual acceptance scripts or workflows except read-only use as validation dependencies

## Remaining gates before repository merge

- Final developer-authored task-state update must be the last write.
- OpenPencil self-host workflow must be green again on that immutable final head.
- Full repository CI must be green on that same final head.
- Changed-path/review/thread audit must remain clean.
- PR #555 must move Draft -> Ready only after the gates above.
- Squash merge must use an expected-head guard.

## External deployment boundary

Repository implementation and Linux runtime acceptance do not prove a live Internet deployment. Issue #554 must remain open after repository merge until a real design host is provisioned and there is host evidence for DNS, trusted TLS, Basic Auth browser access from outside the host, and Codex access through the approved SSH-tunneled loopback MCP endpoint.

## Rollback

Stop the standalone OpenPencil services, remove the standalone reverse-proxy route, restore the controlled design worktree from Git or the latest bounded backup, and continue using the promoted `.op`/token pair from repository history. LexiGo product services remain unaffected.
