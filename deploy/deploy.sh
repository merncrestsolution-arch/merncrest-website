#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Build + (re)deploy the MernCrest stack on the server.
# Run from the repo root on the Lightsail instance.
#
#   ./deploy/deploy.sh          # pull latest, build, migrate, restart
#   ./deploy/deploy.sh --no-git # skip git pull (deploy current checkout)
# ---------------------------------------------------------------------------
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found."
  echo "  cp .env.production.example .env.production  &&  edit the values."
  exit 1
fi

if [ "${1:-}" != "--no-git" ]; then
  echo "==> Pulling latest code"
  git pull --ff-only
fi

echo "==> Starting datastores (postgres, redis)"
$COMPOSE up -d postgres redis

echo "==> Building images"
$COMPOSE build app migrator

echo "==> Applying database schema + seed (one-off migrator)"
$COMPOSE run --rm migrator

echo "==> Starting app + nginx"
$COMPOSE up -d app nginx

echo "==> Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

echo ""
echo "==> Running containers:"
$COMPOSE ps
echo ""
echo "==> App is live on the instance at http://<STATIC_IP>/ (via nginx :80)"
