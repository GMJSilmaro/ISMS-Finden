# =============================================================================
# FINDEN ISMS — Docker deploy (pre-prod + prod) on one server
# =============================================================================

## How Docker Compose and `.env` work

Compose uses environment files in **two different ways**:

| Layer | What it does | Where you control it |
|-------|----------------|----------------------|
| **Compose interpolation** | Replaces `${VAR}` inside `docker-compose.yml` (image tag, ports, DB password, project name) | File passed with `--env-file`, or a `.env` next to the project directory |
| **Container env** | Becomes `process.env` inside the app (auth secrets, public URL, Resend, Redis, etc.) | Service `env_file:` → we set `HOST_ENV_FILE` to the **same** absolute path |

So on the server you edit **one file per environment**:

- Pre-prod: `/opt/isms/preprod/.env`
- Prod: `/opt/isms/prod/.env`

Templates in git (no secrets):

- `deploy/.env.preprod.example`
- `deploy/.env.prod.example`

**Never commit real `.env` files.** Rotate secrets if they leak.

Inside Compose, the app always talks to Postgres as hostname `postgres` on the private network. Do **not** point `DATABASE_URL` at `localhost` for the container — the compose file overrides DB URLs to the internal service.

Local laptop Postgres stays at the repo root: `docker compose up -d` (dev only).

```text
┌──────────────────────────── their server (ismsv2) ──────────────────────────┐
│                                                                             │
│  /opt/isms/preprod/.env          /opt/isms/prod/.env                        │
│         │                                  │                                │
│         ▼                                  ▼                                │
│  ┌─ project isms-preprod ─┐       ┌─ project isms-prod ─┐                   │
│  │  app   :3001→3000      │       │  app   :3000→3000   │                   │
│  │  postgres (internal)   │       │  postgres (internal)│                   │
│  │  volumes: db + uploads │       │  volumes: db + uploads │                │
│  └────────────────────────┘       └─────────────────────┘                   │
│                                                                             │
│  GitHub Actions → build image → ghcr.io → SSH → compose pull && up -d       │
└─────────────────────────────────────────────────────────────────────────────┘
```

Suggested ports on this host (60 GiB RAM / plenty of disk):

| Env | App URL (until reverse proxy) | Compose project |
|-----|-------------------------------|-----------------|
| Pre-prod | `http://SERVER_IP:3001` | `isms-preprod` |
| Prod | `http://SERVER_IP:3000` | `isms-prod` |

---

## One-time server bootstrap

SSH as root (or a deploy user with Docker rights).

### 1. Install Docker Engine + Compose plugin

Follow Docker’s Ubuntu install docs, then:

```bash
docker version
docker compose version
```

### 2. Layout (or use the bootstrap script)

```bash
# From a machine that can SSH in, after cloning once:
#   scp deploy/bootstrap-server.sh root@SERVER:/tmp/
#   ssh root@SERVER 'bash /tmp/bootstrap-server.sh'

mkdir -p /opt/isms/preprod /opt/isms/prod /opt/isms/repo
cd /opt/isms/repo
git clone https://github.com/GMJSilmaro/ISMS-Finden.git .
```

### 3. Create env files

```bash
cp deploy/.env.preprod.example /opt/isms/preprod/.env
cp deploy/.env.prod.example    /opt/isms/prod/.env
nano /opt/isms/preprod/.env   # set passwords, AUTH_SECRET, IMAGE owner, URLs
nano /opt/isms/prod/.env
```

**Password tip:** avoid `@`, `:`, `/`, `#`, `%` in `POSTGRES_PASSWORD` (they break the interpolated `DATABASE_URL`). Prefer `openssl rand -hex 32`.

Set `IMAGE` to your GHCR image, e.g. `ghcr.io/gmjsilmaro/isms-finden:preprod`.

### 4. GHCR login on the server (for private packages)

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

Use a GitHub PAT (read:packages) or rely on the deploy workflow to log in over SSH.

### 5. First start (manual)

```bash
cd /opt/isms/repo

docker compose -p isms-preprod --env-file /opt/isms/preprod/.env \
  -f deploy/docker-compose.yml pull
docker compose -p isms-preprod --env-file /opt/isms/preprod/.env \
  -f deploy/docker-compose.yml up -d

docker compose -p isms-prod --env-file /opt/isms/prod/.env \
  -f deploy/docker-compose.yml pull
docker compose -p isms-prod --env-file /opt/isms/prod/.env \
  -f deploy/docker-compose.yml up -d
```

Migrations run automatically in `deploy/entrypoint.sh` on each app start.

Optional first-time seed (pre-prod only):

```bash
docker compose -p isms-preprod --env-file /opt/isms/preprod/.env \
  -f deploy/docker-compose.yml exec app \
  node -e "console.log('seed via prisma when ready')"
```

Prefer seeding from a one-off container with `pnpm run db:seed` against the pre-prod DB after you have a maintenance window — do **not** seed production with demo data.

---

## GitHub Actions CI/CD

Workflows:

| Workflow | Trigger | Action |
|----------|---------|--------|
| `.github/workflows/ci.yml` | PR + push | Lint / typecheck |
| `.github/workflows/deploy-preprod.yml` | push to `develop` | Build → GHCR `:preprod` + SHA → SSH deploy pre-prod |
| `.github/workflows/deploy-prod.yml` | push to `main` | Build → GHCR `:prod` + SHA → SSH deploy prod |

### GitHub secrets / variables to create

Repository → Settings → Secrets and variables → Actions:

| Name | Type | Purpose |
|------|------|---------|
| `DEPLOY_HOST` | secret | Server IP/hostname (e.g. `172.16.7.218`) |
| `DEPLOY_USER` | secret | SSH user (e.g. `root` or `deploy`) |
| `DEPLOY_SSH_KEY` | secret | Private key for that user |
| `GHCR_TOKEN` | secret | GitHub PAT with `read:packages` (server pulls the image) |
| `DEPLOY_SSH_PORT` | variable (optional) | Default `22` |
| `DEPLOY_REPO_DIR` | variable (optional) | Default `/opt/isms/repo` |
| `PREPROD_ENV_FILE` | variable (optional) | Default `/opt/isms/preprod/.env` |
| `PROD_ENV_FILE` | variable (optional) | Default `/opt/isms/prod/.env` |

Also create GitHub Environments named `preprod` and `prod` (optional approval rules on prod).

App secrets (`AUTH_SECRET`, DB passwords, Resend, …) stay **on the server `.env` files**, not in GitHub — Actions only updates the running image.

### Branch model

- `develop` → pre-prod  
- `main` → prod  

Create `develop` once if missing: `git checkout -b develop && git push -u origin develop`.

Promote by merging `develop` → `main` when UAT on pre-prod is good.

---

## Day-2 ops

```bash
# Status
docker compose -p isms-preprod --env-file /opt/isms/preprod/.env -f /opt/isms/repo/deploy/docker-compose.yml ps
docker compose -p isms-prod    --env-file /opt/isms/prod/.env    -f /opt/isms/repo/deploy/docker-compose.yml ps

# Logs
docker compose -p isms-prod --env-file /opt/isms/prod/.env -f /opt/isms/repo/deploy/docker-compose.yml logs -f app

# Change a secret
nano /opt/isms/prod/.env
docker compose -p isms-prod --env-file /opt/isms/prod/.env -f /opt/isms/repo/deploy/docker-compose.yml up -d
```

Volumes (`postgres_data`, `uploads_data`) are per Compose **project name**, so pre-prod and prod never share DB or uploads.

---

## Reverse proxy (optional next step)

Point a hostname at the server and terminate TLS with Caddy/Nginx → `127.0.0.1:3000` / `:3001`, then set `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` to `https://…` in each `.env`.
