// ============================================================
// hooks/useDevice.js — Single Device Live Data Hook
// ============================================================
// Subscribes to a device in Firebase and returns live data.
// Automatically cleans up listener when component unmounts.
//
// Usage:
//   const { device, loading } = useDevice("device_001");
// ============================================================

import { useState, useEffect } from "react";
import { subscribeToDevice } from "../firebase/database";
import { DEMO_DEVICE_ID, DEMO_DEVICE } from "../utils/demoData";
import { useAuth } from "./useAuth";

export function useDevice(deviceId) {
  const { user, loading: authLoading } = useAuth();
  const [device, setDevice]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId || authLoading) return;

    // The public /demo route uses local data; signed-in demo devices are live Firebase data.
    if (!user && deviceId === DEMO_DEVICE_ID) {
      setDevice(DEMO_DEVICE);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToDevice(deviceId, (data) => {
      setDevice(data);
      setLoading(false);
    });
    return unsubscribe; // Cleanup on unmount
  }, [deviceId, user, authLoading]);

  return { device, loading };
}
