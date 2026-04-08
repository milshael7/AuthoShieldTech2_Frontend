// ==========================================================
// 🏛️ COMMAND CENTER — v35.7 (FULL RESTORATION)
// FILE: src/layouts/AdminLayout.jsx
// ==========================================================

import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505", color: "#fff" }}>

      {/* TOP HEADER */}
      <header style={{ height: 70, background: "#0b0f1a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #00ff8833" }}>
        <Logo size="md" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '10px', color: '#00ff88', border: '1px solid #00ff88', padding: '2px 10px' }}>
              ADMIN_ACCESS: {user?.email || "CONNECTED"}
            </span>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#00ff88", cursor: "pointer", fontSize: "20px" }}>
              {sidebarOpen ? "«" : "»"}
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* FULL RESTORED SIDE MENU */}
        <nav style={{ 
          width: sidebarOpen ? 280 : 0, 
          background: "#080a0f", 
          transition: "0.3s", 
          overflowX: "hidden", 
          overflowY: "auto", // Allow scrolling if the list is long
          display: "flex", 
          flexDirection: "column", 
          borderRight: "1px solid #ffffff11" 
        }}>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CORE SYSTEMS</p>
            <NavLink to="/admin" end className={navClass}>🏠 MAIN_DASHBOARD</NavLink>
            <NavLink to="/admin/trading" className={navClass}>📈 TRADING_ROOM</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 MY_ASSETS</NavLink>

            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CYBER DEFENSE</p>
            <NavLink to="/admin/security" className={navClass}>🛡️ SECURITY_OVERVIEW</NavLink>
            <NavLink to="/admin/risk" className={navClass}>⚠️ RISK_MONITOR</NavLink>
            <NavLink to="/admin/incidents" className={navClass}>🚨 THREAT_HISTORY</NavLink>
            <NavLink to="/admin/vulnerability" className={navClass}>🔍 SYSTEM_HOLES</NavLink>

            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>MANAGEMENT</p>
            <NavLink to="/admin/users" className={navClass}>👥 USER_ACCOUNTS</NavLink>
            <NavLink to="/admin/companies" className={navClass}>🏢 COMPANY_LIST</NavLink>
            <NavLink to="/admin/audit" className={navClass}>📜 LOG_HISTORY</NavLink>
            <NavLink to="/admin/global" className={navClass}>⚙️ SYSTEM_SETTINGS</NavLink>

            <div style={{ margin: "25px 0", height: "1px", background: "#ffffff11" }} />

            <button onClick={logout} style={{ padding: "10px", background: "#ff444411", color: "#ff4444", border: "1px solid #ff444433", cursor: "pointer", fontWeight: "bold", fontSize: "0.7rem" }}>
              EXIT_SYSTEM
            </button>
          </div>
        </nav>

        {/* MAIN DISPLAY */}
        <main style={{ flex: 1, padding: "20px", overflowY: "auto", background: "#050505" }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}
