// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — SOC Baseline (LIMITED)
// - No AutoDev access
// - Limited SOC visibility
// - Upgrade path to full Company
// - Structural parity with other layouts
// - Assistant shell allowed (NO AI naming)

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function SmallCompanyLayout() {
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
      <aside className="layout-sidebar company small">
        <div className="layout-brand">
          <span className="brand-logo">🏬</span>
          <span className="brand-text">Small Company</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/small-company" end onClick={() => setMenuOpen(false)}>
            Security Overview
          </NavLink>

          <NavLink
            to="/small-company/assets"
            onClick={() => setMenuOpen(false)}
          >
            Assets
          </NavLink>

          <NavLink
            to="/small-company/threats"
            onClick={() => setMenuOpen(false)}
          >
            Threats
          </NavLink>

          <NavLink
            to="/small-company/incidents"
            onClick={() => setMenuOpen(false)}
          >
            Incidents
          </NavLink>

          <NavLink
            to="/small-company/reports"
            onClick={() => setMenuOpen(false)}
          >
            Reports
          </NavLink>

          <hr style={{ opacity: 0.2 }} />

          {/* UPGRADE CTA */}
          <NavLink
            to="/small-company/upgrade"
            className="upgrade-link"
            onClick={() => setMenuOpen(false)}
          >
            🚀 Upgrade to Company
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        {/* ================= TOP BAR ================= */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 style={{ margin: 0 }}>Small Company Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAdvisorOpen((v) => !v)}
              title="Toggle Security Advisor"
            >
              🛡️ Advisor
            </button>

            <span className="badge">Limited</span>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= ADVISOR DRAWER (BOTTOM ONLY) ================= */}
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
                ? "▼ Hide Security Advisor"
                : "▲ Show Security Advisor"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AutoDev 6.5 — Security Advisor"
              getContext={() => ({
                role: "small-company",
                scope: "limited-soc",
                permissions: "visibility-only",
                upgradeAvailable: true,
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
