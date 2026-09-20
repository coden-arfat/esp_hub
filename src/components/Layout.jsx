// ============================================================
// components/Layout.jsx — App Shell (Sidebar + Content)
// ============================================================
// Wraps all authenticated pages with:
//   - Sidebar navigation
//   - Top bar with user info & logout
//   - Notification badge
// <Outlet /> renders the current page content.
// ============================================================

import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth }    from "../hooks/useAuth";
import { logoutUser } from "../firebase/auth";

const NAV_ITEMS = [
  { to: "/",        label: "Dashboard",  icon: "📊", end: true },
  { to: "/history", label: "History",    icon: "📈" },
  { to: "/manage",  label: "Devices",    icon: "🔌" },
  { to: "/about",   label: "About",      icon: "❓" },
  { to: "/profile", label: "Profile",    icon: "👤" },
];

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logoutUser();
    navigate("/login");
  }

  return (
    <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}>
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <div className="mobile-brand">ESP Hub</div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">ESP Hub</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item--active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
          <div className="nav-section">
            <span className="nav-section-title">AI Mode</span>
            <NavLink
              to="/voice"
              className={({ isActive }) => `nav-item nav-item--nested ${isActive ? "nav-item--active" : ""}`}
            >
              <span className="nav-icon">🎙️</span>
              <span className="nav-label">Voice Control</span>
            </NavLink>
            <NavLink
              to="/gesture"
              className={({ isActive }) => `nav-item nav-item--nested ${isActive ? "nav-item--active" : ""}`}
            >
              <span className="nav-icon">✋</span>
              <span className="nav-label">Gesture Control</span>
            </NavLink>
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="sidebar-footer">
          <p className="sidebar-email">{user?.displayName || user?.email}</p>
          <button onClick={handleLogout} className="btn-logout">
            Sign Out
          </button>
        </div>
      </aside>

      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}

      {/* ── Main Content ── */}
      <main className="main-content" onClick={() => menuOpen && setMenuOpen(false)}>
        <Outlet />
      </main>
    </div>
  );
}
