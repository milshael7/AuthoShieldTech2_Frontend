// ==========================================================
// 🏛️ COMMAND CENTER — v38.1 (FULL LAYOUT REPLACEMENT)
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
  
  // 🟢 STATE: Sidebar defaults open, Advisor defaults closed for clean entry
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'root';
  const navClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

  // Configuration Constants
  const ADVISOR_WIDTH = 380;
  const HANDLE_WIDTH = 35;

  return (
    <div style={{ 
      display: "flex", flexDirection: "column", height: "100vh", 
      background: "#050505", color: "#fff", overflow: "hidden", fontFamily: "monospace" 
    }}>

      {/* 🟢 TOP HEADER */}
      <header style={styles.header}>
        <Logo size="md" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.accessLabel}>SECURE_ACCESS_LEVEL</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: isAdmin ? '#00ff88' : '#3498db' }}>
                {user?.role?.toUpperCase()} // {user?.email?.split('@')[0]}
              </div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-trigger-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.menuText}>MENU</span>
              <div style={styles.menuIconStrip}>
                <div style={{ width: "2px", height: "20px", background: "#00ff88" }}></div>
                <div style={{ width: "2px", height: "20px", background: "#00ff88", opacity: 0.5 }}></div>
              </div>
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* 🔵 LEFT NAVIGATION (SIDEBAR) */}
        <nav style={{ 
          width: sidebarOpen ? 300 : 0, 
          background: "#080a0f", 
          transition: "0.4s cubic-bezier(0.19, 1, 0.22, 1)", 
          overflowX: "hidden", 
          borderRight: sidebarOpen ? "1px solid #ffffff11" : "none",
          zIndex: 50
        }}>
          <div style={{ width: 300, padding: "25px" }}>
            <p className="nav-header" style={{ color: "#555", fontSize: "10px", marginBottom: "15px" }}>[ SECTOR_01: OVERSIGHT ]</p>
            <NavLink to="/admin" end className={navClass}>🌐 DASHBOARD</NavLink>
            <NavLink to="/admin/global" className={navClass}>📡 GLOBAL_CONTROL</NavLink>
            
            <div style={styles.divider} />
            <p className="nav-header" style={{ color: "#555", fontSize: "10px", marginBottom: "15px" }}>[ SECTOR_02: ENGINES ]</p>
            <NavLink to="/admin/trading/live" className={navClass}>📈 TRADING_ROOM {isAdmin ? "🔓" : "👁️"}</NavLink>
            <NavLink to="/admin/security" className={navClass}>🛡️ SECURITY_CORE</NavLink>
            
            <div style={styles.divider} />
            <button onClick={logout} className="exit-btn" style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', cursor: 'pointer', fontSize: '11px' }}>SHUTDOWN_SESSION</button>
          </div>
        </nav>

        {/* ⚪ MAIN STAGE (THE CENTER) - BALANCED WRAPPER */}
        <main style={{ 
          flex: 1, 
          position: "relative",
          display: "flex", 
          flexDirection: "column",
          overflow: "hidden", 
          background: "#050505"
        }}>
          <div style={styles.stageInner}>
            <Outlet context={{ isAdmin }} />
          </div>
        </main>

        {/* 🔴 THE ADVISOR SYSTEM (RIGHT SIDE) */}
        <div style={{ 
          display: "flex", 
          height: "100%", 
          transition: "0.4s cubic-bezier(0.19, 1, 0.22, 1)",
          width: advisorOpen ? ADVISOR_WIDTH : 0,
          position: "relative"
        }}>
          
          {/* 🏹 TACTICAL HANDLE (DIRECTIONAL ARROWS) */}
          <div 
            onClick={() => setAdvisorOpen(!advisorOpen)} 
            style={{ 
                position: "absolute",
                top: "50%",
                left: `-${HANDLE_WIDTH}px`,
                transform: "translateY(-50%)",
                width: `${HANDLE_WIDTH}px`,
                height: "220px", 
                background: advisorOpen ? "#00ff8808" : "#0b101a",
                border: "1px solid #00ff8844",
                borderRight: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 0",
                cursor: "pointer",
                zIndex: 100,
                borderRadius: "8px 0 0 8px",
                boxShadow: "-5px 0 15px rgba(0,0,0,0.5)",
                userSelect: "none"
            }}
          >
            <span style={styles.handleArrow}>{advisorOpen ? "»" : "«"}</span>
            <div style={styles.handleVerticalText}>ADVISOR</div>
            <span style={styles.handleArrow}>{advisorOpen ? "»" : "«"}</span>
          </div>

          {/* ADVISOR CONTENT PANEL */}
          <aside style={{ 
            width: ADVISOR_WIDTH, 
            background: "#080a0f", 
            height: "100%",
            borderLeft: "1px solid #00ff8822",
            overflow: "hidden",
            visibility: advisorOpen ? "visible" : "hidden",
            opacity: advisorOpen ? 1 : 0,
            transition: "opacity 0.2s ease"
          }}>
            <div style={{ width: ADVISOR_WIDTH, height: "100%" }}>
              <AuthoDevPanel currentPath={location.pathname} />
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}

const styles = {
  header: { height: 70, background: "#0b101a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #00ff8833", zIndex: 110 },
  accessLabel: { fontSize: '9px', color: '#00ff88', letterSpacing: '1px', opacity: 0.8 },
  menuText: { color: "#00ff88", fontSize: "11px", fontWeight: "bold", letterSpacing: "3px" },
  menuIconStrip: { display: "flex", gap: "4px" },
  divider: { height: '1px', background: '#00ff8811', margin: '15px 0' },
  
  // 🛰️ STAGE INNER: Center Stage logic
  stageInner: {
    flex: 1,
    padding: "24px",
    width: "100%",
    maxWidth: "1600px", 
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    minWidth: 0, 
    boxSizing: "border-box",
    transition: "all 0.4s cubic-bezier(0.19, 1, 0.22, 1)"
  },

  handleArrow: { fontSize: "14px", fontWeight: "900", color: "#00ff88" },
  handleVerticalText: { 
    writingMode: "vertical-rl", 
    textOrientation: "mixed", 
    fontSize: "10px", 
    letterSpacing: "5px", 
    fontWeight: "900",
    color: "#00ff88",
    opacity: 0.7,
    userSelect: "none"
  }
};
