#!/usr/bin/env bash
# Pull the latest code, rebuild and restart. Run as root on the server:
#   bash /opt/quranova/src/deploy/update.sh
set -euo pipefail

APP_USER=quranova
SRC=/opt/quranova/src
ENV_FILE=/etc/quranova.env

as_app() {
  sudo -u "$APP_USER" bash -c "cd $SRC && set -a && . $ENV_FILE && set +a && $*"
}

as_app git pull --ff-only
as_app npm ci --no-audit --no-fund

if [ "${FIRST_RUN:-0}" = 1 ]; then
  as_app npm run db:setup          # creates the tables, the admin account and the starter courses/FAQs
else
  as_app npm run db:push           # applies schema changes; stops (safely) if one would delete data
fi

as_app npm run build
systemctl restart quranova
echo "Updated and restarted."
