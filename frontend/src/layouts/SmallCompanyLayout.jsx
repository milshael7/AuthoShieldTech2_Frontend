// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — SOC Baseline (LIMITED)
//
// ENFORCEMENT:
// - No AutoDev execution
// - No AI branding
// - Advisory-only insights
// - Upgrade path to full Company
// - Structural parity with other layouts

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function SmallCompanyLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar small-company">
        <div className="layout-brand">
          <strong>AutoShield</strong>
          <span>Small Company SOC</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/small-company" end onClick={() => setMenuOpen(false)}>
            Security Overview
          </NavLink>

          <NavLink to="/small-company/assets" onClick={() => setMenuOpen(false)}>
            Assets
          </NavLink>

          <NavLink to="/small-company/threats" onClick={() => setMenuOpen(false)}>
            Threats
          </NavLink>

          <NavLink to="/small-company/incidents" onClick={() => setMenuOpen(false)}>
            Incidents
          </NavLink>

          <NavLink to="/small-company/reports" onClick={() => setMenuOpen(false)}>
            Reports
          </NavLink>

          <hr style={{ opacity: 0.2 }} />

          <NavLink
            to="/small-company/upgrade"
            className="upgrade-link"
            onClick={() => setMenuOpen(false)}
          >
            Upgrade to Company
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
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
              onClick={() => setInsightsOpen((v) => !v)}
              title="Toggle security insights"
            >
              Insights
            </button>

            <span className="badge">Limited</span>
          </div>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= INSIGHTS DRAWER ================= */}
        <section
          className={`ai-drawer ${insightsOpen ? "open" : ""}`}
          aria-hidden={!insightsOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setInsightsOpen((v) => !v)}
            >
              {insightsOpen
                ? "▼ Hide Security Insights"
                : "▲ Show Security Insights"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="Security Insights"
              getContext={() => ({
                role: "small_company",
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
