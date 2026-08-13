#!/usr/bin/env bash
set -euo pipefail

PORT="${BOARDCAD_PORT:-8788}"
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:${PORT}/"

if ! command -v python3 >/dev/null 2>&1; then
  printf 'BoardCAD Web requires Python 3 to start the local web server.\n' >&2
  printf 'Install python3 with your Linux package manager, then run this file again.\n' >&2
  exit 1
fi

cd "$ROOT"

# Refuse to silently attach to an unrelated process already using the port.
if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)${PORT}$"; then
  printf 'Port %s is already in use.\n' "$PORT" >&2
  printf 'If BoardCAD is already running, open %s\n' "$URL" >&2
  printf 'Or choose another port, e.g. BOARDCAD_PORT=8790 ./start.sh\n' >&2
  exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/boardcad-web-${USER:-user}-${PORT}.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Give the server a moment to bind before opening the browser.
for _ in {1..30}; do
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "$URL" >/dev/null 2>&1 && break
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$URL" >/dev/null 2>&1 && break
  else
    sleep 0.1
    break
  fi
  sleep 0.1
done

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v gio >/dev/null 2>&1; then
  gio open "$URL" >/dev/null 2>&1 || true
else
  printf 'Open this URL in Chrome/Chromium/Edge: %s\n' "$URL"
fi

printf 'BoardCAD Web is running at %s\n' "$URL"
printf 'Keep this terminal open while using BoardCAD. Press Ctrl+C to stop.\n'
wait "$SERVER_PID"
