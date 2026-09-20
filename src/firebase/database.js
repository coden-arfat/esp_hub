// ============================================================
// firebase/database.js — Realtime Database Operations
// ============================================================
// All Firebase DB reads/writes are centralized here.
// This makes it easy to update paths or logic in one place.
//
// DATABASE STRUCTURE (see full JSON in /docs):
//   /devices/{deviceId}/info
//   /devices/{deviceId}/status
//   /devices/{deviceId}/sensors
//   /devices/{deviceId}/relays/{relayId}
//   /history/{deviceId}/{date}/{logId}
//   /users/{uid}/devices
//   /notifications/{uid}/{notifId}
// ============================================================

import {
  ref, set, get, push, update,
  onValue, serverTimestamp, query,
  orderByChild, limitToLast,
} from "firebase/database";
import { db } from "./config";

// ============================================================
// DEVICES
// ============================================================

// Subscribe to all devices owned by a user (live)
// callback receives: array of device objects
export function subscribeToUserDevices(uid, callback) {
  const userRef = ref(db, `users/${uid}/devices`);
  // onValue supports an error callback as the third argument — handle errors
  // (e.g., permission denied) by returning an empty array so the UI can
  // fall back to the demo device.
  const unsubscribe = onValue(
    userRef,
    async (snap) => {
      if (!snap.exists()) return callback([]);
      const deviceIds = Object.keys(snap.val());
      const devices = await Promise.all(
        deviceIds.map((id) => getDevice(id))
      );
      callback(devices.filter(Boolean));
    },
    (error) => {
      // Log and return empty list so callers can show the demo device
      // instead of hanging on a loading state.
      // eslint-disable-next-line no-console
      console.error("subscribeToUserDevices error:", error);
      callback([]);
    }
  );
  return unsubscribe;
}

// Fetch a single device (one-time read)
export async function getDevice(deviceId) {
  const snap = await get(ref(db, `devices/${deviceId}`));
  if (!snap.exists()) return null;
  return { id: deviceId, ...snap.val() };
}

// Subscribe to a single device (live updates)
export function subscribeToDevice(deviceId, callback) {
  const deviceRef = ref(db, `devices/${deviceId}`);
  return onValue(deviceRef, (snap) => {
    if (!snap.exists()) return callback(null);
    callback({ id: deviceId, ...snap.val() });
  });
}

// Register a new device under the user
export async function registerDevice(uid, deviceId, deviceInfo) {
  await update(ref(db, `devices/${deviceId}/info`), {
    ...deviceInfo,
    owner_uid: uid,
    registered_at: serverTimestamp(),
  });
  await set(ref(db, `users/${uid}/devices/${deviceId}`), true);
}

// Create the local demo device as a real Firebase device for the signed-in user.
export async function seedDemoDevice(uid) {
  const deviceId = "demo-device";
  const now = serverTimestamp();
  const updates = {
    [`devices/${deviceId}/info`]: {
      name: "Firebase Demo Device",
      location: "Living Room",
      type: "relay",
      board: "ESP8266",
      owner_uid: uid,
      registered_at: now,
    },
    [`devices/${deviceId}/status`]: {
      online: true,
      firmware_version: "demo-1.0.0",
      last_seen: now,
      updated_at: now,
    },
    [`devices/${deviceId}/sensors`]: {
      temperature: 24.8,
      humidity: 54,
      updated_at: now,
    },
    [`devices/${deviceId}/relays`]: {
      relay_1: { name: "Relay 1", state: false, updated_by: "demo", updated_at: now },
      relay_2: { name: "Relay 2", state: false, updated_by: "demo", updated_at: now },
      relay_3: { name: "Relay 3", state: false, updated_by: "demo", updated_at: now },
      relay_4: { name: "Relay 4", state: false, updated_by: "demo", updated_at: now },
      relay_5: { name: "Relay 5", state: false, updated_by: "demo", updated_at: now },
    },
    [`users/${uid}/devices/${deviceId}`]: true,
  };
  await update(ref(db), updates);
}

// Remove a device from user's list (does not delete device data)
export async function unregisterDevice(uid, deviceId) {
  await set(ref(db, `users/${uid}/devices/${deviceId}`), null);
}

// ============================================================
// RELAY CONTROL
// ============================================================

// Toggle a relay ON or OFF from the website
// The ESP listens to this path and reacts immediately
export async function setRelayState(deviceId, relayId, state) {
  await update(ref(db, `devices/${deviceId}/relays/${relayId}`), {
    state,
    updated_at: serverTimestamp(),
    updated_by: "website",          // Tracks who changed it
  });
}

// Apply a finger count directly to the same relay paths used by web controls.
// Finger counts 1-4 activate relays cumulatively. A 5-finger signal turns all relays off.
export async function setGestureCount(deviceId, count) {
  const normalizedCount = Number(count) || 0;
  if (normalizedCount < 1 || normalizedCount > 5) return;

  const relayUpdates = {};

  for (let index = 1; index <= 5; index += 1) {
    const relayOn = normalizedCount <= 4
      ? index <= normalizedCount
      : false;

    relayUpdates[`devices/${deviceId}/relays/relay_${index}/state`] = relayOn;
    relayUpdates[`devices/${deviceId}/relays/relay_${index}/updated_at`] = serverTimestamp();
    relayUpdates[`devices/${deviceId}/relays/relay_${index}/updated_by`] = "gesture";
  }

  await update(ref(db), relayUpdates);
}

// Generic device output control (PWM, stepper, switches, custom outputs)
export async function setDeviceOutput(deviceId, outputId, outputData) {
  await update(ref(db, `devices/${deviceId}/outputs/${outputId}`), {
    ...outputData,
    updated_at: serverTimestamp(),
    updated_by: "website",
  });
}

// Turn off all relay and output ports on a device.
export async function turnOffDevicePorts(deviceId, relays = {}, outputs = {}) {
  const updates = {};

  Object.entries(relays).forEach(([relayId]) => {
    updates[`devices/${deviceId}/relays/${relayId}`] = {
      state: false,
      updated_at: serverTimestamp(),
      updated_by: "website",
    };
  });

  Object.entries(outputs).forEach(([outputId, output]) => {
    const payload = {
      updated_at: serverTimestamp(),
      updated_by: "website",
    };

    if (output.type === "switch") {
      payload.state = false;
    } else if (output.type === "pwm" || output.type === "range") {
      payload.value = output.min ?? 0;
    } else if (output.type === "stepper") {
      payload.position = output.min ?? 0;
    } else {
      payload.value = output.value ?? output.position ?? output.state ?? 0;
    }

    updates[`devices/${deviceId}/outputs/${outputId}`] = payload;
  });

  if (Object.keys(updates).length === 0) return;
  await update(ref(db), updates);
}

// ============================================================
// HISTORY
// ============================================================

// Fetch history logs for a device on a specific date
// date format: "YYYY-MM-DD"
export async function getDeviceHistory(deviceId, date) {
  const histRef = ref(db, `history/${deviceId}/${date}`);
  const snap = await get(histRef);
  if (!snap.exists()) return [];
  return Object.values(snap.val()).sort((a, b) => a.timestamp - b.timestamp);
}

// Fetch the last N history entries across all dates (live)
export function subscribeToRecentHistory(deviceId, limit = 50, callback) {
  const histRef = query(
    ref(db, `history/${deviceId}`),
    limitToLast(limit)
  );
  return onValue(histRef, (snap) => {
    if (!snap.exists()) return callback([]);
    const allLogs = [];
    snap.forEach((dateSnap) => {
      dateSnap.forEach((logSnap) => {
        allLogs.push(logSnap.val());
      });
    });
    callback(allLogs.sort((a, b) => a.timestamp - b.timestamp));
  });
}

// ============================================================
// ALERTS / NOTIFICATIONS
// ============================================================

// Subscribe to unread notifications for the current user
export function subscribeToNotifications(uid, callback) {
  const notifRef = ref(db, `notifications/${uid}`);
  return onValue(notifRef, (snap) => {
    if (!snap.exists()) return callback([]);
    const notifs = Object.entries(snap.val()).map(([id, val]) => ({
      id,
      ...val,
    }));
    callback(notifs.sort((a, b) => b.timestamp - a.timestamp));
  });
}

// Mark a notification as read
export async function markNotificationRead(uid, notifId) {
  await update(ref(db, `notifications/${uid}/${notifId}`), { read: true });
}

// Update alert thresholds for a device
export async function updateAlertConfig(deviceId, alertConfig) {
  await update(ref(db, `devices/${deviceId}/alerts`), alertConfig);
}
