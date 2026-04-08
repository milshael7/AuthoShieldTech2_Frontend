// ============================================================
// 🔒 PROTECTED CORE FILE — v2.1 (VERCEL-STABILIZED)
// MODULE: Trading Terminal Layout (UI SHELL)
// ============================================================

import React, { useMemo } from "react";
import { NavLink, useLocation, Navigate } from "react-router-dom";

// ✅ ENSURE THIS PATH IS EXACT: src/pages/something/TradingLayout.jsx -> src/context
import { useTrading } from "../../context/TradingContext.jsx";

import TradingRoom from "../TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

export default function TradingLayout() {
  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const page = pathParts[pathParts.length - 1] || "live";

  /* ================= REAL DATA ================= */
  // Added default values to destructuring to prevent "undefined" crashes during build/init
  const {
    snapshot = {},
    metrics = {},
    paperStatus = "disconnected",
    trades = [],
    decisions = []
  } = useTrading() || {};

  /* ================= DERIVED ================= */
  const telemetry = useMemo(() => {
    const stats = snapshot?.executionStats || {};

    const ticks = Number(stats?.ticks || 0);
    const decisionCount = Number(stats?.decisions || decisions.length || 0);
    const tradeCount = Number(trades.length || 0);

    const aiRate = metrics?.aiPerMin || 0;
    const memoryMb = metrics?.memMb || 0;

    // Calculate average confidence safely
    const avgConfidence = decisions.length > 0
      ? decisions.reduce((s, d) => s + (d?.confidence || 0), 0) / decisions.length
      : 0;

    return {
      engineStatus: (paperStatus || "OFFLINE").toUpperCase(),
      running: paperStatus === "connected",
      mode: "PAPER",
      ticks,
      decisions: decisionCount,
      trades: tradeCount,
      aiRate,
      memoryMb,
      aiConfidence: avgConfidence,
      volatility: snapshot?.volatility || 0,
    };
  }, [snapshot, metrics, paperStatus, trades, decisions]);

  const engineTone = telemetry.running ? "good" : "bad";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#fff" }}>
      
      {/* HEADER */}
      <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Internal Trading Engine</div>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1 }}>REAL-TIME ENGINE STATUS</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <HeaderPill label="Engine" value={telemetry.engineStatus} tone={engineTone}/>
            <HeaderPill label="Running" value={telemetry.running ? "YES" : "NO"} tone={engineTone}/>
            <HeaderPill label="Trades" value={telemetry.trades}/>
            <HeaderPill label="Decisions" value={telemetry.decisions}/>
            <HeaderPill label="AI Rate" value={`${telemetry.aiRate.toFixed(2)}/min`}/>
            <HeaderPill label="Memory" value={`${telemetry.memoryMb}MB`}/>
            <HeaderPill label="Confidence" value={telemetry.aiConfidence.toFixed(2)}/>
            <HeaderPill label="Volatility" value={`${(telemetry.volatility * 100).toFixed(3)}%`}/>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div className="trading-nav" style={{
        display: "flex",
        gap: 20,
        padding: "12px 22px",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        fontSize: 14
      }}>
        <NavLink to="live" style={({isActive}) => ({ opacity: isActive ? 1 : 0.5, textDecoration: 'none', color: '#fff', borderBottom: isActive ? '2px solid #3b82f6' : 'none', paddingBottom: 4 })}>Live</NavLink>
        <NavLink to="market" style={({isActive}) => ({ opacity: isActive ? 1 : 0.5, textDecoration: 'none', color: '#fff', borderBottom: isActive ? '2px solid #3b82f6' : 'none', paddingBottom: 4 })}>Market</NavLink>
        <NavLink to="control" style={({isActive}) => ({ opacity: isActive ? 1 : 0.5, textDecoration: 'none', color: '#fff', borderBottom: isActive ? '2px solid #3b82f6' : 'none', paddingBottom: 4 })}>AI</NavLink>
        <NavLink to="analytics" style={({isActive}) => ({ opacity: isActive ? 1 : 0.5, textDecoration: 'none', color: '#fff', borderBottom: isActive ? '2px solid #3b82f6' : 'none', paddingBottom: 4 })}>Analytics</NavLink>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {page === "live" && <TradingRoom />}
        {page === "market" && <Market />}
        {page === "control" && <AIControl />}
        {page === "analytics" && <Analytics />}
        
        {/* Fallback redirect */}
        {location.pathname.endsWith("trading") && <Navigate to="live" replace />}
      </div>
    </div>
  );
}

function HeaderPill({ label, value, tone = "info" }) {
  let bg = "rgba(59,130,246,.12)";
  let color = "#94a3b8";
  if (tone === "good") { bg = "rgba(34,197,94,.15)"; color = "#4ade80"; }
  if (tone === "bad") { bg = "rgba(239,68,68,.15)"; color = "#f87171"; }

  return (
    <div style={{ padding: "4px 10px", borderRadius: 6, background: bg, fontSize: 12, border: "1px solid rgba(255,255,255,.03)" }}>
      <span style={{ color, marginRight: 5 }}>{label}</span>
      <b style={{ color: "#f8fafc" }}>{value}</b>
    </div>
  );
}
