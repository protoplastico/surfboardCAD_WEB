#!/bin/sh
cd "$(dirname "$0")" || exit 1
mkdir -p ./.build || exit 1
clang \
  -O2 \
  -Wall \
  -Wextra \
  -framework CoreFoundation \
  -framework IOKit \
  -o ./.build/BoardCAD3DMouseBridge \
  ./BoardCAD3DMouseBridge.c || exit 1
exec ./.build/BoardCAD3DMouseBridge
