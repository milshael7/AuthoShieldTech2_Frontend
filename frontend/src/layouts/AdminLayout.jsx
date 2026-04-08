// ==========================================================
// 🏛️ COMMAND CENTER — v36.5 (THE ADVISOR HANDLE UPGRADE)
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
  
  // Left side: Hot Dog controlled via "ADVISOR" handle
  // Right side: Tactical Handle controlled via directional arrow
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
            <span style={{ fontSize: '10px', color: '#00ff88', border: '1px solid #00ff8844', padding: '4px 12px', borderRadius: '2px', backgroundColor: '#00ff8805', opacity: 0.6 }}>
              SECURED_NODE // {user?.email || "ADMIN"}
            </span>

            {/* 🌭 THE ADVISOR HANDLE (Trigger for the LEFT Sliding Door) */}
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
              <span style={{ 
                color: "#00ff88", 
                fontSize: "11px", 
                fontWeight: "bold", 
                letterSpacing: "3px" 
              }}>
                ADVISOR
              </span>
              
              {/* Vertical Hot Dog Bars (The "Barks") */}
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "2px", height: "18px", background: "#00ff88" }}></div>
                <div style={{ width: "2px", height: "18px", background: "#00ff88", opacity: 0.6 }}></div>
                <div style={{ width: "2px", height: "18px", background: "#00ff88", opacity: 0.3 }}></div>
              </div>
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* 🔵 LEFT NAVIGATION (Sliding Door - Command Overwatch) */}
        <nav style={{ 
          width: sidebarOpen ? 280 : 0, 
          background: "#080a0f", 
          transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
          overflowX: "hidden", 
          borderRight: sidebarOpen ? "1px solid #ffffff11" : "none",
          display: "flex", 
          flexDirection: "column",
          zIndex: 50
        }}>
          <div style={{ width: 280, padding: "20px" }}>
            <p style={{ color: "#00ff88", fontSize: "0.55rem", marginBottom: "15px", letterSpacing: "2px", opacity: 0.8 }}>GLOBAL OVERSIGHT</p>
            <NavLink to="/admin/global-view" className={navClass}>🌐 ALL_ROOMS_MONITOR</NavLink>
            
            <div style={{ margin: "20px 0", height: "1px", background: "#ffffff05" }} />
            
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CORE SYSTEMS</p>
            <NavLink to="/admin" end className={navClass}>🏠 MAIN_DASHBOARD</NavLink>
            <NavLink to="/admin/trading" className={navClass}>📈 TRADING_ROOM</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 MY_ASSETS</NavLink>

            <div style={{ marginTop: "auto", padding: "20px 0" }}>
               <button onClick={logout} style={{ width: "100%", padding: "10px", background: "#ff444411", color: "#ff4444", border: "1px solid #ff444433", cursor: "pointer", fontSize: "0.7rem", fontWeight: "bold" }}>
                 EXIT_SYSTEM
               </button>
            </div>
          </div>
        </nav>

        {/* ⚪ MAIN DISPLAY (The Active Room) */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto", background: "#050505" }}>
          <Outlet />
        </main>

        {/* 🔴 THE ADVISOR (Sliding Door + Tactical Directional Handle) */}
        <div style={{ position: "relative", display: "flex" }}>
          
          {/* TACTICAL HANDLE: Indicates slide-in/out via arrows */}
          <div 
            onClick={() => setAdvisorOpen(!advisorOpen)} 
            style={{ 
                position: "absolute",
                top: "50%",
                left: "-20px", 
                transform: "translateY(-50%)",
                width: "20px",
                height: "100px",
                background: "#0b101a",
                border: "1px solid #00ff8844",
                color: "#00ff88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 100,
                fontSize: "14px",
                transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)",
                borderRadius: "6px 0 0 6px",
                boxShadow: "-4px 0 15px rgba(0,0,0,0.6)"
            }}
          >
            {/* Logic: Arrow points AWAY from the panel to slide it out, TOWARD it to slide in */}
            {advisorOpen ? "»" : "«"}
          </div>

          <aside style={{ 
            width: advisorOpen ? 380 : 0, 
            background: "#080a0f", 
            transition: "0.45s cubic-bezier(0.19, 1, 0.22, 1)", 
            overflowX: "hidden", 
            borderLeft: advisorOpen ? "1px solid #00ff8822" : "none",
            display: "flex", 
            flexDirection: "column" 
          }}>
            <div style={{ width: 380, height: "100%" }}>
              {/* Context-aware Advisor Content */}
              <AuthoDevPanel currentPath={location.pathname} />
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
