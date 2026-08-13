#!/usr/bin/env swift

import Foundation
import IOKit.hid
import Network

private let bridgePort: UInt16 = 8766
private let threeDconnexionVendorID = 0x256F

final class BridgeState {
  private let queue = DispatchQueue(label: "boardcad.3dmouse.state")
  private var axes: [String: Double] = [
    "tx": 0, "ty": 0, "tz": 0,
    "rx": 0, "ry": 0, "rz": 0
  ]
  private var buttons = Set<Int>()
  private var connected = false
  private var deviceName = ""
  private var packetCount = 0
  private var timestamp = Date().timeIntervalSince1970 * 1000

  func setDevice(name: String, connected: Bool) {
    queue.sync {
      self.deviceName = name
      self.connected = connected
      self.timestamp = Date().timeIntervalSince1970 * 1000
      if !connected {
        self.axes.keys.forEach { self.axes[$0] = 0 }
        self.buttons.removeAll()
      }
    }
  }

  func updateAxis(_ key: String, value: Double) {
    queue.sync {
      self.axes[key] = max(-1, min(1, value))
      self.packetCount += 1
      self.timestamp = Date().timeIntervalSince1970 * 1000
    }
  }

  func updateButton(_ index: Int, pressed: Bool) {
    queue.sync {
      if pressed { self.buttons.insert(index) } else { self.buttons.remove(index) }
      self.packetCount += 1
      self.timestamp = Date().timeIntervalSince1970 * 1000
    }
  }

  func stateJSON() -> String {
    queue.sync {
      let payload: [String: Any] = [
        "connected": connected,
        "deviceName": deviceName,
        "timestamp": timestamp,
        "packetCount": packetCount,
        "tx": axes["tx"] ?? 0,
        "ty": axes["ty"] ?? 0,
        "tz": axes["tz"] ?? 0,
        "rx": axes["rx"] ?? 0,
        "ry": axes["ry"] ?? 0,
        "rz": axes["rz"] ?? 0,
        "buttons": Array(buttons).sorted()
      ]
      return encodeJSON(payload)
    }
  }

  func statusJSON() -> String {
    queue.sync {
      let payload: [String: Any] = [
        "ok": true,
        "connected": connected,
        "deviceName": deviceName,
        "timestamp": timestamp,
        "packetCount": packetCount,
        "port": bridgePort
      ]
      return encodeJSON(payload)
    }
  }
}

func encodeJSON(_ payload: [String: Any]) -> String {
  guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
        let text = String(data: data, encoding: .utf8) else {
    return #"{"ok":false}"#
  }
  return text
}

func normalizeAxis(value: Int, min: Int, max: Int) -> Double {
  if min < 0 && max > 0 {
    let denom = Double(max(abs(min), abs(max)))
    if denom <= 1e-9 { return 0 }
    return Double(value) / denom
  }
  let center = Double(min + max) / 2.0
  let half = Double(max - min) / 2.0
  if half <= 1e-9 { return 0 }
  return (Double(value) - center) / half
}

func axisKey(usagePage: UInt32, usage: UInt32) -> String? {
  guard usagePage == UInt32(kHIDPage_GenericDesktop) else { return nil }
  switch usage {
  case UInt32(kHIDUsage_GD_X): return "tx"
  case UInt32(kHIDUsage_GD_Y): return "ty"
  case UInt32(kHIDUsage_GD_Z): return "tz"
  case UInt32(kHIDUsage_GD_Rx): return "rx"
  case UInt32(kHIDUsage_GD_Ry): return "ry"
  case UInt32(kHIDUsage_GD_Rz): return "rz"
  default: return nil
  }
}

let bridgeState = BridgeState()

final class HIDBridge {
  private let manager: IOHIDManager

  init?() {
    manager = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
    let match: [[String: Any]] = [
      [kIOHIDVendorIDKey as String: threeDconnexionVendorID]
    ]
    IOHIDManagerSetDeviceMatchingMultiple(manager, match as CFArray)
    let unmanaged = Unmanaged.passUnretained(self)
    IOHIDManagerRegisterDeviceMatchingCallback(manager, { context, _, _, device in
      guard let context else { return }
      let owner = Unmanaged<HIDBridge>.fromOpaque(context).takeUnretainedValue()
      owner.deviceMatched(device)
    }, unmanaged.toOpaque())
    IOHIDManagerRegisterDeviceRemovalCallback(manager, { _, _, _, device in
      let name = (IOHIDDeviceGetProperty(device, kIOHIDProductKey as CFString) as? String) ?? "3Dconnexion"
      bridgeState.setDevice(name: name, connected: false)
    }, unmanaged.toOpaque())
    IOHIDManagerRegisterInputValueCallback(manager, { _, _, _, value in
      let element = IOHIDValueGetElement(value)
      let usagePage = IOHIDElementGetUsagePage(element)
      let usage = IOHIDElementGetUsage(element)
      if usagePage == UInt32(kHIDPage_Button) {
        let buttonIndex = Int(usage)
        bridgeState.updateButton(buttonIndex, pressed: IOHIDValueGetIntegerValue(value) != 0)
        return
      }
      guard let key = axisKey(usagePage: usagePage, usage: usage) else { return }
      let raw = IOHIDValueGetIntegerValue(value)
      let min = IOHIDElementGetLogicalMin(element)
      let max = IOHIDElementGetLogicalMax(element)
      bridgeState.updateAxis(key, value: normalizeAxis(value: raw, min: min, max: max))
    }, unmanaged.toOpaque())
    IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetMain(), CFRunLoopMode.defaultMode.rawValue)
    let result = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))
    guard result == kIOReturnSuccess else { return nil }
  }

  private func deviceMatched(_ device: IOHIDDevice) {
    let name = (IOHIDDeviceGetProperty(device, kIOHIDProductKey as CFString) as? String) ?? "3Dconnexion"
    bridgeState.setDevice(name: name, connected: true)
  }
}

final class HTTPBridgeServer {
  private let listener: NWListener
  private let queue = DispatchQueue(label: "boardcad.3dmouse.http")

  init?(port: UInt16) {
    guard let port = NWEndpoint.Port(rawValue: port),
          let listener = try? NWListener(using: .tcp, on: port) else { return nil }
    self.listener = listener
    self.listener.newConnectionHandler = { connection in
      connection.start(queue: self.queue)
      self.receive(on: connection)
    }
  }

  func start() {
    listener.start(queue: queue)
    print("BoardCAD 3D mouse bridge listening on http://127.0.0.1:\(bridgePort)")
  }

  private func receive(on connection: NWConnection) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 8192) { data, _, _, _ in
      let request = String(data: data ?? Data(), encoding: .utf8) ?? ""
      let firstLine = request.split(separator: "\r\n").first.map(String.init) ?? ""
      let parts = firstLine.split(separator: " ")
      let method = parts.count > 0 ? String(parts[0]) : "GET"
      let path = parts.count > 1 ? String(parts[1]) : "/"
      let body: String
      switch path {
      case "/state":
        body = bridgeState.stateJSON()
      case "/status":
        body = bridgeState.statusJSON()
      default:
        body = #"{"ok":false,"message":"not found"}"#
      }
      let statusLine = path == "/state" || path == "/status"
        ? "HTTP/1.1 200 OK\r\n"
        : "HTTP/1.1 404 Not Found\r\n"
      let headers =
        statusLine +
        "Content-Type: application/json\r\n" +
        "Access-Control-Allow-Origin: *\r\n" +
        "Access-Control-Allow-Methods: GET, OPTIONS\r\n" +
        "Access-Control-Allow-Headers: Content-Type\r\n" +
        "Cache-Control: no-store\r\n" +
        "Connection: close\r\n" +
        "Content-Length: \(body.utf8.count)\r\n\r\n"
      let response = method == "OPTIONS" ? statusLine + "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nContent-Length: 0\r\n\r\n" : headers + body
      connection.send(content: response.data(using: .utf8), completion: .contentProcessed { _ in
        connection.cancel()
      })
    }
  }
}

guard let _ = HIDBridge() else {
  fputs("Failed to open IOHIDManager for 3Dconnexion devices.\n", stderr)
  exit(1)
}

guard let server = HTTPBridgeServer(port: bridgePort) else {
  fputs("Failed to start localhost HTTP bridge on port \(bridgePort).\n", stderr)
  exit(1)
}

server.start()
dispatchMain()
