#!/usr/bin/env bash
set -u

PORT="${BOARDCAD_PORT:-8788}"
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:${PORT}/"
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}"
mkdir -p "$RUNTIME_DIR"
PIDFILE="${RUNTIME_DIR}/boardcad-web-${USER:-user}-${PORT}.pid"
LOGFILE="${RUNTIME_DIR}/boardcad-web-${USER:-user}-${PORT}.log"

notify_error() {
  local msg="$1"
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="BoardCAD Web" --text="$msg" >/dev/null 2>&1 || true
  elif command -v kdialog >/dev/null 2>&1; then
    kdialog --error "$msg" --title "BoardCAD Web" >/dev/null 2>&1 || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "BoardCAD Web" "$msg" >/dev/null 2>&1 || true
  else
    printf '%s\n' "$msg" >&2
  fi
}

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
  elif command -v gio >/dev/null 2>&1; then
    gio open "$URL" >/dev/null 2>&1 &
  else
    notify_error "ブラウザを自動起動できません。${URL} を開いてください。"
  fi
}

is_boardcad_server() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 1 "$URL" 2>/dev/null | grep -q '<title>BoardCAD Web</title>'
    return $?
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- --timeout=1 "$URL" 2>/dev/null | grep -q '<title>BoardCAD Web</title>'
    return $?
  fi
  return 1
}

# Already running: just bring BoardCAD up in the browser.
if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ "$PID" =~ ^[0-9]+$ ]] && kill -0 "$PID" 2>/dev/null && is_boardcad_server; then
    open_browser
    exit 0
  fi
  rm -f "$PIDFILE"
fi

# Recover a BoardCAD server that is already serving this URL even if the pid file was lost.
if is_boardcad_server; then
  open_browser
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  notify_error "Python 3 が見つかりません。Linuxのパッケージマネージャーで python3 をインストールしてください。"
  exit 1
fi

# Refuse to take over an unrelated process using the configured port.
if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)${PORT}$"; then
  notify_error "localhost:${PORT} は別のプログラムが使用中です。"
  exit 1
fi

nohup env BOARDCAD_PORT="$PORT" python3 "$ROOT/boardcad_server.py" >"$LOGFILE" 2>&1 < /dev/null &
SERVER_PID=$!
printf '%s\n' "$SERVER_PID" > "$PIDFILE"

# Wait briefly for the local server to become available.
READY=0
for _ in $(seq 1 40); do
  if is_boardcad_server; then
    READY=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    break
  fi
  sleep 0.1
done

if [[ "$READY" -ne 1 ]]; then
  rm -f "$PIDFILE"
  notify_error "BoardCAD Webを起動できませんでした。ログ: ${LOGFILE}"
  exit 1
fi

open_browser
exit 0
