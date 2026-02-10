// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — SOC Visibility Baseline
//
// ENFORCEMENT:
// - Visibility only
// - No compliance / policy control
// - No AutoDev execution
// - Advisory-only assistant
// - Upgrade path exists (notifications only)
//
// SAFE:
// - Full file replacement
// - Default export (Vercel-safe)
// - layout.css aligned
// - No AI wording

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>
      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar company">
        <div className="layout-brand">
          <strong>AutoShield Tech</strong>
          <small className="muted">Company Visibility</small>
        </div>

        <nav className="layout-nav">
          <NavLink to="/company" end onClick={() => setMenuOpen(false)}>
            Security Overview
          </NavLink>

          <NavLink to="/company/assets" onClick={() => setMenuOpen(false)}>
            Assets
          </NavLink>

          <NavLink to="/company/threats" onClick={() => setMenuOpen(false)}>
            Threats
          </NavLink>

          <NavLink to="/company/incidents" onClick={() => setMenuOpen(false)}>
            Incidents
          </NavLink>

          <NavLink to="/company/reports" onClick={() => setMenuOpen(false)}>
            Reports
          </NavLink>

          <NavLink
            to="/company/notifications"
            onClick={() => setMenuOpen(false)}
          >
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        {/* ================= TOPBAR ================= */}
        <header className="layout-topbar">
          <button
            className="btn btn-icon mobile-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAdvisorOpen((v) => !v)}
            >
              Advisor
            </button>
            <span className="badge">Company</span>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= ADVISOR (VISIBILITY ONLY) ================= */}
        <section
          className={`ai-drawer ${advisorOpen ? "open" : ""}`}
          aria-hidden={!advisorOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAdvisorOpen((v) => !v)}
            >
              {advisorOpen
                ? "▼ Hide Advisor"
                : "▲ Show Security Advisor"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AutoDev 6.5 — Company Security Advisor"
              getContext={() => ({
                role: "company",
                mode: "advisory",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
