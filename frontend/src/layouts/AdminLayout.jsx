import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/layout.css";

export default function AdminLayout() {
  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <strong>AutoShield</strong>
          <span>Admin Console</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end>Global Security</NavLink>
          <NavLink to="/admin/trading">Trading</NavLink>
          <NavLink to="/manager">Manager View</NavLink>
          <NavLink to="/company">Company View</NavLink>
          <NavLink to="/admin/notifications">Notifications</NavLink>
        </nav>
      </aside>

      <main className="layout-main">
        <header className="layout-topbar">
          <h1>Admin Dashboard</h1>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
