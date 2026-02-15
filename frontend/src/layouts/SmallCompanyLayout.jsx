// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — Institutional Baseline (STABILIZED)
// Clean relative routing
// Role-contained
// Scroll-safe
// Upgrade path preserved

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>

      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar small-company">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Small Company SOC
          </span>
        </div>

        <nav className="layout-nav">

          <NavLink to="." end onClick={closeMenu}>
            Security Overview
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

          <NavLink to="reports" onClick={closeMenu}>
            Reports
          </NavLink>

          <hr style={{ opacity: 0.2 }} />

          <NavLink
            to="upgrade"
            className="upgrade-link"
            onClick={closeMenu}
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
