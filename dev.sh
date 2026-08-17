#!/usr/bin/env bash
# Start the full local stack: MongoDB, FastAPI backend, CRA frontend.
# Ctrl-C stops the backend and frontend; mongod is left running (it is a daemon).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONGO_BIN="${MONGO_BIN:-$HOME/.local/mongodb/bin/mongod}"
MONGO_HOME="${MONGO_HOME:-$HOME/.local/share/mongodb-salah}"

if ! lsof -ti:27017 >/dev/null 2>&1; then
  echo "==> starting mongod on :27017"
  mkdir -p "$MONGO_HOME/data" "$MONGO_HOME/log"
  "$MONGO_BIN" --dbpath "$MONGO_HOME/data" --logpath "$MONGO_HOME/log/mongod.log" \
    --port 27017 --wiredTigerCacheSizeGB 0.5 --fork >/dev/null
else
  echo "==> mongod already running on :27017"
fi

echo "==> starting backend on :8001"
(cd "$ROOT/backend" && .venv/bin/uvicorn server:app --reload --port 8001) &
BACKEND_PID=$!

echo "==> starting frontend on :3000"
(cd "$ROOT/frontend" && corepack yarn start) &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' INT TERM
wait
