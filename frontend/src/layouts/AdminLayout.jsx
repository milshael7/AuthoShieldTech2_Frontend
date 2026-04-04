// ==========================================================
// 🏢 ADMIN LAYOUT — v35.0 (VERCEL-ALIGNED & SHELL-HARDENED)
// FILE: src/layouts/AdminLayout.jsx
// ==========================================================

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
// ✅ FIXED: api is the default export; named helpers stay in braces
import api, { clearToken, clearUser, getToken } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

const SIDEBAR_WIDTH = 260;
const ADVISOR_WIDTH = 380;

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const { systemStatus } = useSecurity();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  // 🛡️ AUTH GUARD: Prevent "Shell Layer Crash" on 401s
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.replace("/login");
      return;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    // Using replace to clear the history stack and prevent back-button loops
    window.location.replace("/login");
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505" }}>

      {/* HEADER */}
      <div
        style={{
          height: 70,
          background: "#0b0f1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          zIndex: 100
        }}
      >
        <Logo size="md" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "transparent",
            border: "none",
            color: "#00ff88",
            fontSize: 22,
            cursor: "pointer",
            fontFamily: "monospace"
          }}
        >
          {sidebarOpen ? "«" : "»"} ☰
        </button>
      </div>

      {/* BODY ROW */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* LEFT SIDEBAR */}
        <div
          style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
            minWidth: sidebarOpen ? SIDEBAR_WIDTH : 0,
            transition: "width .28s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            background: "linear-gradient(180deg, #0d111a, #050505)",
            borderRight: sidebarOpen ? "1px solid rgba(255,255,255,.08)" : "none",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {sidebarOpen && (
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              <nav className="layout-nav">
                <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
                <NavLink to="/admin/security" className={navClass}>Security Overview</NavLink>
                <NavLink to="/admin/trading" className={navClass}>Internal Trading</NavLink>
                <NavLink to="/admin/global" className={navClass}>Global Control</NavLink>
                <NavLink to="/manager" className={navClass}>Manager Command</NavLink>
                
                <div style={{ margin: "20px 0", height: 1, background: "rgba(255,255,255,0.05)" }} />
                
                <button
                  onClick={logout}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 4,
                    background: "rgba(255,50,50,0.1)",
                    color: "#ff4444",
                    border: "1px solid rgba(255,50,50,0.2)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    textTransform: "uppercase"
                  }}
                >
                  Terminate Session
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* CENTER CONTENT */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#050505"
          }}
        >
          <div
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 1600,
              margin: "0 auto",
              padding: "24px",
              overflowY: "auto"
            }}
          >
            <Outlet />
          </div>
        </main>

        {/* RIGHT ADVISOR */}
        <aside
          style={{
            width: advisorOpen ? ADVISOR_WIDTH : 0,
            transition: "width .28s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            borderLeft: advisorOpen ? "1px solid rgba(255,255,255,.05)" : "none",
            background: "#0d111a",
            display: "flex"
          }}
        >
          {advisorOpen && (
            <AuthoDevPanel
              title="Intelligence Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
                systemStatus,
                location: window.location.pathname
              })}
            />
          )}
        </aside>

        {/* ADVISOR TOGGLE TAB */}
        <div
          onClick={() => setAdvisorOpen(!advisorOpen)}
          style={{
            position: "absolute",
            right: advisorOpen ? ADVISOR_WIDTH : 0,
            top: "50%",
            transform: "translateY(-50%)",
            padding: "20px 6px",
            background: "#1a1f2e",
            color: "#00ff88",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            fontSize: 10,
            fontWeight: "bold",
            writingMode: "vertical-rl",
            transition: "right .28s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 10
          }}
        >
          {advisorOpen ? "CLOSE ADVISOR" : "OPEN ADVISOR"}
        </div>
      </div>
    </div>
  );
}
