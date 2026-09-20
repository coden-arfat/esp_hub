// ============================================================
// pages/Login.jsx — Authentication Page
// ============================================================
// Handles email/password login via Firebase Auth.
// Redirects to Dashboard on success.
// To add Google/GitHub login: see firebase/auth.js
// ============================================================

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser } from "../firebase/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const verificationMessage = location.state?.verificationMessage;

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      if (!user.emailVerified) {
        navigate("/verify-email");
        return;
      }
      navigate("/");
    } catch (err) {
      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <h1>ESP Dashboard</h1>
          <p>Sign in to manage your devices</p>
          {verificationMessage && (
            <p className="info-text">{verificationMessage}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="link-primary">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
