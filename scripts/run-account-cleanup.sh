#!/usr/bin/env bash
# =============================================================================
# run-account-cleanup.sh
#
# Calls the cleanup-inactive-accounts Supabase Edge Function.
# Reads ANON_KEY and DOMAIN from the project .env file.
#
# Usage (manual):
#   bash /path/to/tp_gen/scripts/run-account-cleanup.sh
#
# Crontab entry (daily at 03:00):
#   0 3 * * * /path/to/tp_gen/scripts/run-account-cleanup.sh >> /var/log/tp-gen-cleanup.log 2>&1
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# ── Load .env ─────────────────────────────────────────────────────────────────

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: .env not found at $ENV_FILE" >&2
  exit 1
fi

# Source only the variables we need (ignore comments and blank lines)
ANON_KEY=""
DOMAIN=""
API_EXTERNAL_URL=""

while IFS='=' read -r key value; do
  # Skip comments and blank lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  # Strip inline comments and surrounding whitespace/quotes from value
  value="${value%%#*}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value#\"}" ; value="${value%\"}"
  value="${value#\'}" ; value="${value%\'}"
  case "$key" in
    ANON_KEY)          ANON_KEY="$value" ;;
    DOMAIN)            DOMAIN="$value" ;;
    API_EXTERNAL_URL)  API_EXTERNAL_URL="$value" ;;
  esac
done < "$ENV_FILE"

# ── Resolve base URL ──────────────────────────────────────────────────────────

# Prefer API_EXTERNAL_URL; fall back to https://$DOMAIN
if [[ -n "$API_EXTERNAL_URL" ]]; then
  BASE_URL="${API_EXTERNAL_URL%/}"
elif [[ -n "$DOMAIN" ]]; then
  BASE_URL="https://$DOMAIN"
else
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: neither DOMAIN nor API_EXTERNAL_URL set in .env" >&2
  exit 1
fi

if [[ -z "$ANON_KEY" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: ANON_KEY is empty in .env" >&2
  exit 1
fi

FUNCTION_URL="$BASE_URL/functions/v1/cleanup-inactive-accounts"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "[$TIMESTAMP] Calling $FUNCTION_URL"

# ── Call the Edge Function ────────────────────────────────────────────────────

HTTP_STATUS=""
RESPONSE_BODY=""

RESPONSE=$(curl --silent --show-error --write-out "\n%{http_code}" \
  --max-time 60 \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(tail -n1 <<< "$RESPONSE")
RESPONSE_BODY=$(head -n -1 <<< "$RESPONSE")

# ── Log result ────────────────────────────────────────────────────────────────

if [[ "$HTTP_STATUS" == "200" ]]; then
  WARNED=$(echo "$RESPONSE_BODY"  | grep -o '"warned_count":[0-9]*'  | grep -o '[0-9]*' || echo "?")
  DELETED=$(echo "$RESPONSE_BODY" | grep -o '"deleted_count":[0-9]*' | grep -o '[0-9]*' || echo "?")
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] OK — warned: $WARNED, deleted: $DELETED"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Response: $RESPONSE_BODY"
  exit 0
else
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR — HTTP $HTTP_STATUS" >&2
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Response: $RESPONSE_BODY" >&2
  exit 1
fi
