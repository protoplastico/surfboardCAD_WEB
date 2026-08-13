#!/usr/bin/env bash
set -u
PORT="${BOARDCAD_PORT:-8788}"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}"
PIDFILE="${RUNTIME_DIR}/boardcad-web-${USER:-user}-${PORT}.pid"
if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ "$PID" =~ ^[0-9]+$ ]] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
  fi
  rm -f "$PIDFILE"
fi
