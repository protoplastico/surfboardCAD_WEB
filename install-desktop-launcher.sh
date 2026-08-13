#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HOME}/.local/share/applications"
TARGET="${TARGET_DIR}/boardcad-web.desktop"
mkdir -p "$TARGET_DIR"
cat > "$TARGET" <<EOF2
[Desktop Entry]
Version=1.0
Type=Application
Name=BoardCAD Web
Comment=Start BoardCAD Web on localhost
Terminal=false
Categories=Graphics;Engineering;
StartupNotify=true
Icon=applications-engineering
Exec=${ROOT}/launch.sh
Path=${ROOT}
EOF2
chmod +x "$TARGET"
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$TARGET_DIR" >/dev/null 2>&1 || true
fi
printf 'Installed launcher: %s\n' "$TARGET"
printf 'BoardCAD Web should now appear in the application menu.\n'
