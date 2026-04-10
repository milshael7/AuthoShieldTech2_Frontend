// ==========================================================
// 🛡️ PROTECTED CORE FILE — v4.3 (INDUSTRIAL_SHELL_SYNC)
// MODULE: Trading Terminal Layout (UI SHELL)
// FILE: src/pages/trading/TradingLayout.jsx
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
    // 🛰️ PUSH 8.6: Array Normalization for Intelligence Stream
    const intelList = Array.isArray(snapshot?.intelligence) ? snapshot.intelligence : [];
    const latestIntel = intelList.length > 0 ? intelList[intelList.length - 1] : {};
    
    const rawConf = Number(latestIntel.confidence || 0);
    const normalizedConf = rawConf > 1 ? rawConf / 100 : rawConf;

    return {
      engineStatus: (paperStatus || "OFFLINE").toUpperCase(),
      running: paperStatus === "connected",
      mode: snapshot?.mode || "PAPER_TRADING",
      trades: trades.length || 0,
      decisions: decisions.length || 0,
      aiRate: Number(latestIntel.velocity || 0),
      memoryMb: Number(latestIntel.memoryUsage || latestIntel.memory || 0),
      confidence: normalizedConf,
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
            <div style={styles.title}>AUTOSHIELD_TERMINAL <span style={styles.version}>v4.3</span></div>
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
        <TabLink to="market" label="MARKET_RADAR" />
        <TabLink to="control" label="AI_BRAIN" />
        <TabLink to="analytics" label="ANALYTICS" />
      </nav>

      {/* 🖥️ VIEWPORT */}
      <main style={styles.viewport}>
        {/* Pass telemetry down via context for child rooms to consume */}
        <Outlet context={{ isAdmin: true, telemetry }} />
        
        {/* Redirect base /trading to /trading/live */}
        {(location.pathname === "/admin/trading" || location.pathname === "/admin/trading/") && (
          <Navigate to="live" replace />
        )}
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
        color: isActive ? "#00ff88" : "#64748b",
        borderBottom: isActive ? "2px solid #00ff88" : "2px solid transparent",
        background: isActive ? "rgba(0, 255, 136, 0.03)" : "transparent"
      })}
    >
      {label}
    </NavLink>
  );
}

function HeaderPill({ label, value, tone = "info" }) {
  let color = "#94a3b8";
  if (tone === "good") color = "#00ff88";
  if (tone === "bad") color = "#ff4444";

  return (
    <div style={styles.pill}>
      <span style={{ color: "#475569", marginRight: 6 }}>{label}</span>
      <b style={{ color }}>{value}</b>
    </div>
  );
}

const styles = {
  shell: { display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#05080f", color: "#fff", fontFamily: "monospace" },
  header: { padding: "15px 20px", background: "#0b101a", borderBottom: "1px solid #ffffff05" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  title: { fontSize: "12px", fontWeight: "900", letterSpacing: "2px", color: "#fff" },
  version: { fontSize: "8px", color: "#475569", marginLeft: "5px" },
  subtitle: { fontSize: "9px", color: "#475569", letterSpacing: "1px", marginTop: "2px" },
  pillContainer: { display: "flex", gap: "6px", flexWrap: "wrap" },
  pill: { padding: "4px 10px", borderRadius: "2px", background: "rgba(0,0,0,0.3)", fontSize: "9px", border: "1px solid #ffffff05", whiteSpace: "nowrap" },
  nav: { display: "flex", background: "#0b101a", padding: "0 20px", borderBottom: "1px solid #ffffff05", overflowX: "auto" },
  tab: { padding: "14px 20px", fontSize: "10px", fontWeight: "900", textDecoration: "none", transition: "0.2s", letterSpacing: "1.5px", whiteSpace: "nowrap" },
  viewport: { flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", background: "#05080f" }
};
