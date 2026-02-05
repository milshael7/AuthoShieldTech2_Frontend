// frontend/src/layouts/CompanyLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <aside className="layout-sidebar company">
        <div className="layout-brand">
          <span className="brand-logo">🏢</span>
          <span className="brand-text">Company SOC</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/company/dashboard">Overview</NavLink>
          <NavLink to="/company/posture">Security Posture</NavLink>
          <NavLink to="/company/users">Members</NavLink>
          <NavLink to="/company/projects">Cases & Projects</NavLink>
          <NavLink to="/company/notifications">Notifications</NavLink>
          <NavLink to="/company/settings">Settings</NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* Main */}
      <main className="layout-main">
        {/* Top Bar */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <h1>Company Security Room</h1>
          </div>

          <div className="topbar-right">
            <span className="role-badge company">Company</span>
          </div>
        </header>

        {/* Content */}
        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
