#!/bin/bash
set -euo pipefail

# Load credentials from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] .env not found at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Config
CONTAINER="tp-gen-db"
DB_USER="supabase_admin"
DB_NAME="postgres"
BUCKET="zenit-it-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d-%H%M)
FILENAME="tp-gen-db-${TIMESTAMP}.sql.gz"
TMPFILE="/tmp/${FILENAME}"

echo "[$(date)] Starting backup: ${FILENAME}"

# 1. Dump + compress
docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" -h 127.0.0.1 "${DB_NAME}" \
  | gzip > "${TMPFILE}"

echo "[$(date)] Dump size: $(du -sh "${TMPFILE}" | cut -f1)"

# 2. Upload to R2 (credentials via env vars, no rclone.conf needed)
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="${CLOUDFLARE_R2_ACCESS_KEY_ID}"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="${CLOUDFLARE_R2_SECRET_KEY}"
export RCLONE_CONFIG_R2_ENDPOINT="${CLOUDFLARE_R2_ENDPOINT}"
export RCLONE_CONFIG_R2_ACL=private

rclone copy "${TMPFILE}" "r2:${BUCKET}/" --s3-no-check-bucket
echo "[$(date)] Uploaded to R2: ${BUCKET}/${FILENAME}"

# 3. Cleanup local tmp
rm -f "${TMPFILE}"

# 4. Delete backups older than RETENTION_DAYS
rclone delete "r2:${BUCKET}/" \
  --min-age "${RETENTION_DAYS}d" \
  --include "tp-gen-db-*.sql.gz"

echo "[$(date)] Backup complete. Retention: ${RETENTION_DAYS} days."
