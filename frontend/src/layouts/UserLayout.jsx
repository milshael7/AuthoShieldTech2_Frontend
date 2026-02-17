// frontend/src/layouts/UserLayout.jsx
// Individual User Layout — ENTERPRISE-STYLE DOCKED ADVISOR
// Sticky right advisor
// True collapse (content expands)
// Unified system architecture

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function UserLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Advisor state (persist per user room)
  const [advisorOpen, setAdvisorOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("as_advisor_open_user");
      if (raw === "0") setAdvisorOpen(false);
    } catch {}
  }, []);

  function setAdvisor(next) {
    setAdvisorOpen(next);
    try {
      localStorage.setItem(
        "as_advisor_open_user",
        next ? "1" : "0"
      );
    } catch {}
  }

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && (
        <div className="sidebar-overlay" onClick={closeMenu} />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar user">
        <div className="layout-brand">
          <Logo size="sm" />
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            Personal Security
          </span>
        </div>

        <nav className="layout-nav">

          <NavLink to="." end onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="notifications" onClick={closeMenu}>
            Notifications
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            My Reports
          </NavLink>

        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN + ADVISOR ================= */}
      <div className="enterprise-main">
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* RIGHT ADVISOR DOCK */}
        <aside className={`enterprise-ai-panel ${advisorOpen ? "open" : "collapsed"}`}>
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title=""
              getContext={() => ({
                role: "user",
                scope: "individual-only",
                access: "no-global-visibility",
                location: window.location.pathname,
              })}
            />
          </div>
        </aside>
      </div>

      {/* FLOATING TOGGLE */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisor(!advisorOpen)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "AuthoShield Advisor"}
      </button>
    </div>
  );
}
