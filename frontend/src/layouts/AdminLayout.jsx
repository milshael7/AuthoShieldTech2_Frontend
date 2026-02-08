import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

/**
 * AdminLayout.jsx
 * STEP 32 — Sliding AI Panel Shell (Admin)
 *
 * ✅ Fixed background (sidebar + topbar)
 * ✅ Page content scrolls independently
 * ✅ AI panel slides up / down
 * ✅ Mobile + desktop safe
 * ❌ No AI logic changed
 * ❌ No backend changes
 */

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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
      <aside className="layout-sidebar">
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

            <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAiOpen((v) => !v)}
              title="Toggle AI Assistant"
            >
              🤖 AI
            </button>
            <span className="badge">Admin</span>
          </div>
        </header>

        {/* ---------- Page Content (scrolls) ---------- */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ---------- Sliding AI Panel ---------- */}
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
              title="AuthoDev 6.5 — Admin Assistant"
              getContext={() => ({
                role: "admin",
                room: "admin",
              })}
            />
          </div>
        </section>
      </main>

      {/* ---------- Local Styles ---------- */}
      <style>{`
        .ai-drawer {
          position: sticky;
          bottom: 0;
          width: 100%;
          background: rgba(10, 14, 22, 0.98);
          border-top: 1px solid rgba(255,255,255,.12);
          transition: transform .35s ease;
          transform: translateY(calc(100% - 48px));
          z-index: 20;
        }

        .ai-drawer.open {
          transform: translateY(0);
        }

        .ai-drawer-handle {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .ai-toggle {
          background: none;
          border: none;
          font-weight: 700;
          color: #7aa2ff;
          cursor: pointer;
        }

        .ai-drawer-body {
          height: min(70vh, 520px);
          padding: 12px;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .ai-drawer-body {
            height: 420px;
          }
        }
      `}</style>
    </div>
  );
}
