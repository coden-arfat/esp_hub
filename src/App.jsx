// ============================================================
// App.jsx — Root Component & Route Definitions
// ============================================================
// All page routes are defined here.
// To add a new page: import it, add a <Route> below.
// Protected routes require Firebase Auth (see hooks/useAuth.js)
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Login         from "./pages/Login";
import Signup        from "./pages/Signup";
import Dashboard     from "./pages/Dashboard";
import DeviceDetail  from "./pages/DeviceDetail";
import History       from "./pages/History";
import DeviceManager from "./pages/DeviceManager";
import Profile       from "./pages/Profile";
import About         from "./pages/About";
import VerifyEmail   from "./pages/VerifyEmail";
import GestureControl from "./pages/GestureControl";
import VoiceControl   from "./pages/VoiceControl";
import Layout        from "./components/Layout";

// ─── Protected Route Wrapper ────────────────────────────────
// Redirects unauthenticated users to /login and unverified users to verify page
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Initializing...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  return children;
}

// ─── App Routes ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Demo (public) — shows the sample device without signing in */}
        <Route path="/demo" element={<Dashboard />} />

        {/* Protected — all inside shared Layout */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
           </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="device/:deviceId" element={<DeviceDetail />} />
          <Route path="history" element={<History />} />
          <Route path="manage" element={<DeviceManager />} />
          <Route path="about" element={<About />} />
          <Route path="profile" element={<Profile />} />
          <Route path="gesture" element={<GestureControl />} />
          <Route path="voice" element={<VoiceControl />} />
        </Route>

        {/* Email verification required */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
