// ==========================================================
// 🛡️ PROTECTED CORE FILE — v4.1 (MAPPING SYNCED)
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
    /** 🛰️ PUSH 3 FIX: ARRAY MAPPING
     * Backend sends intelligence as a list. We need the latest entry
     * to populate the header metrics.
     */
    const intelList = Array.isArray(snapshot?.intelligence) ? snapshot.intelligence : [];
    const latestIntel = intelList.length > 0 ? intelList[intelList.length - 1] : {};
    
    return {
      engineStatus: (paperStatus || "OFFLINE").toUpperCase(),
      running: paperStatus === "connected",
      // 🛰️ PUSH 3 FIX: Mode Definition
      mode: snapshot?.mode || "PAPER_TRADING",
      trades: trades.length || 0,
      decisions: decisions.length || 0,
      // Map correctly from the latest intelligence log entry
      aiRate: Number(latestIntel.velocity || 0),
      memoryMb: Number(latestIntel.memoryUsage || latestIntel.memory || 0),
      confidence: Number(latestIntel.confidence || 0),
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
            <div style={styles.title}>AUTOSHIELD_TERMINAL <span style={styles.version}>v4.1</span></div>
            {/* 🛰️ PUSH 3 FIX: Telemetry Mode now correctly resolves */}
            <div style={styles.subtitle}>SECURE_TRADING_NODE // {telemetry.mode}</div>
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
        <Outlet context={{ isAdmin: true }} />
        {location.pathname.endsWith("trading") && <Navigate to="live" replace />}
      </main>
    </div>
  );
}

/* ================= UI HELPERS (PRESERVED) ================= */

function TabLink({ to, label }) {
  return (
    <NavLink 
      to={to} 
      style={({isActive}) => ({
        ...styles.tab,
        color: isActive ? "#2bd576" : "#64748b",
        borderBottom: isActive ? "2px solid #2bd576" : "2px solid transparent",
        background: isActive ? "rgba(43, 213, 118, 0.05)" : "transparent"
      })}
    >
      {label}
    </NavLink>
  );
}

function HeaderPill({ label, value, tone = "info" }) {
  let color = "#94a3b8";
  if (tone === "good") color = "#2bd576";
  if (tone === "bad") color = "#ff5a5f";

  return (
    <div style={styles.pill}>
      <span style={{ color: "#475569", marginRight: 6 }}>{label}</span>
      <b style={{ color }}>{value}</b>
    </div>
  );
}

const styles = {
  shell: { display: "flex", flexDirection: "column", height: "100vh", background: "#05080f", color: "#fff", fontFamily: "monospace" },
  header: { padding: "15px 20px", background: "#0b101a", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "14px", fontWeight: "900", letterSpacing: "1px" },
  version: { fontSize: "9px", opacity: 0.3, marginLeft: "5px" },
  subtitle: { fontSize: "9px", color: "#475569", letterSpacing: "1px", marginTop: "2px" },
  pillContainer: { display: "flex", gap: "8px" },
  pill: { padding: "4px 10px", borderRadius: "2px", background: "rgba(0,0,0,0.2)", fontSize: "10px", border: "1px solid rgba(255,255,255,0.05)" },
  nav: { display: "flex", background: "#0b101a", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  tab: { padding: "12px 20px", fontSize: "11px", fontWeight: "900", textDecoration: "none", transition: "0.2s", letterSpacing: "1px" },
  viewport: { flex: 1, overflow: "hidden", position: "relative" }
};
