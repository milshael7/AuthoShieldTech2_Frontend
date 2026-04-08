// ==========================================================
// 🏛️ COMMAND CENTER — v36.3 (HOT DOG BAR + TACTICAL HANDLE)
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
  
  // Left side: Hot Dog controlled | Right side: Tactical Handle controlled
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
            <span style={{ fontSize: '10px', color: '#00ff88', border: '1px solid #00ff8844', padding: '4px 12px', borderRadius: '2px', backgroundColor: '#00ff8805' }}>
              ADMIN_SECURED // {user?.email || "ROOT"}
            </span>

            {/* 🌭 THE HOT DOG BAR (Vertical Triggers) */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              style={{ 
                background: sidebarOpen ? "#00ff8811" : "none", 
                border: "none", 
                cursor: "pointer", 
                display: "flex", 
                flexDirection: "row", // Horizontal arrangement for vertical bars
                gap: "5px",
                padding: "10px",
                transition: "0.3s"
              }}
              title="Toggle Command Menu"
            >
              <div style={{ width: "3px", height: "22px", background: "#00ff88" }}></div>
              <div style={{ width: "3px", height: "22px", background: "#00ff88", opacity: 0.6 }}></div>
              <div style={{ width: "3px", height: "22px", background: "#00ff88", opacity: 0.3 }}></div>
            </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* 🔵 LEFT NAVIGATION (Sliding Door) */}
        <nav style={{ 
          width: sidebarOpen ? 280 : 0, 
          background: "#080a0f", 
          transition: "0.4s cubic-bezier(0.19, 1, 0.22, 1)", 
          overflowX: "hidden", 
          borderRight: sidebarOpen ? "1px solid #ffffff11" : "none",
          display: "flex", 
          flexDirection: "column",
          zIndex: 50
        }}>
          <div style={{ width: 280, padding: "20px" }}>
            <p style={{ color: "#00ff88", fontSize: "0.55rem", marginBottom: "15px", letterSpacing: "2px" }}>GLOBAL OVERSIGHT</p>
            <NavLink to="/admin/global-view" className={navClass}>🌐 ALL_ROOMS_MONITOR</NavLink>
            
            <div style={{ margin: "20px 0", height: "1px", background: "#ffffff05" }} />
            
            <p style={{ color: "#444", fontSize: "0.55rem", marginBottom: "5px", letterSpacing: "2px" }}>CORE SYSTEMS</p>
            <NavLink to="/admin" end className={navClass}>🏠 MAIN_DASHBOARD</NavLink>
            <NavLink to="/admin/trading" className={navClass}>📈 TRADING_ROOM</NavLink>
            <NavLink to="/admin/assets" className={navClass}>💰 MY_ASSETS</NavLink>
          </div>
        </nav>

        {/* ⚪ MAIN DISPLAY */}
        <main style={{ flex: 1, padding: "20px", overflowY: "auto", background: "#050505" }}>
          <Outlet />
        </main>

        {/* 🔴 THE ADVISOR (Sliding Door + Tactical Handle) */}
        <div style={{ position: "relative", display: "flex" }}>
          
          <div 
            onClick={() => setAdvisorOpen(!advisorOpen)} 
            style={{ 
                position: "absolute",
                top: "50%",
                left: "-20px", // Sits on the edge
                transform: "translateY(-50%)",
                width: "20px",
                height: "80px",
                background: "#0b101a",
                border: "1px solid #00ff8844",
                color: "#00ff88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 100,
                fontSize: "12px",
                transition: "0.4s cubic-bezier(0.19, 1, 0.22, 1)",
                borderRadius: "4px 0 0 4px",
                boxShadow: "-4px 0 10px rgba(0,0,0,0.5)"
            }}
          >
            {/* Arrows indicate the SLIDE direction */}
            {advisorOpen ? "»" : "«"}
          </div>

          <aside style={{ 
            width: advisorOpen ? 380 : 0, 
            background: "#080a0f", 
            transition: "0.4s cubic-bezier(0.19, 1, 0.22, 1)", 
            overflowX: "hidden", 
            borderLeft: advisorOpen ? "1px solid #00ff8822" : "none",
            display: "flex", 
            flexDirection: "column" 
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
