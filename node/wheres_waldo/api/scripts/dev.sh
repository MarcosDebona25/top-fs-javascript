#!/usr/bin/env bash
# Starts PostgreSQL, runs the app with node --watch, and stops PostgreSQL on exit.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

stop_postgres() {
  trap - EXIT INT TERM
  echo
  echo "Stopping PostgreSQL..."
  sudo service postgresql stop
}

bash "$ROOT/scripts/start-db.sh" || exit 1
trap stop_postgres EXIT INT TERM

node --watch src/app.js
