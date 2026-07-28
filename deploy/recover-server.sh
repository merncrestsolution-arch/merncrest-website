#!/usr/bin/env bash
# Run on the Lightsail instance after a reboot if the site is down.
#   cd ~/merncrest && bash deploy/recover-server.sh
set -euo pipefail

echo "==> Kill any stuck Docker builds"
docker ps -q --filter status=running | xargs -r docker stop 2>/dev/null || true
pkill -f "docker-buildx" 2>/dev/null || true

echo "==> Ensure swap (prevents OOM during Next.js build)"
if [ "$(swapon --show | wc -l)" -lt 1 ]; then
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi
free -h

echo "==> Restart stack"
cd ~/merncrest
bash ./deploy/deploy.sh --no-git
