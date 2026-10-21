#!/usr/bin/env bash
# Starts the local PostgreSQL service and waits until it accepts connections.
# It is safe to call when the service is already running.
set -euo pipefail

if pg_isready -q; then
  exit 0
fi

echo "Starting PostgreSQL..."
sudo service postgresql start

for _ in $(seq 1 20); do
  if pg_isready -q; then
    exit 0
  fi
  sleep 0.5
done

echo "PostgreSQL did not become ready." >&2
exit 1
