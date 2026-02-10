// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — SOC Baseline (PHASE 1 CLEAN)
//
// ENFORCEMENT:
// - No topbar (global header only)
// - No AI branding
// - Advisory-only insights
// - Scroll-safe
// - Upgrade path preserved

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
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
      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar small-company">
        <div className="layout-brand">
          <Logo size="md" />
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            Small Company SOC
          </span>
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
        {/* ================= CONTENT ================= */}
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
              onClick={() => setInsightsOpen(v => !v)}
            >
              {insightsOpen
                ? "▼ Hide Security Insights"
                : "▲ Show Security Insights"}
            </button>
          </div>

          <div
            className="ai-drawer-body"
            style={{ overflow: "auto" }} // 🔑 FIX: scrolling + typing
          >
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
