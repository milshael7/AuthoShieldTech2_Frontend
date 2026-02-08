// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — SOC Baseline (Assistant is secondary, bottom-only)

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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
          <span className="brand-logo">🏢</span>
          <span className="brand-text">Company</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/company" end onClick={() => setMenuOpen(false)}>
            Security Overview
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

            <h1 style={{ margin: 0 }}>Company Security Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAiOpen((v) => !v)}
              title="Ask the security assistant"
            >
              🤖 Assistant
            </button>

            <span className="badge">Company</span>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= AI ASSISTANT (BOTTOM ONLY) ================= */}
        <section
          className={`ai-drawer ${aiOpen ? "open" : ""}`}
          aria-hidden={!aiOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAiOpen((v) => !v)}
            >
              {aiOpen ? "▼ Hide Assistant" : "▲ Ask Security Assistant"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AuthoDev 6.5 — Company Security Advisor"
              getContext={() => ({
                role: "company",
                scope: "company",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
