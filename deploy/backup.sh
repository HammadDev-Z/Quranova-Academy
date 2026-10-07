#!/usr/bin/env bash
# Nightly backup of the database and uploaded files (installed as a cron job by setup-vps.sh).
# Keeps 14 days. Also copy /var/backups/quranova off the server now and then.
set -euo pipefail

DATA=/var/lib/quranova/data
OUT=/var/backups/quranova
DAY="$(date +%F)"

mkdir -p "$OUT"
sqlite3 "$DATA/app.db" ".backup '$OUT/app-$DAY.db'"
tar -czf "$OUT/files-$DAY.tgz" -C "$DATA" --exclude='app.db*' --exclude='lessons/thumbs' .
find "$OUT" -type f -mtime +14 -delete
