// ============================================================
// utils/demoData.js - Sample five-relay device for UI preview.
// ============================================================

export const DEMO_DEVICE_ID = "demo-device";

const demoRelay = (name, state, updatedAt) => ({
  name,
  state,
  updated_by: "demo",
  updated_at: updatedAt,
});

export const DEMO_DEVICE = {
  id: DEMO_DEVICE_ID,
  info: {
    name: "Demo Device",
    location: "Living Room",
    type: "relay",
    board: "ESP8266",
    registered_at: Date.now() - 86400000,
  },
  status: {
    online: true,
    last_seen: Date.now() - 120000,
    ip_address: "192.168.4.1",
    wifi_strength: -58,
    firmware_version: "1.0.0-demo",
  },
  sensors: {
    temperature: 24.8,
    humidity: 54,
    updated_at: Date.now() - 60000,
  },
  relays: {
    relay_1: demoRelay("Relay 1", true, Date.now() - 180000),
    relay_2: demoRelay("Relay 2", false, Date.now() - 120000),
    relay_3: demoRelay("Relay 3", false, Date.now() - 90000),
    relay_4: demoRelay("Relay 4", false, Date.now() - 60000),
    relay_5: demoRelay("Relay 5", false, Date.now() - 30000),
  },
};