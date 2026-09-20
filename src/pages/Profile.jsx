// ============================================================
// pages/Profile.jsx — User Profile Editing
// ============================================================
// Allows the current user to update their display name,
// view verification status, and resend the verification email.
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  updateUserProfile,
  resendVerificationEmail,
  reloadCurrentUser,
} from "../firebase/auth";
import Spinner from "../components/Spinner";

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
      return;
    }
    setDisplayName(user?.displayName || "");
  }, [user, loading, navigate]);

  if (loading) return <Spinner label="Loading profile..." />;

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);
    try {
      await updateUserProfile({ displayName: displayName.trim() });
      setStatus("Profile updated successfully.");
    } catch (err) {
      setError("Unable to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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
      setStatus("Verification status refreshed.");
    } catch (err) {
      setError("Unable to refresh verification status.");
      setStatus("");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Update your account display name and verification settings.</p>
        </div>
      </div>

      <section className="section profile-section">
        <form onSubmit={handleSave} className="profile-form">
          <div className="field-group">
            <label>Email</label>
            <input value={user?.email || ""} readOnly />
          </div>

          <div className="field-group">
            <label>Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>

          <div className="field-group">
            <label>Email Verified</label>
            <input value={user?.emailVerified ? "Yes" : "No"} readOnly />
          </div>

          {status && <p className="info-text">{status}</p>}
          {error && <p className="error-text">{error}</p>}

          <div className="profile-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {!user?.emailVerified && (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResend}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Resend Verification Email"}
                </button>
                <button type="button" className="btn-secondary" onClick={handleRefresh}>
                  Refresh Status
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
