// ============================================================
// utils/helpers.js — Shared Utility Functions
// ============================================================
// Pure helper functions used across the app.
// No Firebase, no React — just plain JS utilities.
// ============================================================

// ─── Time Formatting ─────────────────────────────────────────

// Convert Unix timestamp → "May 10, 2025 14:32"
export function formatTimestamp(ts) {
  if (!ts) return "Never";
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Convert timestamp → "2 minutes ago" / "just now"
export function timeAgo(ts) {
  if (!ts) return "Unknown";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Get today's date string for history queries → "2025-05-10"
export function todayString() {
  return new Date().toISOString().split("T")[0];
}

// ─── Device Helpers ──────────────────────────────────────────

// Returns true if device was seen within the last N minutes
export function isDeviceOnline(lastSeen, thresholdMinutes = 5) {
  if (!lastSeen) return false;
  const timestamp = Number(lastSeen);
  if (!Number.isFinite(timestamp) || timestamp < 1000000000000) return false;
  return Date.now() - timestamp < thresholdMinutes * 60 * 1000;
}

// Returns count of active (true) relays on a device
export function countActiveRelays(relays = {}) {
  return Object.values(relays).filter((r) => r.state === true).length;
}

// ─── Sensor Formatting ───────────────────────────────────────

// Round sensor values for clean display
export function formatSensor(value, unit = "") {
  if (value === undefined || value === null) return "—";
  return `${parseFloat(value).toFixed(1)}${unit}`;
}

// Returns color class based on temperature value
export function tempColor(temp) {
  if (temp === undefined) return "neutral";
  if (temp < 20) return "cold";
  if (temp < 30) return "normal";
  if (temp < 35) return "warm";
  return "hot";
}

// ─── History Helpers ─────────────────────────────────────────

// Convert history log array into Recharts-compatible format
// Input:  [{ temperature: 27.1, humidity: 60, timestamp: 1715001000000 }]
// Output: [{ time: "14:00", temperature: 27.1, humidity: 60 }]
export function formatHistoryForChart(logs = []) {
  return logs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    }),
    temperature: log.temperature,
    humidity:    log.humidity,
    motion:      log.motion ? 1 : 0,
  }));
}
