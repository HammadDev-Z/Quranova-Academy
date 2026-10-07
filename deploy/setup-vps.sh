#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 22.04 / 24.04 VPS (Contabo or any other).
# Installs Node, Caddy (automatic HTTPS), a systemd service and nightly backups,
# then builds and starts the app.
#
# Run as root on the server:
#   ADMIN_EMAIL=you@example.com bash setup-vps.sh
#
# With no domain it serves https://<ip-with-dashes>.sslip.io (free, real HTTPS).
# Once you own a domain, point its A record at the server and re-run with:
#   SITE_HOST=yourdomain.com ADMIN_EMAIL=you@example.com bash setup-vps.sh
set -euo pipefail

REPO="${REPO:-https://github.com/hammadDev-Z/quranova-academy.git}"
APP_USER=quranova
BASE=/opt/quranova
SRC=$BASE/src
DATA=/var/lib/quranova/data
ENV_FILE=/etc/quranova.env

[ "$(id -u)" = 0 ] || { echo "Run this as root."; exit 1; }
: "${ADMIN_EMAIL:?Set ADMIN_EMAIL=you@example.com (your admin login)}"

IP="$(curl -4fsS https://api.ipify.org)"
HOST="${SITE_HOST:-${IP//./-}.sslip.io}"
echo "==> Site will be served at https://$HOST"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ufw sqlite3 ca-certificates gnupg build-essential debian-keyring debian-archive-keyring apt-transport-https

# A small swap file keeps `next build` from running out of memory on small servers.
if [ "$(swapon --show --noheadings | wc -l)" = 0 ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Node 22 LTS
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Caddy
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

# Firewall: SSH + web only
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# App user, folders, code
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$BASE" --shell /bin/bash "$APP_USER"
mkdir -p "$DATA"
chown -R "$APP_USER:$APP_USER" /var/lib/quranova
if [ ! -d "$SRC/.git" ]; then
  sudo -u "$APP_USER" git clone --branch "${BRANCH:-master}" "$REPO" "$SRC"
fi
ln -sfn "$DATA" "$SRC/data"   # the app keeps its database and uploads in ./data

# Settings (created once; edit /etc/quranova.env to change them)
if [ ! -f "$ENV_FILE" ]; then
  ADMIN_PASSWORD="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)A7"
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://$HOST
DATABASE_URL=file:./data/app.db

# Admin account, created on first setup only.
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_NAME=Admin
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Optional: lead emails (see .env.example)
#SMTP_HOST=smtp.gmail.com
#SMTP_PORT=587
#SMTP_USER=
#SMTP_PASS=
EOF
  FIRST_RUN=1
else
  sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://$HOST|" "$ENV_FILE"
  FIRST_RUN=0
fi
chown root:"$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

# HTTPS reverse proxy
cat > /etc/caddy/Caddyfile <<EOF
$HOST {
	encode zstd gzip
	request_body {
		max_size 60MB
	}
	reverse_proxy 127.0.0.1:3000
}
EOF
systemctl enable --now caddy
systemctl reload caddy

# Service
cat > /etc/systemd/system/quranova.service <<EOF
[Unit]
Description=Quranova Academy
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$SRC
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p 3000 -H 127.0.0.1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable quranova

# Nightly backup at 03:30
echo "30 3 * * * root bash $SRC/deploy/backup.sh" > /etc/cron.d/quranova-backup

# First build + database
FIRST_RUN=$FIRST_RUN bash "$SRC/deploy/update.sh"

echo
echo "=============================================================="
echo " Done. Open:  https://$HOST"
echo " Admin login: $ADMIN_EMAIL"
if [ "$FIRST_RUN" = 1 ]; then
  echo " Password:    $(grep '^ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2)   (change it under Admin > My account)"
fi
echo "=============================================================="
