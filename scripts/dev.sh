#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
MOBILE_DIR="$ROOT_DIR/mobile"
BACKEND_URL="http://localhost:4000/health"

if [[ ! -d "$BACKEND_DIR" || ! -d "$MOBILE_DIR" ]]; then
  echo "Expected backend/ and mobile/ directories under $ROOT_DIR"
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env" && -f "$BACKEND_DIR/.env.example" ]]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "Created backend/.env from .env.example"
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend..."
if lsof -iTCP:4000 -sTCP:LISTEN >/dev/null 2>&1; then
  if curl -fsS "$BACKEND_URL" >/dev/null 2>&1; then
    echo "Backend already running on port 4000. Reusing existing backend."
    BACKEND_PID=""
  else
    echo "Port 4000 is in use by another process."
    echo "Stop it with: lsof -i :4000 && kill <PID>"
    exit 1
  fi
else
  (
    cd "$BACKEND_DIR"
    npm run start
  ) &
  BACKEND_PID=$!

  sleep 1
  if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    echo "Backend failed to start."
    exit 1
  fi
fi

echo "Starting mobile (Expo)..."
cd "$MOBILE_DIR"

if [[ -z "${EXPO_PUBLIC_API_URL:-}" ]]; then
  export EXPO_PUBLIC_API_URL="http://localhost:4000"
fi

npm run start
