// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — Locked
// ✅ Sidebar + topbar fixed
// ✅ Page scrolls independently
// ✅ ONE bottom AI assistant drawer
// ❌ No floating AI
// ❌ No inline AI styles

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function ManagerLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* ---------- Mobile Overlay ---------- */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <span className="brand-logo">🛡️</span>
          <span className="brand-text">Manager View</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/manager" end onClick={() => setSidebarOpen(false)}>
            Overview
          </NavLink>
          <NavLink to="/manager/companies" onClick={() => setSidebarOpen(false)}>
            Companies
          </NavLink>
          <NavLink to="/manager/users" onClick={() => setSidebarOpen(false)}>
            Users
          </NavLink>
          <NavLink to="/manager/posture" onClick={() => setSidebarOpen(false)}>
            Security Posture
          </NavLink>
          <NavLink to="/manager/audit" onClick={() => setSidebarOpen(false)}>
            Audit Logs
          </NavLink>
          <NavLink to="/manager/notifications" onClick={() => setSidebarOpen(false)}>
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
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1 style={{ margin: 0 }}>Manager Oversight Room</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAiOpen((v) => !v)}
              title="Toggle AI Assistant"
            >
              🤖 AI
            </button>
            <span className="badge">Read-only</span>
          </div>
        </header>

        {/* ---------- Page Content ---------- */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ---------- AI Assistant Drawer (ONLY ONE) ---------- */}
        <section
          className={`ai-drawer ${aiOpen ? "open" : ""}`}
          aria-hidden={!aiOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAiOpen((v) => !v)}
            >
              {aiOpen ? "▼ Hide Assistant" : "▲ Show Assistant"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AuthoDev 6.5 — Manager Assistant"
              getContext={() => ({
                role: "manager",
                room: "manager",
                permissions: "read-only",
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
