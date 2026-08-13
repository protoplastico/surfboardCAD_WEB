#include <CoreFoundation/CoreFoundation.h>
#include <IOKit/hid/IOHIDManager.h>
#include <arpa/inet.h>
#include <math.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <unistd.h>

#define BRIDGE_PORT 8766
#define BRIDGE_VENDOR_ID 0x256F
#define BUTTON_CAPACITY 32

typedef struct {
  pthread_mutex_t mutex;
  double tx, ty, tz;
  double rx, ry, rz;
  bool buttons[BUTTON_CAPACITY];
  bool connected;
  char device_name[256];
  long long packet_count;
  double timestamp_ms;
} BridgeState;

static BridgeState g_state = {
  .mutex = PTHREAD_MUTEX_INITIALIZER,
  .tx = 0.0, .ty = 0.0, .tz = 0.0,
  .rx = 0.0, .ry = 0.0, .rz = 0.0,
  .connected = false,
  .device_name = "",
  .packet_count = 0,
  .timestamp_ms = 0.0
};

static double now_ms(void) {
  struct timeval tv;
  gettimeofday(&tv, NULL);
  return (double)tv.tv_sec * 1000.0 + (double)tv.tv_usec / 1000.0;
}

static void reset_axes_locked(BridgeState* state) {
  state->tx = 0.0;
  state->ty = 0.0;
  state->tz = 0.0;
  state->rx = 0.0;
  state->ry = 0.0;
  state->rz = 0.0;
  memset(state->buttons, 0, sizeof(state->buttons));
}

static void set_device_name_from_cfstring(char* dest, size_t dest_size, CFStringRef value) {
  if (!dest || dest_size == 0) return;
  dest[0] = '\0';
  if (!value) {
    snprintf(dest, dest_size, "%s", "3Dconnexion");
    return;
  }
  if (!CFStringGetCString(value, dest, (CFIndex)dest_size, kCFStringEncodingUTF8)) {
    snprintf(dest, dest_size, "%s", "3Dconnexion");
  }
}

static void bridge_set_device(IOHIDDeviceRef device, bool connected) {
  pthread_mutex_lock(&g_state.mutex);
  g_state.connected = connected;
  g_state.timestamp_ms = now_ms();
  if (device) {
    CFStringRef product = IOHIDDeviceGetProperty(device, CFSTR(kIOHIDProductKey));
    set_device_name_from_cfstring(g_state.device_name, sizeof(g_state.device_name), product);
  } else if (!connected) {
    snprintf(g_state.device_name, sizeof(g_state.device_name), "%s", "");
  }
  if (!connected) {
    reset_axes_locked(&g_state);
  }
  pthread_mutex_unlock(&g_state.mutex);
}

static void bridge_update_axis(const char* key, double value) {
  if (!key) return;
  if (value > 1.0) value = 1.0;
  if (value < -1.0) value = -1.0;
  pthread_mutex_lock(&g_state.mutex);
  if (strcmp(key, "tx") == 0) g_state.tx = value;
  else if (strcmp(key, "ty") == 0) g_state.ty = value;
  else if (strcmp(key, "tz") == 0) g_state.tz = value;
  else if (strcmp(key, "rx") == 0) g_state.rx = value;
  else if (strcmp(key, "ry") == 0) g_state.ry = value;
  else if (strcmp(key, "rz") == 0) g_state.rz = value;
  g_state.packet_count += 1;
  g_state.timestamp_ms = now_ms();
  pthread_mutex_unlock(&g_state.mutex);
}

static void bridge_update_button(int index, bool pressed) {
  if (index < 0 || index >= BUTTON_CAPACITY) return;
  pthread_mutex_lock(&g_state.mutex);
  g_state.buttons[index] = pressed;
  g_state.packet_count += 1;
  g_state.timestamp_ms = now_ms();
  pthread_mutex_unlock(&g_state.mutex);
}

static double normalize_axis(long value, long min, long max) {
  if (min < 0 && max > 0) {
    double denom = fabs((double)min) > fabs((double)max) ? fabs((double)min) : fabs((double)max);
    if (denom < 1e-9) return 0.0;
    return (double)value / denom;
  }
  double center = ((double)min + (double)max) * 0.5;
  double half = ((double)max - (double)min) * 0.5;
  if (fabs(half) < 1e-9) return 0.0;
  return ((double)value - center) / half;
}

static const char* axis_key(uint32_t usage_page, uint32_t usage) {
  if (usage_page != kHIDPage_GenericDesktop) return NULL;
  switch (usage) {
    case kHIDUsage_GD_X: return "tx";
    case kHIDUsage_GD_Y: return "ty";
    case kHIDUsage_GD_Z: return "tz";
    case kHIDUsage_GD_Rx: return "rx";
    case kHIDUsage_GD_Ry: return "ry";
    case kHIDUsage_GD_Rz: return "rz";
    default: return NULL;
  }
}

static void device_matching_callback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
  (void)context;
  (void)result;
  (void)sender;
  bridge_set_device(device, true);
}

static void device_removal_callback(void* context, IOReturn result, void* sender, IOHIDDeviceRef device) {
  (void)context;
  (void)result;
  (void)sender;
  (void)device;
  bridge_set_device(NULL, false);
}

static void input_value_callback(void* context, IOReturn result, void* sender, IOHIDValueRef value) {
  (void)context;
  (void)result;
  (void)sender;
  if (!value) return;
  IOHIDElementRef element = IOHIDValueGetElement(value);
  if (!element) return;
  uint32_t usage_page = IOHIDElementGetUsagePage(element);
  uint32_t usage = IOHIDElementGetUsage(element);
  if (usage_page == kHIDPage_Button) {
    bridge_update_button((int)usage, IOHIDValueGetIntegerValue(value) != 0);
    return;
  }
  const char* key = axis_key(usage_page, usage);
  if (!key) return;
  CFIndex raw = IOHIDValueGetIntegerValue(value);
  CFIndex min = IOHIDElementGetLogicalMin(element);
  CFIndex max = IOHIDElementGetLogicalMax(element);
  bridge_update_axis(key, normalize_axis((long)raw, (long)min, (long)max));
}

static void build_buttons_json(char* dest, size_t dest_size) {
  size_t offset = 0;
  int count = 0;
  offset += snprintf(dest + offset, dest_size > offset ? dest_size - offset : 0, "[");
  for (int i = 0; i < BUTTON_CAPACITY; i += 1) {
    if (!g_state.buttons[i]) continue;
    offset += snprintf(
      dest + offset,
      dest_size > offset ? dest_size - offset : 0,
      "%s%d",
      count > 0 ? "," : "",
      i
    );
    count += 1;
  }
  snprintf(dest + offset, dest_size > offset ? dest_size - offset : 0, "]");
}

static void build_state_json(char* dest, size_t dest_size) {
  char buttons_json[256];
  pthread_mutex_lock(&g_state.mutex);
  build_buttons_json(buttons_json, sizeof(buttons_json));
  snprintf(
    dest,
    dest_size,
    "{\"buttons\":%s,\"connected\":%s,\"deviceName\":\"%s\",\"packetCount\":%lld,\"rx\":%.8f,\"ry\":%.8f,\"rz\":%.8f,\"timestamp\":%.3f,\"tx\":%.8f,\"ty\":%.8f,\"tz\":%.8f}",
    buttons_json,
    g_state.connected ? "true" : "false",
    g_state.device_name,
    g_state.packet_count,
    g_state.rx, g_state.ry, g_state.rz,
    g_state.timestamp_ms,
    g_state.tx, g_state.ty, g_state.tz
  );
  pthread_mutex_unlock(&g_state.mutex);
}

static void build_status_json(char* dest, size_t dest_size) {
  pthread_mutex_lock(&g_state.mutex);
  snprintf(
    dest,
    dest_size,
    "{\"connected\":%s,\"deviceName\":\"%s\",\"ok\":true,\"packetCount\":%lld,\"port\":%d,\"timestamp\":%.3f}",
    g_state.connected ? "true" : "false",
    g_state.device_name,
    g_state.packet_count,
    BRIDGE_PORT,
    g_state.timestamp_ms
  );
  pthread_mutex_unlock(&g_state.mutex);
}

static void send_http_response(int client_fd, const char* status, const char* body) {
  char header[1024];
  size_t body_len = body ? strlen(body) : 0;
  int header_len = snprintf(
    header,
    sizeof(header),
    "%s\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Access-Control-Allow-Methods: GET, OPTIONS\r\n"
    "Access-Control-Allow-Headers: Content-Type\r\n"
    "Cache-Control: no-store\r\n"
    "Connection: close\r\n"
    "Content-Length: %zu\r\n\r\n",
    status,
    body_len
  );
  if (header_len > 0) {
    send(client_fd, header, (size_t)header_len, 0);
  }
  if (body && body_len > 0) {
    send(client_fd, body, body_len, 0);
  }
}

static void* http_server_thread(void* arg) {
  (void)arg;
  int server_fd = socket(AF_INET, SOCK_STREAM, 0);
  if (server_fd < 0) {
    perror("socket");
    return NULL;
  }
  int yes = 1;
  setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(BRIDGE_PORT);
  addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);

  if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) != 0) {
    perror("bind");
    close(server_fd);
    return NULL;
  }
  if (listen(server_fd, 16) != 0) {
    perror("listen");
    close(server_fd);
    return NULL;
  }

  printf("BoardCAD 3D mouse bridge listening on http://127.0.0.1:%d\n", BRIDGE_PORT);
  fflush(stdout);

  while (1) {
    int client_fd = accept(server_fd, NULL, NULL);
    if (client_fd < 0) continue;

    char request[4096];
    ssize_t received = recv(client_fd, request, sizeof(request) - 1, 0);
    if (received <= 0) {
      close(client_fd);
      continue;
    }
    request[received] = '\0';

    char method[16] = {0};
    char path[256] = {0};
    sscanf(request, "%15s %255s", method, path);

    if (strcmp(method, "OPTIONS") == 0) {
      send_http_response(client_fd, "HTTP/1.1 200 OK", "");
      close(client_fd);
      continue;
    }

    char body[1024];
    if (strcmp(path, "/state") == 0) {
      build_state_json(body, sizeof(body));
      send_http_response(client_fd, "HTTP/1.1 200 OK", body);
    } else if (strcmp(path, "/status") == 0) {
      build_status_json(body, sizeof(body));
      send_http_response(client_fd, "HTTP/1.1 200 OK", body);
    } else {
      snprintf(body, sizeof(body), "%s", "{\"ok\":false,\"message\":\"not found\"}");
      send_http_response(client_fd, "HTTP/1.1 404 Not Found", body);
    }
    close(client_fd);
  }

  close(server_fd);
  return NULL;
}

int main(void) {
  g_state.timestamp_ms = now_ms();

  IOHIDManagerRef manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
  if (!manager) {
    fprintf(stderr, "Failed to create IOHIDManager.\n");
    return 1;
  }

  int vendor_id = BRIDGE_VENDOR_ID;
  CFNumberRef vendor_number = CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &vendor_id);
  const void* match_keys[] = { CFSTR(kIOHIDVendorIDKey) };
  const void* match_values[] = { vendor_number };
  CFDictionaryRef match_dict = CFDictionaryCreate(
    kCFAllocatorDefault,
    match_keys,
    match_values,
    1,
    &kCFTypeDictionaryKeyCallBacks,
    &kCFTypeDictionaryValueCallBacks
  );
  IOHIDManagerSetDeviceMatching(manager, match_dict);
  IOHIDManagerRegisterDeviceMatchingCallback(manager, device_matching_callback, NULL);
  IOHIDManagerRegisterDeviceRemovalCallback(manager, device_removal_callback, NULL);
  IOHIDManagerRegisterInputValueCallback(manager, input_value_callback, NULL);
  IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetMain(), kCFRunLoopDefaultMode);

  IOReturn result = IOHIDManagerOpen(manager, kIOHIDOptionsTypeNone);
  if (result != kIOReturnSuccess) {
    fprintf(stderr, "Failed to open IOHIDManager for 3Dconnexion devices.\n");
    if (match_dict) CFRelease(match_dict);
    if (vendor_number) CFRelease(vendor_number);
    CFRelease(manager);
    return 1;
  }

  pthread_t thread;
  if (pthread_create(&thread, NULL, http_server_thread, NULL) != 0) {
    fprintf(stderr, "Failed to start localhost HTTP bridge thread.\n");
    IOHIDManagerClose(manager, kIOHIDOptionsTypeNone);
    if (match_dict) CFRelease(match_dict);
    if (vendor_number) CFRelease(vendor_number);
    CFRelease(manager);
    return 1;
  }
  pthread_detach(thread);

  if (match_dict) CFRelease(match_dict);
  if (vendor_number) CFRelease(vendor_number);
  CFRunLoopRun();

  IOHIDManagerClose(manager, kIOHIDOptionsTypeNone);
  CFRelease(manager);
  return 0;
}
