# Current Task Execution

## Task

- Issue: #554
- Branch: `agent/issue-554-openpencil-self-host`
- Base SHA: `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Instruction/harness boundary

Read before implementation writes:

- root `AGENTS.md`;
- `.agents/AGENTS.md` and every mandatory indexed `.agents/AGENTS*.md` rule;
- `.agents/SKILLS.md`;
- `.agents/PROJECT_STATE.md`;
- previous `.agents/current/**` #552 handoff;
- `docs/agent-harness.md`;
- repository `README.md` and `docs/architecture.md`;
- live Issue #554, refs, CI and Stage state;
- upstream ZSeven v0.8.2 README, Dockerfile/web-server mode and MCP HTTP source contract.

## Pre-flight record

Repository: `Dja-tiger/LexiGo`.

At task start:

- `main = 31f44c973de79d34b13cb68c8ef2f58a3be3be7d`;
- branch initially matched exact `main`;
- exact-main CI #3620 success;
- Deploy Stage #3470 success on exact base SHA;
- no open PR;
- Issue #554 is the only selected atomic slice.

Allowed/prohibited paths are recorded in `current/TASK.md`. Existing Stage/prod compose, product Caddy, product deploy workflows, frontend/backend/API, `.fig`, promoted `.op` and token source pair are prohibited from mutation.

## Upstream contract findings

1. v0.8.2 tagged releases publish `ghcr.io/zseven-w/openpencil-web:v0.8.2`.
2. Rust web image contains the editor web host/wasm/CanvasKit assets but not Codex/Claude/OpenCode CLI binaries.
3. Upstream Docker image serves Web on port 3100 without TLS and expects a reverse proxy for public/private HTTPS use.
4. `OPENPENCIL_WEB_ALLOWED_ORIGINS` is the exact browser-origin control.
5. Browser-entered provider credentials are localStorage-owned by default; server persistence is optional and will remain disabled.
6. `op-host-web-server --mcp-http <port> <path>` is the file-backed HTTP MCP mode.
7. v0.8.2 source binds that MCP HTTP listener explicitly to `127.0.0.1:<port>`.
8. Therefore agent mode will use Docker host networking on Linux so the upstream loopback listener remains host-loopback-only rather than container-loopback-unreachable.

## Planned implementation

- `deploy/openpencil/compose.yml`: standalone human/agent profiles, controlled worktree mounts, host-loopback raw Web, standalone Caddy, host-network MCP.
- `deploy/openpencil/Caddyfile`: TLS, Basic Auth, hardened browser headers, Web-only reverse proxy; no MCP route.
- `deploy/openpencil/openpencil.env.example`: non-secret configuration only, with explicit operator-generated auth hash placeholder.
- operator scripts: preflight, backup/rotation, mutually exclusive session start/stop/status/recovery.
- smoke script: compose/source/security checks plus disposable runtime/MCP read-write checks.
- `.github/workflows/openpencil-self-host-check.yml`: path-scoped authoritative Linux validation and GHCR digest evidence.
- `docs/figma/openpencil-self-host.md`: host preparation, auth/TLS, Codex/MCP connection, write lifecycle and rollback.

## Image-digest bootstrap

The tag exists but immutable GHCR digest cannot be read through the installed GitHub connector (`read:packages` is unavailable), and the local execution container has neither Docker nor outbound DNS. The permanent path-scoped GitHub Actions workflow will first resolve/publish the real registry digest. A subsequent developer-authored commit will pin that digest in the deployment definition before the PR can become Ready.

## Validation ladder

1. shell/source contract and secret-pattern checks;
2. Compose config and profile isolation;
3. pull/inspect exact OpenPencil image and record digest;
4. Human Web loopback runtime smoke;
5. Caddy/auth configuration validation;
6. MCP initialize/tools/read/variables/disposable mutation smoke;
7. lock/backup recovery tests;
8. existing OpenPencil source/visual acceptance;
9. full repository CI on final developer-authored head;
10. review/path audit, Ready, expected-head squash merge and exact-main validation.

## Rollback

Remove/stop only `deploy/openpencil` standalone services and restore the controlled design worktree from Git/backup. Product Stage/prod services are unaffected by construction.
