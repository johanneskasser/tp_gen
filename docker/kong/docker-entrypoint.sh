#!/bin/sh
# Substitute ${VARIABLE} placeholders in the Kong config template with
# runtime environment values, then start Kong.
#
# Required env vars: DASHBOARD_USERNAME, DASHBOARD_PASSWORD, ANON_KEY, SERVICE_ROLE_KEY
set -e

TEMPLATE=/var/lib/kong/kong.yml.template
RESOLVED=/tmp/kong.yml

envsubst < "$TEMPLATE" > "$RESOLVED"

export KONG_DECLARATIVE_CONFIG="$RESOLVED"
exec kong start --vv
