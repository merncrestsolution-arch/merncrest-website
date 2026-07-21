#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-time server bootstrap for a fresh Ubuntu (22.04/24.04) Lightsail instance.
# Installs Docker Engine + Compose plugin and configures the firewall.
#
# Usage (on the server):
#   chmod +x deploy/setup-server.sh && ./deploy/setup-server.sh
# ---------------------------------------------------------------------------
set -euo pipefail

echo "==> Updating apt and installing prerequisites"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git ufw

echo "==> Installing Docker Engine + Compose plugin (official repo)"
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
fi
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Allowing current user to run docker without sudo"
sudo usermod -aG docker "$USER" || true

echo "==> Configuring UFW firewall (SSH + HTTP)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
# HTTPS is terminated at Cloudflare; open 443 only if you add on-server TLS.
sudo ufw --force enable

echo ""
echo "==> Done. Docker version:"
sudo docker --version
sudo docker compose version
echo ""
echo "IMPORTANT: log out and back in (or run 'newgrp docker') so the docker"
echo "group applies, then run ./deploy/deploy.sh"
