#!/usr/bin/env bash
# One-time layout on the client server. Run as root (or with sudo).
# Does not start stacks — fill .env files first, then use deploy/README.md.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/GMJSilmaro/ISMS-Finden.git}"
ROOT="${INSTALL_ROOT:-/opt/isms}"

mkdir -p "$ROOT/preprod" "$ROOT/prod" "$ROOT/repo"

if [ ! -d "$ROOT/repo/.git" ]; then
  git clone "$REPO_URL" "$ROOT/repo"
else
  echo "Repo already present at $ROOT/repo"
fi

if [ ! -f "$ROOT/preprod/.env" ]; then
  cp "$ROOT/repo/deploy/.env.preprod.example" "$ROOT/preprod/.env"
  echo "Created $ROOT/preprod/.env — edit secrets before starting"
fi

if [ ! -f "$ROOT/prod/.env" ]; then
  cp "$ROOT/repo/deploy/.env.prod.example" "$ROOT/prod/.env"
  echo "Created $ROOT/prod/.env — edit secrets before starting"
fi

echo
echo "Next:"
echo "  1. Install Docker Engine + Compose plugin if needed"
echo "  2. nano $ROOT/preprod/.env  and  nano $ROOT/prod/.env"
echo "  3. Follow $ROOT/repo/deploy/README.md to start stacks / wire GitHub Actions"
echo
command -v docker >/dev/null && docker version --format 'Docker OK: {{.Server.Version}}' || echo "Docker not installed yet"
