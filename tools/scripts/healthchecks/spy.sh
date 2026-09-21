#!/usr/bin/env bash
# Healthcheck for the Wormhole Spy (guardiand) container.
#
# The spy exposes gRPC on port 7073 but has no HTTP health endpoint,
# and the image has no curl/wget/nc. This uses bash's /dev/tcp to
# open a read/write TCP connection to the gRPC port and exits 0
# (healthy) only if the connection succeeds.
#
# Usage: spy.sh [port]
#   port  gRPC port to probe (default: 7073)

PORT="${1:-7073}"
HOST="127.0.0.1"

exec 3<>"/dev/tcp/${HOST}/${PORT}"
