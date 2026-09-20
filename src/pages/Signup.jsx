// ============================================================
// pages/Signup.jsx — User Registration Page
// ============================================================
// Handles email/password signup via Firebase Auth.
// Redirects to Dashboard on success.
// ============================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../firebase/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (!username.trim()) {
      setError("Please provide a username.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signupUser(email, password, username.trim());
      navigate("/verify-email");
    } catch (err) {
      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please login or use a different email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
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
          <p>Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="login-form">
            <div className="field-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              required
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Link to Login */}
        <p className="login-footer">
          Already have an account?{" "}
          <Link to="/login" className="link-primary">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
