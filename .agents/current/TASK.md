# Current Task

## Identity

- Issue: #554
- Branch: `agent/issue-554-openpencil-self-host`
- Base SHA: `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`
- Head SHA: resolve from live branch ref after each write
- PR: not opened yet

## Objective

Self-host the promoted ZSeven OpenPencil design source as a standalone, authenticated design service and establish a private file-backed `op`/MCP control plane for Codex without coupling it to normal LexiGo Stage/prod runtime deployment.

## Proven inputs

- Active editor source: `design/openpencil/LexiGo Design System.op`.
- Accepted `.op` SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`.
- Active token provenance: `design/openpencil/LexiGo Design Tokens.json`.
- Accepted token SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Primary editor/toolchain: `ZSeven-W/openpencil` v0.8.2.
- v0.8.2 web image: `ghcr.io/zseven-w/openpencil-web:v0.8.2`; immutable registry digest must be resolved and pinned before Ready.
- Upstream `--mcp-http` binds only `127.0.0.1:<port>`.
- Exact-main CI #3620 and Stage run #3470 are green on base SHA.

## Target architecture

- Dedicated controlled Git worktree owns the editable `.op`/token pair; never edit canonical `main` checkout in place.
- Human mode: OpenPencil Web opens the worktree `.op`; raw web port is bound to host loopback only and browser access goes through standalone Caddy TLS + Basic Auth.
- Agent mode: the same pinned image runs `op-host-web-server --mcp-http` with `network_mode: host`, preserving upstream loopback-only MCP binding.
- Human and agent write modes are mutually exclusive through a repository-owned session lock/launcher.
- Every write session creates a bounded backup before service start.
- Resulting design changes leave the service only through a normal Git branch/PR review path.
- Standalone design deployment is not referenced by LexiGo Stage/prod compose or normal product CD.

## Scope

1. Add standalone `deploy/openpencil/**` Compose, Caddy, env-example and operator scripts.
2. Pin v0.8.2 image by immutable digest after a registry-backed CI probe resolves it.
3. Bind raw Web only to `127.0.0.1`; expose browser UI only through authenticated HTTPS Caddy.
4. Set exact `OPENPENCIL_WEB_ALLOWED_ORIGINS`; keep server credential persistence disabled.
5. Run MCP as a separate profile/process against a controlled worktree, loopback-only on the host.
6. Add single-writer lock, backup/rotation, start/stop/status/recovery workflow.
7. Add health/security smoke that proves public raw Web/MCP exposure is absent and a disposable-copy MCP mutation is reversible.
8. Add a path-scoped GitHub Actions workflow for Compose/source/security/runtime smoke.
9. Document Codex connection and safe design-write lifecycle.
10. Update repository state after immutable-head validation/merge; Stage deployment is not required for this tooling-only service.

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

## Security invariants

- No API/provider credentials, plaintext passwords, tokens or signed URLs in Git.
- Raw Web port must bind host loopback only.
- MCP HTTP must remain host loopback only; no reverse-proxy route to MCP.
- Browser origin must be an exact HTTPS origin; wildcard origin is prohibited.
- `OPENPENCIL_PERSIST_WEB_CREDENTIALS_SERVER=false` by default.
- Caddy authentication must occur before proxying the editor.
- Worktree and backup directories are host paths owned by the operator/service account and not world-writable.
- Human and agent write sessions cannot overlap.
- Archived `.fig` and promoted canonical sources in `main` remain untouched.

## Required checks

- Compose config parses with required env inputs and contains no Stage/prod services.
- Image tag/digest/version contract is pinned and registry-resolvable.
- Human Web stack starts from a clean controlled worktree and is healthy through loopback/Caddy smoke.
- Unauthenticated browser request is rejected; authenticated request reaches OpenPencil.
- Host raw Web listener is loopback-only.
- MCP service binds `127.0.0.1` and is not routed by Caddy.
- MCP `initialize` / `tools/list` can read the promoted file on a disposable worktree copy.
- Known Home node `fig_2287` is readable and runtime variables report 92.
- One disposable text mutation persists through MCP and source checksum of the canonical input remains unchanged.
- Session lock rejects concurrent human/agent starts.
- Backup rotation and stale-lock recovery are tested.
- Existing OpenPencil visual/token acceptance remains green.
- Full immutable-head repository CI is green before merge.
- No product Stage/prod deployment is required solely for this tooling slice.

## Rollback

Stop the standalone OpenPencil services, remove the standalone reverse-proxy route, restore the controlled design worktree from Git or the latest bounded backup, and continue using the promoted `.op`/token pair from repository history. LexiGo product services remain unaffected.
