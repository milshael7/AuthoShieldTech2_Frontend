import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/layout.css";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="layout-root">
      {/* ---------- Mobile Overlay ---------- */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 9,
          }}
        />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside
        className="layout-sidebar"
        style={{
          zIndex: 10,
          transform:
            open || window.innerWidth > 768
              ? "translateX(0)"
              : "translateX(-100%)",
          transition: "transform .25s ease",
          position: window.innerWidth <= 768 ? "fixed" : "relative",
          height: window.innerWidth <= 768 ? "100svh" : "auto",
        }}
      >
        <div className="layout-brand">
          <strong>AutoShield</strong>
          <span>Admin Console</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end onClick={() => setOpen(false)}>
            Global Security
          </NavLink>
          <NavLink to="/admin/trading" onClick={() => setOpen(false)}>
            Trading
          </NavLink>
          <NavLink to="/manager" onClick={() => setOpen(false)}>
            Manager View
          </NavLink>
          <NavLink to="/company" onClick={() => setOpen(false)}>
            Company View
          </NavLink>
          <NavLink to="/admin/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
        </nav>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="layout-main">
        <header className="layout-topbar">
          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(true)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>

          <h1>Admin Dashboard</h1>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </main>

      {/* ---------- Mobile button visibility ---------- */}
      <style>{`
        @media (max-width: 768px){
          .mobile-menu-btn{
            display:block;
          }
        }
      `}</style>
    </div>
  );
}
