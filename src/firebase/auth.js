// ============================================================
// firebase/auth.js — Authentication Functions
// ============================================================
// All Firebase Auth logic lives here.
// Import these functions in your pages/components.
// Never call Firebase Auth directly from UI components.
// ============================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  reload,
} from "firebase/auth";
import { auth } from "./config";

// ─── Sign Up ──────────────────────────────────────────────────
// Sends a verification email after account creation.
export async function signupUser(email, password, displayName = "") {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  await sendEmailVerification(result.user);
  return result.user;
}

// ─── Login ───────────────────────────────────────────────────
// Returns: authenticated user. Email verification is enforced by route guards.
export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// ─── Logout ──────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ─── Email Verification ──────────────────────────────────────
export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");
  await sendEmailVerification(user);
}

export async function reloadCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");
  await reload(user);
  return auth.currentUser;
}

export async function updateUserProfile(updates) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");
  await updateProfile(user, updates);
  return auth.currentUser;
}

// ─── Auth State Observer ─────────────────────────────────────
// Used by useAuth hook — do not call directly in components
// callback receives: user object | null
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
