// ============================================================
// hooks/useAuth.js — Authentication State Hook
// ============================================================
// Provides current user & loading state to any component.
// Usage:
//   const { user, loading } = useAuth();
//   if (loading) return <Spinner />;
//   if (!user) return <Navigate to="/login" />;
// ============================================================

import { useState, useEffect } from "react";
import { onAuthChange } from "../firebase/auth";

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state — unsubscribes on unmount
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
