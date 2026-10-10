#!/usr/bin/env bash
# Starts PostgreSQL, runs the app with node --watch, and stops PostgreSQL on exit.

stop_postgres() {
  trap - EXIT INT TERM
  echo
  echo "Stopping PostgreSQL..."
  sudo service postgresql stop
}

echo "Starting PostgreSQL..."
sudo service postgresql start || exit 1
trap stop_postgres EXIT INT TERM

for _ in $(seq 1 20); do
  pg_isready -q && break
  sleep 0.5
done
pg_isready || { echo "PostgreSQL did not become ready." >&2; exit 1; }

node --watch src/app.js
