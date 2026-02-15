// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — Institutional Visibility SOC (STABILIZED)
// Clean relative routing
// No cross-role leakage
// Standard / Focus / Command modes preserved
// Scroll-safe

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState("standard");
  // standard | focus | command

  const isCommand = layoutMode === "command";
  const isFocus = layoutMode === "focus";

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function cycleLayoutMode() {
    setLayoutMode((prev) => {
      if (prev === "standard") return "focus";
      if (prev === "focus") return "command";
      return "standard";
    });
  }

  return (
    <div
      className={`layout-root ${
        menuOpen ? "sidebar-open" : ""
      } layout-${layoutMode}`}
    >

      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && !isCommand && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      {!isCommand && (
        <aside
          className={`layout-sidebar company ${
            isFocus ? "collapsed" : ""
          }`}
        >
          <div className="layout-brand">
            <Logo size="md" />
            <span className="muted" style={{ fontSize: 12 }}>
              Company SOC
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

            <NavLink to="notifications" onClick={closeMenu}>
              Notifications
            </NavLink>

          </nav>

          <button className="btn logout-btn" onClick={logout}>
            Log out
          </button>
        </aside>
      )}

      {/* ================= MAIN ================= */}
      <main
        className={`layout-main ${
          isCommand ? "command-main" : ""
        }`}
      >

        {/* ===== MODE SWITCHER ===== */}
        <div className="layout-mode-toggle" style={{ padding: 16 }}>
          <button className="btn small" onClick={cycleLayoutMode}>
            {layoutMode === "standard" && "Switch to Focus"}
            {layoutMode === "focus" && "Switch to Command"}
            {layoutMode === "command" && "Back to Standard"}
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <section
          className={`layout-content ${
            isCommand ? "command-content" : ""
          }`}
        >
          <Outlet />
        </section>

        {/* ================= ADVISOR ================= */}
        {!isCommand && (
          <section
            className={`ai-drawer ${
              advisorOpen ? "open" : ""
            }`}
          >
            <div className="ai-drawer-handle">
              <button
                className="ai-toggle"
                onClick={() => setAdvisorOpen(v => !v)}
              >
                {advisorOpen
                  ? "▼ Hide Advisor"
                  : "▲ Show Security Advisor"}
              </button>
            </div>

            <div className="ai-drawer-body">
              <AuthoDevPanel
                title="Company Security Advisor"
                getContext={() => ({
                  role: "company",
                  mode: layoutMode,
                  location: window.location.pathname,
                })}
              />
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
