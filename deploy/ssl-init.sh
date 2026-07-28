#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Issue Let's Encrypt certificates and switch nginx to HTTPS.
# Run on the Lightsail server from the repo root:
#   chmod +x deploy/ssl-init.sh && ./deploy/ssl-init.sh
#
# Prerequisites:
#   - DNS A records for merncrest.lk, www, system → this server's IP
#   - Port 80 open (Lightsail + UFW) for HTTP-01 challenge
#   - Port 443 open in Lightsail Networking (HTTPS) for visitors
# ---------------------------------------------------------------------------
set -euo pipefail

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"
DOMAINS=(-d merncrest.lk -d www.merncrest.lk -d system.merncrest.lk)
EMAIL="${SSL_EMAIL:-contact@merncrest.lk}"
CERT_DIR="/etc/letsencrypt/live/merncrest.lk"

echo "==> Installing certbot (if needed)"
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y certbot
fi

echo "==> Preparing ACME webroot"
sudo mkdir -p /var/www/certbot
sudo chown -R "$USER:$USER" /var/www/certbot

echo "==> Using HTTP-only nginx for ACME challenge"
cp deploy/nginx/default-http-only.conf deploy/nginx/active.conf
$COMPOSE up -d nginx

if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "==> Requesting certificate from Let's Encrypt"
  sudo certbot certonly --webroot \
    -w /var/www/certbot \
    "${DOMAINS[@]}" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring
else
  echo "==> Certificate already exists at $CERT_DIR"
fi

echo "==> Switching nginx to HTTPS config"
cp deploy/nginx/default.conf deploy/nginx/active.conf
$COMPOSE up -d nginx

echo "==> Installing renewal hook"
sudo tee /etc/cron.daily/merncrest-certbot-renew >/dev/null <<'CRON'
#!/bin/bash
set -euo pipefail
cd /home/ubuntu/merncrest
certbot renew --webroot -w /var/www/certbot --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T nginx nginx -s reload || \
  docker compose --env-file .env.production -f docker-compose.prod.yml restart nginx
CRON
sudo chmod +x /etc/cron.daily/merncrest-certbot-renew

echo ""
echo "==> Done. Test:"
echo "    curl -sI https://merncrest.lk/ | head -5"
echo ""
echo "If HTTPS still fails externally, open TCP 443 in Lightsail → Networking → Firewall."
