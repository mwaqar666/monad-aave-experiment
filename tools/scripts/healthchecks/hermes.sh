#!/usr/bin/env bash
# Healthcheck for the Hermes (Pyth price service) container.
#
# Issues a real HTTP GET /ready request using only bash's /dev/tcp
# (the image has no curl/wget). Exits 0 (healthy) only when the
# endpoint returns "200 OK", which means Hermes is connected to the spy,
# synced to Pythnet, and serving verified prices.
#
# Usage: hermes.sh [port]
#   port  Listen port to probe (default: 33999)

PORT="${1:-33999}"
HOST="127.0.0.1"

exec 3<>"/dev/tcp/${HOST}/${PORT}"
printf 'GET /ready HTTP/1.0\r\nHost: %s\r\n\r\n' "$HOST" >&3
head -1 <&3 | grep -q '200'
