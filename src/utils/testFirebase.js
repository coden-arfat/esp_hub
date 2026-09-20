// ============================================================
// utils/testFirebase.js — Firebase Connection Test
// ============================================================
// Tests Firebase initialization, auth, and database connectivity
// ============================================================

import { auth, db } from "../firebase/config";
import { signInAnonymously, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";

/**
 * Test Firebase connection
 * @returns {Promise<Object>} Test results with status and details
 */
export async function testFirebaseConnection() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {
      firebaseApp: null,
      auth: null,
      database: null,
    },
    summary: "",
  };

  try {
    // ─── Test 1: Firebase App Initialization ─────────────────
    try {
      if (auth && db) {
        results.tests.firebaseApp = {
          status: "✅ OK",
          message: "Firebase app initialized successfully",
        };
      } else {
        throw new Error("Auth or DB not initialized");
      }
    } catch (err) {
      results.tests.firebaseApp = {
        status: "❌ FAILED",
        message: err.message,
      };
    }

    // ─── Test 2: Firebase Auth ───────────────────────────────
    try {
      // Try anonymous sign-in and sign-out
      const anonUser = await signInAnonymously(auth);
      await signOut(auth);
      results.tests.auth = {
        status: "✅ OK",
        message: "Firebase Auth working (anonymous sign-in/out successful)",
      };
    } catch (err) {
      results.tests.auth = {
        status: "❌ FAILED",
        message: `Auth error: ${err.message}`,
      };
    }

    // ─── Test 3: Firebase Realtime Database ──────────────────
    try {
      // Try to read from a test path
      const testRef = ref(db, ".info/connected");
      const snapshot = await get(testRef);
      const isConnected = snapshot.val();
      results.tests.database = {
        status: isConnected ? "✅ OK" : "⚠️ DISCONNECTED",
        message: isConnected
          ? "Firebase Realtime Database connected"
          : "Database connection state is offline",
      };
    } catch (err) {
      results.tests.database = {
        status: "❌ FAILED",
        message: `Database error: ${err.message}`,
      };
    }

    // ─── Summary ─────────────────────────────────────────────
    const allPassed = Object.values(results.tests).every(
      (test) => test && test.status.includes("✅")
    );
    results.summary = allPassed
      ? "🎉 All tests passed! Firebase is properly configured."
      : "⚠️ Some tests failed. Check the details above.";

    return results;
  } catch (err) {
    results.summary = `❌ Unexpected error: ${err.message}`;
    return results;
  }
}

/**
 * Print test results in a readable format
 * @param {Object} results Test results from testFirebaseConnection()
 */
export function printTestResults(results) {
  console.group("🔧 Firebase Connection Test");
  console.log(`Timestamp: ${results.timestamp}`);
  console.log("─".repeat(50));

  Object.entries(results.tests).forEach(([name, test]) => {
    if (test) {
      console.log(`\n${name.toUpperCase()}:`);
      console.log(`  ${test.status}`);
      console.log(`  ${test.message}`);
    }
  });

  console.log("\n" + "─".repeat(50));
  console.log(results.summary);
  console.groupEnd();
}
