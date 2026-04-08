// ==========================================================
// 🏛️ COMMAND CENTER — v37.1 (FINAL MASTER SHELL)
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
  
  // Mechanical State: Doors open/closed
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(true);

  // Security Hierarchy: Back-end Role Check
  const isAdmin = user?.role === 'admin' || user?.role === 'root';

  const navClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505", color: "#fff", overflow: "hidden", fontFamily: "monospace" }}>

      {/* 🟢 TOP HEADER: SECURE NAVIGATION */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '1px', opacity: 0.8 }}>
                SECURE_ACCESS_LEVEL
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: isAdmin ? '#00ff88' : '#3498db' }}>
                {user?.role?.toUpperCase() || "MONITOR_ONLY"} // {user?.email?.split('@')[0]}
              </div>
            </div>

            {/* 🌭 THE MENU TRIGGER: Controls the LEFT Command Door */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="menu-trigger-btn"
              style={{ 
                background: sidebarOpen ? "#00ff8815" : "transparent", 
                border: "1px solid #00ff8833", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center",
                gap: "12px",
                padding: "10px 18px",
                transition: "0.3s",
                borderRadius: "4px"
              }}
            >
              <span style={{ color: "#00ff88", fontSize: "11px", fontWeight: "bold", letterSpacing: "3px" }}>MENU</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "2px", height: "20px", background: "#00ff88" }}></div>
                <div style={{ width: "2px", height: "20px", background: "#00ff88", opacity: 0.6 }}></div>
                <div style={{ width: "2px", height: "20px", background: "#00ff88", opacity: 0.3 }}></div>
              </div>
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* 🔵 LEFT NAVIGATION (Command Oversight Sliding Door) */}
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
          <div style={{ width: 300, padding: "25px", display: "flex", flexDirection: "column", gap: "4px" }}>
            
            {/* SECTOR 1: GLOBAL OVERSIGHT */}
            <p className="nav-header" style={{ color: '#00ff88', opacity: 0.5, fontSize: '10px', marginBottom: '10px' }}>[ SECTOR_01: GLOBAL_OVERSIGHT ]</p>
            <NavLink to="/admin/global-view" className={navClass}>🌐 ALL_ROOMS_MONITOR</NavLink>
            <NavLink to="/admin/sync" className={navClass}>📡 SYSTEM_SYNC</NavLink>
            <NavLink to="/admin/live-feed" className={navClass}>📺 MASTER_LIVE_FEED</NavLink>
            
            <div style={{ height: '1px', background: '#00ff8811', margin: '15px 0' }} />
            
            {/* SECTOR 2: ENTITY MANAGEMENT */}
            <p className="nav-header" style={{ color: '#444', fontSize: '10px', marginBottom: '10px' }}>[ SECTOR_02: ENTITY_MANAGEMENT ]</p>
            <NavLink to="/admin/companies" className={navClass}>🏢 COMPANY_GROUPS</NavLink>
            <NavLink to="/admin/users" className={navClass}>👥 USER_DATABASE</NavLink>
            <NavLink to="/admin/billing" className={navClass}>💳 BILLING_OVERSIGHT</NavLink>

            <div style={{ height: '1px', background: '#00ff8811', margin: '15px 0' }} />

            {/* SECTOR 3: CORE ENGINES */}
            <p className="nav-header" style={{ color: '#444', fontSize: '10px', marginBottom: '10px' }}>[ SECTOR_03: CORE_ENGINES ]</p>
            <NavLink to="/admin/trading" className={navClass}>📈 TRADING_ROOM {isAdmin ? "🔓" : "👁️"}</NavLink>
            <NavLink to="/admin/security" className={navClass}>🛡️ SECURITY_CORE</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 ASSET_VAULT</NavLink>

            <div style={{ height: '1px', background: '#00ff8811', margin: '15px 0' }} />

            {/* SECTOR 4: SYSTEM ADMIN */}
            <p className="nav-header" style={{ color: '#444', fontSize: '10px', marginBottom: '10px' }}>[ SECTOR_04: SYSTEM_ADMIN ]</p>
            <NavLink to="/admin/audit" className={navClass}>📜 AUDIT_LOGS</NavLink>
            <NavLink to="/admin/settings" className={navClass}>⚙️ GLOBAL_SETTINGS</NavLink>
            {isAdmin && (
              <NavLink to="/admin/killswitch" className={navClass} style={{ color: '#ff4444' }}>🚨 EMERGENCY_KILLSWITCH</NavLink>
            )}

            <div style={{ marginTop: "30px" }}>
               <button onClick={logout} className="exit-btn" style={{ width: '100%', padding: '12px', border: '1px solid #ff444433', background: '#ff44440a', color: '#ff4444', cursor: 'pointer', fontWeight: 'bold' }}>
                 SHUTDOWN_SESSION
               </button>
            </div>
          </div>
        </nav>

        {/* ⚪ MAIN DISPLAY: THE ACTIVE ROOM */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#050505" }}>
          <Outlet context={{ isAdmin }} />
        </main>

        {/* 🔴 THE ADVISOR (Right Door Slide + Tactical Handle) */}
        <div style={{ position: "relative", display: "flex" }}>
          
          {/* TACTICAL HANDLE: Vertical Flash-Printing */}
          <div 
            onClick={() => setAdvisorOpen(!advisorOpen)} 
            style={{ 
                position: "absolute",
                top: "50%",
                left: "-35px", 
                transform: "translateY(-50%)",
                width: "35px",
                height: "200px", 
                background: "#0b101a",
                border: "1px solid #00ff8844",
                borderRight: "none",
                color: "#00ff88",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 0",
                cursor: "pointer",
                zIndex: 100,
                transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)",
                borderRadius: "8px 0 0 8px",
                boxShadow: "-8px 0 25px rgba(0,0,0,0.8)",
                backgroundColor: advisorOpen ? "#00ff8808" : "#0b101a"
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: "900" }}>{advisorOpen ? "»" : "«"}</span>

            {/* FLASH PRINTING */}
            <div style={{ 
              writingMode: "vertical-rl", 
              textOrientation: "mixed", 
              fontSize: "11px", 
              letterSpacing: "6px", 
              fontWeight: "900",
              opacity: 0.9,
              textTransform: "uppercase",
              color: "#00ff88"
            }}>
              ADVISOR_UNIT_SYSTEM
            </div>

            <span style={{ fontSize: "16px", fontWeight: "900" }}>{advisorOpen ? "»" : "«"}</span>
          </div>

          <aside style={{ 
            width: advisorOpen ? 380 : 0, 
            background: "#080a0f", 
            transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
            overflow: "hidden", 
            borderLeft: advisorOpen ? "1px solid #00ff8822" : "none",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ width: 380, height: "100%", opacity: advisorOpen ? 1 : 0, transition: "0.3s" }}>
              <AuthoDevPanel currentPath={location.pathname} />
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
