#!/usr/bin/env bash
# Wipe ALL application data and reseed with fresh demo content.
# Run on the Lightsail instance:
#   cd ~/merncrest && bash deploy/reset-database.sh
#
# WARNING: Destructive — deletes every row in PostgreSQL and clears Redis cache.
set -euo pipefail

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found. Run from ~/merncrest on the server."
  exit 1
fi

echo "==> Ensuring postgres + redis are up"
$COMPOSE up -d postgres redis

echo "==> Waiting for postgres…"
$COMPOSE exec -T postgres sh -c 'until pg_isready -U "${POSTGRES_USER:-merncrest}" -d "${POSTGRES_DB:-merncrest}"; do sleep 1; done'

echo "==> Dropping all data, reapplying schema, and seeding"
$COMPOSE run --rm migrator sh -c \
  "npx prisma db push --skip-generate --accept-data-loss --force-reset && npx tsx prisma/seed.ts"

echo "==> Clearing Redis (sessions + cache)"
docker exec merncrest-redis redis-cli FLUSHALL >/dev/null || true

echo "==> Restarting app"
$COMPOSE restart app

echo ""
echo "==> Fresh database ready."
echo "    owner@merncrest.lk / ChangeMe123!"
echo "    staff@merncrest.lk / ChangeMe123!"
echo "    demo@merncrest.lk  / ChangeMe123!"
