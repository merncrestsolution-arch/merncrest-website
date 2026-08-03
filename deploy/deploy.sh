#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Build + (re)deploy the MernCrest stack on the server.
# Run from the repo root on the Lightsail instance.
#
#   ./deploy/deploy.sh          # pull latest, build, migrate, restart
#   ./deploy/deploy.sh --no-git # skip git pull (deploy current checkout)
# ---------------------------------------------------------------------------
set -euo pipefail

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found."
  echo "  cp .env.production.example .env.production  &&  edit the values."
  exit 1
fi

if [ "${1:-}" != "--no-git" ]; then
  echo "==> Pulling latest code"
  git fetch origin
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git checkout -B main origin/main
    git branch --set-upstream-to=origin/main main 2>/dev/null || true
    git pull --ff-only origin main
  else
    git pull --ff-only
  fi
fi

echo "==> Starting datastores (postgres, redis)"
$COMPOSE up -d postgres redis

# Small Lightsail instances OOM during Next.js Docker builds — ensure swap.
if [ "$(swapon --show | wc -l)" -lt 1 ]; then
  echo "==> Enabling 2G swap (prevents build OOM on small instances)"
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "==> Building images (this takes 10–15 min on Lightsail)"
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 $COMPOSE build --progress=plain app migrator

echo "==> Applying database schema + seed (one-off migrator)"
$COMPOSE run --rm migrator

echo "==> Configuring nginx"
if [ -f /etc/letsencrypt/live/merncrest.lk/fullchain.pem ]; then
  cp deploy/nginx/default.conf deploy/nginx/active.conf
  echo "    Using HTTPS config (Let's Encrypt certs found)"
else
  cp deploy/nginx/default-http-only.conf deploy/nginx/active.conf
  echo "    Using HTTP-only config (run deploy/ssl-init.sh for TLS)"
fi

echo "==> Starting app + nginx"
$COMPOSE up -d app nginx

echo "==> Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

echo ""
echo "==> Running containers:"
$COMPOSE ps
echo ""
echo "==> App is live on the instance at http://<STATIC_IP>/ (via nginx :80)"
