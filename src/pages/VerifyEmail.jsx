// ============================================================
// pages/VerifyEmail.jsx — Email Verification Status Page
// ============================================================
// Shows when a verified user is required to access the app.
// Allows resending the verification email and refreshing status.
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  resendVerificationEmail,
  reloadCurrentUser,
  logoutUser,
} from "../firebase/auth";

export default function VerifyEmail() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
    } else if (user.emailVerified) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  async function handleResend() {
    setError("");
    setStatus("Sending verification email...");
    setSending(true);
    try {
      await resendVerificationEmail();
      setStatus("Verification email sent. Check your inbox.");
    } catch (err) {
      setError("Unable to send verification email. Please try again later.");
      setStatus("");
    } finally {
      setSending(false);
    }
  }

  async function handleRefresh() {
    setError("");
    setStatus("Refreshing verification status...");
    try {
      await reloadCurrentUser();
      setStatus("Status refreshed. If your email is verified, you will be redirected shortly.");
    } catch (err) {
      setError("Unable to refresh verification status.");
      setStatus("");
    }
  }

  async function handleSignOut() {
    await logoutUser();
    navigate("/login", { replace: true });
  }

  if (loading || !user) {
    return <div className="app-loading">Checking account status...</div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="login-header">
          <div className="login-logo">📧</div>
          <h1>Email Verification Required</h1>
          <p>
            A verification link was sent to <strong>{user.email}</strong>. Please verify your email to access your devices.
          </p>
        </div>

        <div className="email-verify-actions">
          {status && <p className="info-text">{status}</p>}
          {error && <p className="error-text">{error}</p>}

          <button className="btn-primary" onClick={handleResend} disabled={sending}>
            {sending ? "Resending..." : "Resend Verification Email"}
          </button>
          <button className="btn-secondary" onClick={handleRefresh}>
            Refresh Verification Status
          </button>
          <button className="btn-danger" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
