// ============================================================
// firebase/config.js - Firebase initialization
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyClR6JtT1s8O8rPpUH1H3sS3m2A4SvwuFs",
  authDomain: "test-8bc81.firebaseapp.com",
  databaseURL: "https://test-8bc81-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-8bc81",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);