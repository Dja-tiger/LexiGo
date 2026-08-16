# LexiGo OpenPencil self-host

This document owns the standalone operator contract for the AI-native LexiGo design source introduced by Issue #554. It is deliberately separate from LexiGo Stage/prod application deployment.

## Source contract

Active editable source:

- `design/openpencil/LexiGo Design System.op`
- accepted SHA-256 at initial promotion: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`

Token provenance:

- `design/openpencil/LexiGo Design Tokens.json`
- accepted SHA-256 at initial promotion: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`

Migration archive:

- `design/figma/LexiGo Design System.fig` remains immutable archive input.

The editor/runtime version is ZSeven OpenPencil v0.8.2. `deploy/openpencil/compose.yml` and the host env file must use the exact repository-approved `v0.8.2@sha256:...` image reference. Upgrading OpenPencil is not an operational edit: it requires repeating the import/render/token acceptance gates first.

## Security model

There are two mutually exclusive writer modes.

### Human mode

`web` opens the controlled worktree `.op` through OpenPencil Web. The raw editor port is published only as host loopback (`127.0.0.1`, default port `33100`). A standalone Caddy instance exposes the dedicated HTTPS design origin and requires Basic Auth before proxying the editor.

`OPENPENCIL_WEB_ALLOWED_ORIGINS` must exactly match `https://OPENPENCIL_SITE_ADDRESS`. Wildcards are forbidden.

Browser-entered model/provider credentials remain browser-local. `OPENPENCIL_PERSIST_WEB_CREDENTIALS_SERVER` is hard-coded to `false` in Compose. Do not add provider API keys to Git, Compose, Docker layers, Caddy config or checked-in env files.

### Agent mode

`mcp` runs the same pinned OpenPencil image in file-backed `--mcp-http` mode. Upstream v0.8.2 binds this listener to `127.0.0.1:<port>`; the container uses Linux host networking so that loopback is the host loopback. There is no published Docker port and no Caddy MCP route.

Remote Codex access must therefore cross an authenticated transport boundary such as SSH, not a public MCP URL. Example tunnel from the Codex workstation:

```bash
ssh -N -L 33101:127.0.0.1:33101 design-operator@design-host
```

The MCP client endpoint on that workstation is then:

```text
http://127.0.0.1:33101/mcp
```

Do not proxy `/mcp` through the public design hostname.

## Host preparation

Use a dedicated Linux design host, or an equivalent isolated host where ports 80/443 are not already owned by the LexiGo product stack. Required tools are Docker with Compose v2, Git, curl and SSH.

Create an operator-owned root with restrictive permissions. Example:

```bash
sudo install -d -m 0700 -o "$USER" -g "$USER" /srv/lexigo-design
mkdir -p /srv/lexigo-design/state /srv/lexigo-design/backups
chmod 700 /srv/lexigo-design/state /srv/lexigo-design/backups
```

Keep the normal repository checkout separate from the writable design worktree. Create one explicit non-`main` branch per design slice, for example:

```bash
cd /srv/LexiGo
git fetch origin
git worktree add \
  -b design/openpencil/my-slice \
  /srv/lexigo-design/worktree \
  origin/main
```

The operator preflight refuses a worktree whose current branch is `main`.

## Host env file

Create the untracked runtime file:

```bash
cp deploy/openpencil/openpencil.env.example deploy/openpencil/openpencil.env
chmod 600 deploy/openpencil/openpencil.env
```

Set:

- the immutable `OPENPENCIL_IMAGE=...v0.8.2@sha256:...` value already approved in the repository;
- absolute worktree/state/backup paths;
- the dedicated design hostname;
- `OPENPENCIL_WEB_ALLOWED_ORIGINS=https://<same-hostname>`;
- a narrowly scoped Cloudflare DNS API token for the design zone;
- an operator email for ACME;
- a Caddy Basic Auth user and bcrypt password hash.

Generate the password hash on the host rather than storing a plaintext password:

```bash
docker run --rm caddy:2.11.4-alpine \
  caddy hash-password --plaintext 'enter-the-password-interactively-or-from-a-safe-secret-source'
```

Put only the resulting hash in the host env file. If it contains `$`, single-quote the value in that file.

## Start and stop

Run the repository-owned wrapper; do not hand-edit the canonical `main` checkout.

Human editor:

```bash
bash deploy/openpencil/session.sh preflight human
bash deploy/openpencil/session.sh start human
bash deploy/openpencil/session.sh status
```

Agent/Codex writer:

```bash
bash deploy/openpencil/session.sh stop
bash deploy/openpencil/session.sh preflight agent
bash deploy/openpencil/session.sh start agent
bash deploy/openpencil/session.sh status
```

Stop all standalone design services:

```bash
bash deploy/openpencil/session.sh stop
```

A human and an agent writer cannot overlap. This is enforced twice:

1. `session.sh` refuses to start while another writer service is running;
2. `container-entrypoint.sh` acquires an atomic shared `/state/write.lock`, so direct `docker compose` bypasses still cannot obtain a second writer.

Writer services intentionally use `restart: "no"`. An unexpected host/container failure can leave a stale directory lock; automatic restart must not guess whether that lock is safe to steal.

After verifying that neither `web` nor `mcp` is running, recover only the stale lock with:

```bash
bash deploy/openpencil/session.sh recover-lock
```

The command refuses recovery while a writer is live.

## Backup and recovery

Every writer container creates a backup before OpenPencil starts. The backup contains:

- `LexiGo Design System.op`;
- `LexiGo Design Tokens.json`;
- `SHA256SUMS` for that pair.

Backups live under `OPENPENCIL_BACKUP_DIR/session-*` and are rotated to `OPENPENCIL_BACKUP_KEEP` entries. The keep count must be at least one.

To recover a damaged design session:

1. stop both modes;
2. preserve the damaged worktree for inspection;
3. verify the selected backup with `sha256sum -c SHA256SUMS`;
4. restore the pair into the same non-main design branch/worktree;
5. rerun the OpenPencil source/visual/token acceptance before opening a PR.

Never restore over `design/figma/LexiGo Design System.fig`.

## AI/MCP smoke contract

The permanent GitHub workflow `.github/workflows/openpencil-self-host-check.yml` runs against the real pinned image and a disposable copy. It proves:

- Web starts and its raw host mapping is `127.0.0.1` only;
- a concurrent MCP writer is rejected by the shared lock;
- MCP itself listens only on host `127.0.0.1`;
- MCP can read Home node `fig_2287` (`Home / Mobile / Dark`);
- all 92 runtime design variables are visible;
- text node `fig_6879` can be changed to a smoke value and restored on the disposable copy;
- the canonical repository source hashes remain unchanged;
- backup rotation and explicit stale-lock recovery work;
- the standalone Caddy configuration contains Basic Auth and validates with the Cloudflare DNS module;
- existing LexiGo Stage/prod Compose and product Caddy contain no OpenPencil service or route.

The workflow also resolves the registry identity of `ghcr.io/zseven-w/openpencil-web:v0.8.2`. It fails closed unless Compose and the env example contain that exact immutable manifest digest.

## Design write lifecycle

Use this sequence for each AI or manual design change:

1. update the repository checkout and create a fresh non-main design worktree/branch;
2. run `preflight` for the required mode;
3. start exactly one writer mode;
4. make the design change;
5. stop the writer;
6. inspect `git status`/diff and the new backup;
7. run the applicable OpenPencil import/visual/token gates;
8. commit only intended design/tooling files;
9. push the branch and open a normal review PR;
10. merge only after immutable-head CI/evidence is green.

Do not auto-merge AI-generated design changes. If a change modifies design-token definitions rather than only screen content/layout, update the token provenance contract deliberately; do not silently let the sidecar diverge from the `.op` variable layer.

## Caddy/TLS boundary

The standalone Caddy stack expects the design hostname to resolve through the configured Cloudflare zone. Caddy terminates TLS and authenticates browser requests. The OpenPencil Web container itself does not terminate TLS.

CI can validate the exact production Caddyfile and exercise the underlying editor/auth configuration, but a real DNS certificate and external reachability are host/environment evidence. Do not mark external deployment complete until the chosen design host has been provisioned and the authenticated HTTPS origin has been checked from outside that host.

## Rollback

Stopping/removing `deploy/openpencil` services has no dependency on LexiGo `web`, `api`, PostgreSQL, Redis, product Caddy, Stage or prod deployment. If the design service must be abandoned, stop it, remove its standalone proxy/DNS entry, restore the worktree from Git/backup, and continue from the repository-owned `.op` source pair.
