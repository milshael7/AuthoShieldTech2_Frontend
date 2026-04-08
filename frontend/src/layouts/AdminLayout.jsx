// ==========================================================
// 🏢 ADMIN LAYOUT — v35.4 (FORCED RENDER & ROLE SYNC)
// FILE: src/layouts/AdminLayout.jsx
// ==========================================================

import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

// 🔑 CORE AUTH INTEGRATION
import { useAuth } from "../context/AuthContext.jsx";
import { useSecurity } from "../context/SecurityContext.jsx";

import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

const SIDEBAR_WIDTH = 260;
const ADVISOR_WIDTH = 380;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const securityCtx = useSecurity() || {};
  const systemStatus = securityCtx.systemStatus || "secure";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem("admin.advisor.open") !== "false";
  });

  // 🛡️ ROLE ALIGNMENT FIX (v35.4)
  // We normalize the role to lowercase to prevent "Admin" vs "admin" mismatches.
  const rawRole = String(user?.role || "guest").toLowerCase();
  
  // We check for 'admin' or 'manager' explicitly.
  const isAdmin = rawRole === "admin";
  const isManager = rawRole === "manager" || isAdmin;

  // DEBUG: Check your console in the browser to see what role is actually being received
  useEffect(() => {
    console.log("[AUTH_DEBUG]: User detected with role:", rawRole);
  }, [rawRole]);

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505", fontFamily: 'monospace' }}>

      {/* HEADER */}
      <header
        style={{
          height: 70,
          background: "#0b0f1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid rgba(0,255,136,0.1)",
          zIndex: 100
        }}
      >
        <Logo size="md" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              fontSize: '0.6rem', 
              color: '#00ff88',
              border: '1px solid #00ff88',
              padding: '4px 8px',
              borderRadius: '2px',
              letterSpacing: '1px'
            }}>
                {rawRole.toUpperCase()}_SESSION // SYS_ACTIVE
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "transparent", border: "none", color: "#00ff88", fontSize: 20, cursor: "pointer" }}
            >
              {sidebarOpen ? "«" : "»"}
            </button>
        </div>
      </header>

      {/* BODY ROW */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* LEFT SIDEBAR */}
        <nav
          style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
            minWidth: sidebarOpen ? SIDEBAR_WIDTH : 0,
            transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            background: "#080a0f",
            borderRight: sidebarOpen ? "1px solid rgba(255,255,255,.05)" : "none",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{ flex: 1, padding: 20, opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
            <div className="layout-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* CORE ROOMS - ALWAYS SHOW IF LOGGED IN */}
              <NavLink to="/admin" end className={navClass}>CORE_DASHBOARD</NavLink>
              
              <NavLink to="/admin/security" className={navClass}>SECURITY_INTEL</NavLink>
              
              {/* TRADING ROOM - FORCED VISIBILITY FOR ADMINS/MANAGERS */}
              {isManager && (
                <NavLink to="/admin/trading" className={navClass}>ALGO_TRADING</NavLink>
              )}

              {/* CONFIG ROOM - ADMIN ONLY */}
              {isAdmin && (
                <NavLink to="/admin/global" className={navClass}>GLOBAL_CONFIG</NavLink>
              )}
              
              <div style={{ margin: "25px 0", height: 1, background: "rgba(0,255,136,0.05)" }} />
              
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255,68,68,0.05)",
                  color: "#ff4444",
                  border: "1px solid rgba(255,68,68,0.2)",
                  cursor: "pointer",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                  letterSpacing: '1px'
                }}
              >
                TERMINATE_SESSION
              </button>
            </div>
          </div>
        </nav>

        {/* CENTER CONTENT */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#050505" }}>
          <div style={{ flex: 1, width: "100%", padding: "30px", overflowY: "auto" }}>
            <Outlet />
          </div>
        </main>

        {/* RIGHT ADVISOR */}
        <aside
          style={{
            width: advisorOpen ? ADVISOR_WIDTH : 0,
            transition: "width .3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            borderLeft: advisorOpen ? "1px solid rgba(255,255,255,.05)" : "none",
            background: "#080a0f"
          }}
        >
          {advisorOpen && (
            <AuthoDevPanel
              title="A.I. ADVISOR"
              getContext={() => ({
                user: user,
                role: rawRole,
                path: window.location.pathname
              })}
            />
          )}
        </aside>

        {/* ADVISOR TOGGLE */}
        <button
          onClick={() => {
            const next = !advisorOpen;
            setAdvisorOpen(next);
            localStorage.setItem("admin.advisor.open", next);
          }}
          style={{
            position: "absolute",
            right: advisorOpen ? ADVISOR_WIDTH : 0,
            top: "50%",
            transform: "translateY(-50%)",
            padding: "24px 4px",
            background: "#111",
            color: "#00ff88",
            border: "1px solid rgba(0,255,136,0.2)",
            borderRight: "none",
            borderRadius: "4px 0 0 4px",
            cursor: "pointer",
            fontSize: 9,
            writingMode: "vertical-rl",
            transition: "right .3s",
            zIndex: 10
          }}
        >
          {advisorOpen ? "CLOSE_ADVISOR" : "OPEN_ADVISOR"}
        </button>
      </div>
    </div>
  );
}
