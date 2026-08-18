#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be provided by /etc/mps-platform/backend.env}"
backup_dir=/var/backups/mps
mkdir -p "$backup_dir"
umask 077
timestamp=$(date +%F-%H%M%S)
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" | gzip > "$backup_dir/mps-$timestamp.dump.gz"
find "$backup_dir" -type f -name 'mps-*.dump.gz' -mtime +13 -delete
