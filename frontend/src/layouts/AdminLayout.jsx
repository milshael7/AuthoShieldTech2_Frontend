// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — SUPREME CONTROL ARCHITECTURE
// - Admin has full override power
// - Structured Manager / Trading / Global grouping
// - Sticky Advisor Dock (true collapse)
// - Clean enterprise navigation hierarchy

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(true);
  const [globalOpen, setGlobalOpen] = useState(true);

  /* ================= ADVISOR STATE ================= */

  useEffect(() => {
    try {
      const raw = localStorage.getItem("as_advisor_open");
      if (raw === "0") setAdvisorOpen(false);
    } catch {}
  }, []);

  function setAdvisor(next) {
    setAdvisorOpen(next);
    try {
      localStorage.setItem("as_advisor_open", next ? "1" : "0");
    } catch {}
  }

  /* ================= LOGOUT ================= */

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  /* ================= UI ================= */

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Supreme Admin
          </span>
        </div>

        <nav className="layout-nav">

          {/* ===== ADMIN CORE SYSTEM ===== */}
          <NavLink to="." end onClick={closeMenu}>
            Security Posture
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Assets
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Threats
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Incidents
          </NavLink>

          <NavLink to="vulnerabilities" onClick={closeMenu}>
            Vulnerabilities
          </NavLink>

          <NavLink to="vulnerability-center" onClick={closeMenu}>
            Vulnerability Center
          </NavLink>

          <NavLink to="compliance" onClick={closeMenu}>
            Compliance
          </NavLink>

          <NavLink to="policies" onClick={closeMenu}>
            Policies
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Reports
          </NavLink>

          <NavLink to="notifications" onClick={closeMenu}>
            Notifications
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* ===== MANAGER CONTROL ROOM ===== */}
          <div className="nav-section-label">
            Operational Oversight
          </div>

          <NavLink to="/manager" onClick={closeMenu}>
            Manager Control Room
          </NavLink>

          {/* ===== TRADING ROOM ===== */}
          <NavLink to="trading" onClick={closeMenu}>
            Trading Room
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* ===== GLOBAL OVERSIGHT GROUP ===== */}
          <div
            className="nav-section-label clickable"
            onClick={() => setGlobalOpen(v => !v)}
          >
            Global Oversight {globalOpen ? "▾" : "▸"}
          </div>

          {globalOpen && (
            <>
              <NavLink to="/company" onClick={closeMenu}>
                Global Companies
              </NavLink>

              <NavLink to="/small-company" onClick={closeMenu}>
                Global Small Companies
              </NavLink>

              <NavLink to="/user" onClick={closeMenu}>
                Global Users
              </NavLink>
            </>
          )}

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

        {/* ===== STICKY ADVISOR DOCK ===== */}
        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "open" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title=""
              getContext={() => ({
                role: "admin",
                location: window.location.pathname,
                scope: "global-visibility",
                access: "full-override",
                authority: "supreme",
              })}
            />
          </div>
        </aside>

      </div>

      {/* ===== FLOATING TOP-RIGHT TOGGLE ===== */}
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
