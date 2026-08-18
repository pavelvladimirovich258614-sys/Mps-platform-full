#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'mps-backup: ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -n "${PG_DUMP_URL:-}" ]] || fail "PG_DUMP_URL is not set in /etc/mps-platform/backend.env (expected postgresql://..., without +asyncpg)"
case "$PG_DUMP_URL" in
  postgresql://*|postgres://*) ;;
  *) fail "PG_DUMP_URL must use the postgresql:// or postgres:// libpq scheme (not postgresql+asyncpg://)" ;;
esac

pg_dump_bin=${PG_DUMP_BIN:-/usr/bin/pg_dump}
backup_dir=${BACKUP_DIR:-/var/backups/mps}
[[ -x "$pg_dump_bin" ]] || fail "pg_dump is not executable at $pg_dump_bin; install postgresql-client or set PG_DUMP_BIN"
command -v gzip >/dev/null 2>&1 || fail "gzip is not installed"

umask 077
mkdir -p "$backup_dir" || fail "cannot create backup directory $backup_dir"
[[ -w "$backup_dir" ]] || fail "backup directory is not writable by $(id -un): $backup_dir"

timestamp=$(date +%F-%H%M%S)
backup_file="$backup_dir/mps-$timestamp.dump.gz"
temporary_file="$backup_dir/.mps-$timestamp.dump.gz.tmp"
trap 'rm -f -- "$temporary_file"' EXIT

printf 'mps-backup: starting PostgreSQL backup\n'
if ! "$pg_dump_bin" --format=custom --no-owner --dbname="$PG_DUMP_URL" | gzip -c > "$temporary_file"; then
  fail "pg_dump failed; no backup was published"
fi
[[ -s "$temporary_file" ]] || fail "pg_dump produced an empty backup"
mv -- "$temporary_file" "$backup_file" || fail "cannot publish backup to $backup_file"
trap - EXIT

find "$backup_dir" -type f -name 'mps-*.dump.gz' -mtime +13 -delete || fail "14-day backup rotation failed"
printf 'mps-backup: OK: %s\n' "$backup_file"
