// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — FULL SOC CONTROL (PHASE 1 CLEAN)
//
// RULES ENFORCED:
// - NO topbar (handled globally)
// - Sidebar + content only
// - Scroll-safe
// - Advisor usable
// - No AI branding text

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

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
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Admin SOC
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end onClick={() => setMenuOpen(false)}>
            Security Posture
          </NavLink>

          <NavLink to="/admin/assets" onClick={() => setMenuOpen(false)}>
            Assets & Inventory
          </NavLink>

          <NavLink to="/admin/threats" onClick={() => setMenuOpen(false)}>
            Threats
          </NavLink>

          <NavLink to="/admin/incidents" onClick={() => setMenuOpen(false)}>
            Incidents
          </NavLink>

          <NavLink to="/admin/vulnerabilities" onClick={() => setMenuOpen(false)}>
            Vulnerabilities
          </NavLink>

          <NavLink to="/admin/compliance" onClick={() => setMenuOpen(false)}>
            Compliance
          </NavLink>

          <NavLink to="/admin/policies" onClick={() => setMenuOpen(false)}>
            Policies
          </NavLink>

          <NavLink to="/admin/reports" onClick={() => setMenuOpen(false)}>
            Reports
          </NavLink>

          <NavLink to="/admin/trading" onClick={() => setMenuOpen(false)}>
            Trading Oversight
          </NavLink>

          <NavLink to="/admin/notifications" onClick={() => setMenuOpen(false)}>
            Notifications
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          <NavLink to="/manager" onClick={() => setMenuOpen(false)}>
            Manager View
          </NavLink>

          <NavLink to="/company" onClick={() => setMenuOpen(false)}>
            Company View
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

        {/* ================= ADVISOR DRAWER ================= */}
        <section
          className={`ai-drawer ${assistantOpen ? "open" : ""}`}
          aria-hidden={!assistantOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAssistantOpen(v => !v)}
            >
              {assistantOpen ? "▼ Hide Advisor" : "▲ Show Advisor"}
            </button>
          </div>

          <div
            className="ai-drawer-body"
            style={{ overflow: "auto" }} // 🔑 FIX: allow scroll + input
          >
            <AuthoDevPanel
              title="Security Advisor"
              getContext={() => ({
                role: "admin",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
