# BoardCAD 3D Mouse Local Bridge

This bridge is a macOS-local helper for BoardCAD Web.

## Purpose

- Read 3Dconnexion SpaceMouse / 6DOF HID input on macOS
- Expose the latest state on `http://127.0.0.1:8766`
- Let BoardCAD Web poll that state and drive the 3D camera

## Endpoints

- `GET /status`
- `GET /state`

Both return JSON and set `Access-Control-Allow-Origin: *`.

## Run

```sh
cd boardcad-web/local-bridge
./run-3dmouse-bridge.command
```

Or directly:

```sh
mkdir -p ./.build
clang -O2 -Wall -Wextra \
  -framework CoreFoundation \
  -framework IOKit \
  -o ./.build/BoardCAD3DMouseBridge \
  ./BoardCAD3DMouseBridge.c
./.build/BoardCAD3DMouseBridge
```

## Notes

- Current implementation targets 3Dconnexion vendor ID `0x256F`
- Axes are read from standard HID Generic Desktop usages:
  - `X Y Z Rx Ry Rz`
- Browser side currently polls `http://127.0.0.1:8766/state`
- `BoardCAD3DMouseBridge.swift` is an earlier prototype; the runnable bridge is `BoardCAD3DMouseBridge.c`

## Current scope

Implemented:

- localhost bridge server
- HID device open / match / removal
- axis/button normalization
- BoardCAD Web camera bridge client

Not yet implemented:

- device-specific tuning profiles
- button mapping UI
- dominant-axis / horizon-lock presets matching Blender or Fusion exactly
