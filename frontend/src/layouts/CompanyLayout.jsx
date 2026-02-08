// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — SOC-aligned, assistant-only AI

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${open ? "sidebar-open" : ""}`}>
      {/* ---------- Mobile Overlay ---------- */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside className="layout-sidebar company">
        <div className="layout-brand">
          <span className="brand-logo">🏢</span>
          <span className="brand-text">Company</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/company" end onClick={() => setOpen(false)}>
            Overview
          </NavLink>
          <NavLink
            to="/company/notifications"
            onClick={() => setOpen(false)}
          >
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="layout-main">
        {/* ---------- Topbar ---------- */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 style={{ margin: 0 }}>Company Dashboard</h1>
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

        {/* ---------- Page Content ---------- */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ---------- Bottom AI Assistant (NOT main content) ---------- */}
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
              title="AuthoDev 6.5 — Company Security Assistant"
              getContext={() => ({
                role: "company",
                scope: "company",
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
