import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${open ? "sidebar-open" : ""}`}>
      {/* ---------- Mobile Overlay ---------- */}
      <div
        className="sidebar-overlay"
        onClick={() => setOpen(false)}
      />

      {/* ---------- Sidebar ---------- */}
      <aside className="layout-sidebar company">
        <div className="layout-brand">
          <span className="brand-logo">🏢</span>
          <span className="brand-text">Company View</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/company" end onClick={() => setOpen(false)}>
            Overview
          </NavLink>
          <NavLink to="/company/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="layout-main">
        <header className="layout-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="topbar-left">
            <h1>Company Dashboard</h1>
          </div>

          <div className="topbar-right">
            <span className="role-badge company">Company</span>
          </div>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
