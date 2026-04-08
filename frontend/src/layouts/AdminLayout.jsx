// ==========================================================
// 🏛️ COMMAND CENTER — v36.0 (GLOBAL OVERSIGHT & ADVISOR)
// FILE: src/layouts/AdminLayout.jsx
// ==========================================================

import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx"; 
import "../styles/layout.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Controls for both sidebars
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(true);

  const navClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505", color: "#fff" }}>

      {/* 🟢 TOP HEADER - GLOBAL NAV */}
      <header style={{ 
        height: 70, 
        background: "#0b0f1a", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "0 24px", 
        borderBottom: "1px solid #00ff8833",
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#00ff88", cursor: "pointer", fontSize: "20px" }}>
              {sidebarOpen ? "«" : "»"}
            </button>
            <Logo size="md" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '1px' }}>SYSTEM_SYNCHRONIZED</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{user?.email || "ROOT_ADMIN"}</span>
            </div>
            
            {/* Global Advisor Toggle */}
            <button 
              onClick={() => setAdvisorOpen(!advisorOpen)} 
              style={{ 
                background: advisorOpen ? "#00ff8822" : "transparent", 
                border: "1px solid #00ff8844", 
                color: "#00ff88", 
                padding: "5px 12px", 
                cursor: "pointer",
                fontSize: "10px"
              }}
            >
              {advisorOpen ? "HIDE_ADVISOR" : "SHOW_ADVISOR"}
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* 🔵 LEFT MENU: RESTORED & EXPANDED FOR GLOBAL VIEWS */}
        <nav style={{ 
          width: sidebarOpen ? 280 : 0, 
          background: "#080a0f", 
          transition: "0.3s", 
          overflowX: "hidden", 
          overflowY: "auto", 
          display: "flex", 
          flexDirection: "column", 
          borderRight: "1px solid #ffffff11" 
        }}>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "6px", minWidth: "280px" }}>
            
            {/* NEW: GLOBAL OVERWATCH SECTION */}
            <p style={{ color: "#00ff88", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px", opacity: 0.7 }}>GLOBAL OVERSIGHT</p>
            <NavLink to="/admin/global-view" className={navClass}>🌐 ALL_ROOMS_MONITOR</NavLink>
            <NavLink to="/admin/sync-status" className={navClass}>📡 CLOUD_SYNCHRONIZATION</NavLink>
            
            <div style={{ margin: "15px 0", height: "1px", background: "#00ff8811" }} />

            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CORE SYSTEMS</p>
            <NavLink to="/admin" end className={navClass}>🏠 MAIN_DASHBOARD</NavLink>
            <NavLink to="/admin/trading" className={navClass}>📈 TRADING_ROOM</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 MY_ASSETS</NavLink>

            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />
            
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CYBER DEFENSE</p>
            <NavLink to="/admin/security" className={navClass}>🛡️ SECURITY_OVERVIEW</NavLink>
            <NavLink to="/admin/risk" className={navClass}>⚠️ RISK_MONITOR</NavLink>

            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />
            
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>MANAGEMENT</p>
            <NavLink to="/admin/users" className={navClass}>👥 USER_ACCOUNTS</NavLink>
            <NavLink to="/admin/companies" className={navClass}>🏢 COMPANY_LIST</NavLink>

            <div style={{ marginTop: "20px" }} />
            <button onClick={logout} style={{ padding: "10px", background: "#ff444411", color: "#ff4444", border: "1px solid #ff444433", cursor: "pointer", fontWeight: "bold", fontSize: "0.7rem" }}>
              EXIT_SYSTEM
            </button>
          </div>
        </nav>

        {/* ⚪ MAIN WORKSPACE (CENTRAL VIEW) */}
        <main style={{ 
          flex: 1, 
          padding: "20px", 
          overflowY: "auto", 
          background: "#050505",
          borderRight: advisorOpen ? "1px solid #ffffff11" : "none"
        }}>
          <Outlet />
        </main>

        {/* 🔴 THE ADVISOR (RIGHT-SIDE BRAIN) */}
        <aside style={{ 
          width: advisorOpen ? 380 : 0, 
          background: "#080a0f", 
          transition: "0.3s", 
          overflowX: "hidden", 
          display: "flex", 
          flexDirection: "column" 
        }}>
          <div style={{ minWidth: "380px", height: "100%" }}>
            {/* The Advisor needs to know the path to explain what you're looking at */}
            <AuthoDevPanel currentPath={location.pathname} />
          </div>
        </aside>

      </div>
    </div>
  );
}
