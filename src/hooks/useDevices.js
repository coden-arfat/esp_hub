// ============================================================
// hooks/useDevices.js — All User Devices Live Hook
// ============================================================
// Fetches all devices belonging to the logged-in user.
// Updates live when any device changes in Firebase.
//
// Usage:
//   const { devices, loading } = useDevices();
// ============================================================

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { subscribeToUserDevices } from "../firebase/database";
import { DEMO_DEVICE } from "../utils/demoData";

export function useDevices() {
  const { user, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to resolve first
    if (authLoading) return;

    // If there's no signed-in user, show the demo device
    if (!user) {
      setDevices([DEMO_DEVICE]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserDevices(user.uid, (data) => {
      if (!data || data.length === 0) {
        setDevices([DEMO_DEVICE]);
      } else {
        setDevices(data);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [user, authLoading]);

  return { devices, loading };
}
