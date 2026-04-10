// ==========================================================
// 🏛️ COMMAND CENTER — v37.2 (ROUTE-SYNCED & STABLE)
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

  const isAdmin = user?.role === 'admin' || user?.role === 'root';

  const navClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  /**
   * 🛰️ PUSH 2 FIX: Route Normalization
   * Links now point to the exact structure defined in App.jsx.
   * Sector headers now show "OFFLINE" for unimplemented sectors to manage user expectations.
   */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050505", color: "#fff", overflow: "hidden", fontFamily: "monospace" }}>

      {/* 🟢 TOP HEADER */}
      <header style={{ 
        height: 70, background: "#0b101a", display: "flex", alignItems: "center", 
        justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #00ff8833", zIndex: 110 
      }}>
        <Logo size="md" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '1px', opacity: 0.8 }}>SECURE_ACCESS_LEVEL</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: isAdmin ? '#00ff88' : '#3498db' }}>
                {user?.role?.toUpperCase() || "MONITOR_ONLY"} // {user?.email?.split('@')[0]}
              </div>
            </div>

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-trigger-btn">
              <span style={{ color: "#00ff88", fontSize: "11px", fontWeight: "bold", letterSpacing: "3px" }}>MENU</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "2px", height: "20px", background: "#00ff88" }}></div>
                <div style={{ width: "2px", height: "20px", background: "#00ff88", opacity: 0.6 }}></div>
              </div>
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* 🔵 LEFT NAVIGATION */}
        <nav style={{ 
          width: sidebarOpen ? 300 : 0, background: "#080a0f", transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
          overflowX: "hidden", borderRight: sidebarOpen ? "1px solid #ffffff11" : "none", display: "flex", 
          flexDirection: "column", zIndex: 50
        }}>
          <div style={{ width: 300, padding: "25px", display: "flex", flexDirection: "column", gap: "4px" }}>
            
            {/* SECTOR 1: GLOBAL OVERSIGHT */}
            <p className="nav-header">[ SECTOR_01: GLOBAL_OVERSIGHT ]</p>
            <NavLink to="/admin" end className={navClass}>🌐 OVERSIGHT_DASHBOARD</NavLink>
            <NavLink to="/admin/global" className={navClass}>📡 GLOBAL_CONTROL</NavLink>
            
            <div style={{ height: '1px', background: '#00ff8811', margin: '15px 0' }} />
            
            {/* SECTOR 2: ENTITY MANAGEMENT (COMING SOON) */}
            <p className="nav-header" style={{ opacity: 0.3 }}>[ SECTOR_02: ENTITY_MANAGEMENT ]</p>
            <NavLink to="/admin/users" className={navClass}>👥 USER_DATABASE</NavLink>

            <div style={{ height: '1px', background: '#00ff8811', margin: '15px 0' }} />

            {/* SECTOR 3: CORE ENGINES (ACTIVE) */}
            <p className="nav-header" style={{ color: '#00ff88' }}>[ SECTOR_03: CORE_ENGINES ]</p>
            {/* 🛰️ Updated to point to our newly nested trading block */}
            <NavLink to="/admin/trading/live" className={navClass}>📈 TRADING_ROOM {isAdmin ? "🔓" : "👁️"}</NavLink>
            <NavLink to="/admin/security" className={navClass}>🛡️ SECURITY_CORE</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 ASSET_VAULT</NavLink>

            <div style={{ height: '1px', background: '#00ff8811', margin: '15px 0' }} />

            {/* SECTOR 4: SYSTEM ADMIN */}
            <p className="nav-header">[ SECTOR_04: SYSTEM_ADMIN ]</p>
            <NavLink to="/admin/settings" className={navClass}>⚙️ GLOBAL_SETTINGS</NavLink>

            <div style={{ marginTop: "30px" }}>
               <button onClick={logout} className="exit-btn" style={{ width: '100%', padding: '12px', border: '1px solid #ff444433', background: '#ff44440a', color: '#ff4444', cursor: 'pointer', fontWeight: 'bold' }}>
                 SHUTDOWN_SESSION
               </button>
            </div>
          </div>
        </nav>

        {/* ⚪ MAIN DISPLAY */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#050505" }}>
          <Outlet context={{ isAdmin }} />
        </main>

        {/* 🔴 THE ADVISOR */}
        <div style={{ position: "relative", display: "flex" }}>
          <div onClick={() => setAdvisorOpen(!advisorOpen)} className="advisor-handle">
            <span style={{ fontSize: "16px", fontWeight: "900" }}>{advisorOpen ? "»" : "«"}</span>
            <div className="advisor-handle-text">ADVISOR_UNIT_SYSTEM</div>
            <span style={{ fontSize: "16px", fontWeight: "900" }}>{advisorOpen ? "»" : "«"}</span>
          </div>

          <aside style={{ 
            width: advisorOpen ? 380 : 0, background: "#080a0f", transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
            overflow: "hidden", borderLeft: advisorOpen ? "1px solid #00ff8822" : "none", display: "flex", flexDirection: "column"
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
