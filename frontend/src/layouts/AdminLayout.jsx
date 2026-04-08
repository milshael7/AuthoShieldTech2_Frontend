// ==========================================================
// 🏛️ COMMAND CENTER — v36.7 (FULL ROOM RESTORATION)
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
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(true);

  const navClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505", color: "#fff", overflow: "hidden" }}>

      {/* 🟢 TOP HEADER */}
      <header style={{ 
        height: 70, 
        background: "#0b101a", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "0 24px", 
        borderBottom: "1px solid #00ff8833", 
        zIndex: 110 
      }}>
        <Logo size="md" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
              NODE_ID: {user?.email || "CONNECTED"}
            </span>

            {/* 🌭 THE MENU TRIGGER (Hot Dog Bar for the Sliding Door) */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              style={{ 
                background: sidebarOpen ? "#00ff8815" : "transparent", 
                border: "1px solid #00ff8833", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center",
                gap: "12px",
                padding: "8px 15px",
                transition: "0.3s",
                borderRadius: "4px"
              }}
            >
              <span style={{ color: "#00ff88", fontSize: "11px", fontWeight: "bold", letterSpacing: "3px" }}>
                MENU
              </span>
              
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "2px", height: "18px", background: "#00ff88" }}></div>
                <div style={{ width: "2px", height: "18px", background: "#00ff88", opacity: 0.6 }}></div>
                <div style={{ width: "2px", height: "18px", background: "#00ff88", opacity: 0.3 }}></div>
              </div>
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* 🔵 LEFT NAVIGATION (The Command Door - Packed with Rooms) */}
        <nav style={{ 
          width: sidebarOpen ? 300 : 0, 
          background: "#080a0f", 
          transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
          overflowX: "hidden", 
          borderRight: sidebarOpen ? "1px solid #ffffff11" : "none",
          display: "flex", 
          flexDirection: "column",
          zIndex: 50
        }}>
          <div style={{ width: 300, padding: "25px", display: "flex", flexDirection: "column", gap: "8px" }}>
            
            <p style={{ color: "#00ff88", fontSize: "0.55rem", marginBottom: "10px", letterSpacing: "2px", opacity: 0.6 }}>GLOBAL OVERSIGHT</p>
            <NavLink to="/admin/global-view" className={navClass}>🌐 ALL_ROOMS_MONITOR</NavLink>
            <NavLink to="/admin/sync" className={navClass}>📡 SYSTEM_SYNC</NavLink>
            
            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />
            
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>MARKET OPERATIONS</p>
            <NavLink to="/admin" end className={navClass}>🏠 MAIN_DASHBOARD</NavLink>
            <NavLink to="/admin/trading" className={navClass}>📈 TRADING_ROOM</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 ASSET_VAULT</NavLink>
            <NavLink to="/admin/ledger" className={navClass}>📜 TRADE_LEDGER</NavLink>

            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />

            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CYBER DEFENSE</p>
            <NavLink to="/admin/security" className={navClass}>🛡️ SECURITY_CORE</NavLink>
            <NavLink to="/admin/threat-monitor" className={navClass}>🚨 THREAT_INTEL</NavLink>
            <NavLink to="/admin/risk-report" className={navClass}>🔍 RISK_ANALYSIS</NavLink>

            <div style={{ margin: "15px 0", height: "1px", background: "#ffffff05" }} />

            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>ADMIN_CONTROL</p>
            <NavLink to="/admin/users" className={navClass}>👥 USER_DATABASE</NavLink>
            <NavLink to="/admin/companies" className={navClass}>🏢 COMPANY_GROUPS</NavLink>
            <NavLink to="/admin/settings" className={navClass}>⚙️ SYSTEM_SETTINGS</NavLink>

            <div style={{ marginTop: "40px" }}>
               <button onClick={logout} style={{ width: "100%", padding: "12px", background: "#ff444411", color: "#ff4444", border: "1px solid #ff444433", cursor: "pointer", fontSize: "0.7rem", fontWeight: "bold", letterSpacing: "1px" }}>
                 TERMINATE_SESSION
               </button>
            </div>
          </div>
        </nav>

        {/* ⚪ MAIN DISPLAY */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#050505" }}>
          <Outlet />
        </main>

        {/* 🔴 THE ADVISOR (Right Side Slide with Directional Handle) */}
        <div style={{ position: "relative", display: "flex" }}>
          
          <div 
            onClick={() => setAdvisorOpen(!advisorOpen)} 
            style={{ 
                position: "absolute", top: "50%", left: "-20px", transform: "translateY(-50%)",
                width: "20px", height: "100px", background: "#0b101a", border: "1px solid #00ff8844",
                color: "#00ff88", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", zIndex: 100, transition: "0.45s", borderRadius: "6px 0 0 6px",
                boxShadow: "-4px 0 15px rgba(0,0,0,0.6)"
            }}
          >
            {advisorOpen ? "»" : "«"}
          </div>

          <aside style={{ 
            width: advisorOpen ? 380 : 0, 
            background: "#080a0f", 
            transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
            overflowX: "hidden", 
            borderLeft: advisorOpen ? "1px solid #00ff8822" : "none"
          }}>
            <div style={{ width: 380, height: "100%" }}>
              <AuthoDevPanel currentPath={location.pathname} />
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
