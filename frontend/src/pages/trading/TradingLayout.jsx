// ==========================================================
// 🔒 PROTECTED CORE FILE — v4.0 (UNISON SHELL)
// MODULE: Trading Terminal Layout (UI SHELL)
// FILE: src/pages/TradingLayout.jsx
// ==========================================================

import React, { useMemo } from "react";
import { NavLink, useLocation, Navigate, Outlet } from "react-router-dom";
import { useTrading } from "../../context/TradingContext.jsx";

export default function TradingLayout() {
  const location = useLocation();
  const {
    snapshot = {},
    paperStatus = "disconnected",
    trades = [],
    decisions = []
  } = useTrading() || {};

  /* ================= 📡 TELEMETRY ENGINE ================= */
  const telemetry = useMemo(() => {
    // Syncing with v6.1 engineCore keys
    const intel = snapshot?.intelligence || {};
    
    return {
      engineStatus: (paperStatus || "OFFLINE").toUpperCase(),
      running: paperStatus === "connected",
      trades: trades.length || 0,
      decisions: decisions.length || 0,
      // Map 'velocity' from engine to 'aiRate' for the UI
      aiRate: Number(intel.velocity || 0),
      memoryMb: Number(intel.memoryUsage || intel.memory || 0),
      confidence: Number(intel.confidence || 0),
      volatility: Number(snapshot?.volatility || 0),
    };
  }, [snapshot, paperStatus, trades, decisions]);

  const engineTone = telemetry.running ? "good" : "bad";

  return (
    <div style={styles.shell}>
      
      {/* 🚀 INDUSTRIAL HEADER */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.title}>AUTOSHIELD_TERMINAL <span style={styles.version}>v4.0</span></div>
            <div style={styles.subtitle}>SECURE_TRADING_NODE // {telemetry.mode || "PAPER_TRADING"}</div>
          </div>

          <div style={styles.pillContainer}>
            <HeaderPill label="STATUS" value={telemetry.engineStatus} tone={engineTone}/>
            <HeaderPill label="TRADES" value={telemetry.trades}/>
            <HeaderPill label="INTEL" value={telemetry.decisions}/>
            <HeaderPill label="VELOCITY" value={`${telemetry.aiRate.toFixed(2)}/s`}/>
            <HeaderPill label="MEM" value={`${telemetry.memoryMb.toFixed(0)}MB`}/>
            <HeaderPill label="CONF" value={`${(telemetry.confidence * 100).toFixed(0)}%`}/>
            <HeaderPill label="VOL" value={`${(telemetry.volatility * 100).toFixed(2)}%`}/>
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION RAIL */}
      <nav style={styles.nav}>
        <TabLink to="live" label="TERMINAL" />
        <TabLink to="market" label="MARKET_DATA" />
        <TabLink to="control" label="AI_BRAIN" />
        <TabLink to="analytics" label="ANALYTICS" />
      </nav>

      {/* 🖥️ VIEWPORT */}
      <main style={styles.viewport}>
        {/* We use Outlet if your routes are nested in App.jsx, 
            otherwise the page-switching logic below is the fallback */}
        <Outlet context={{ isAdmin: true }} />
        
        {location.pathname.endsWith("trading") && <Navigate to="live" replace />}
      </main>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function TabLink({ to, label }) {
  return (
    <NavLink 
      to={to} 
      style={({isActive}) => ({
        ...styles.tab,
        color: isActive ? "var(--p-ok, #2bd576)" : "#64748b",
        borderBottom: isActive ? "2px solid var(--p-ok, #2bd576)" : "2px solid transparent",
        background: isActive ? "rgba(43, 213, 118, 0.05)" : "transparent"
      })}
    >
      {label}
    </NavLink>
  );
}

function HeaderPill({ label, value, tone = "info" }) {
  let color = "#94a3b8";
  let border = "rgba(255,255,255,0.05)";
  
  if (tone === "good") color = "var(--p-ok, #2bd576)";
  if (tone === "bad") color = "var(--p-bad, #ff5a5f)";

  return (
    <div style={{ ...styles.pill, borderColor: border }}>
      <span style={{ color: "#475569", marginRight: 6 }}>{label}</span>
      <b style={{ color }}>{value}</b>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  shell: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#05080f",
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
  },
  header: {
    padding: "15px 20px",
    background: "#0b101a",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: { fontSize: "14px", fontWeight: "900", letterSpacing: "1px" },
  version: { fontSize: "9px", opacity: 0.3, marginLeft: "5px" },
  subtitle: { fontSize: "9px", color: "#475569", letterSpacing: "1px", marginTop: "2px" },
  pillContainer: { display: "flex", gap: "8px" },
  pill: { 
    padding: "4px 10px", 
    borderRadius: "2px", 
    background: "rgba(0,0,0,0.2)", 
    fontSize: "10px", 
    border: "1px solid" 
  },
  nav: {
    display: "flex",
    background: "#0b101a",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  tab: {
    padding: "12px 20px",
    fontSize: "11px",
    fontWeight: "900",
    textDecoration: "none",
    transition: "0.2s",
    letterSpacing: "1px"
  },
  viewport: { flex: 1, overflow: "hidden", position: "relative" }
};
