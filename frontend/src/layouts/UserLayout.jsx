import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";

export default function UserLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

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
          <span className="brand-logo">🛡️</span>
          <span className="brand-text">AutoShield</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/user/dashboard" onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/user/posture" onClick={() => setOpen(false)}>
            Security Posture
          </NavLink>
          <NavLink to="/user/projects" onClick={() => setOpen(false)}>
            AutoProtect
          </NavLink>
          <NavLink to="/user/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
          <NavLink to="/user/settings" onClick={() => setOpen(false)}>
            Settings
          </NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="layout-main">
        <header className="layout-topbar">
          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(true)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ☰
          </button>

          <div className="topbar-left">
            <h1>User Security Room</h1>
          </div>

          <div className="topbar-right">
            <span className="role-badge user">Individual</span>
          </div>
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
