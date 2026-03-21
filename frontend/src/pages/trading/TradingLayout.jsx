// ============================================================
// 🔒 PROTECTED CORE FILE — DO NOT MODIFY WITHOUT AUTHORIZATION
// MODULE: Trading Terminal Layout (UI SHELL)
// VERSION: v2.0 (Real-Time Synced)
//
// PURPOSE:
// This file ONLY renders UI using TradingContext.
//
// RULES:
// 1. NO API CALLS here ❌
// 2. NO POLLING ❌
// 3. ONLY consume TradingContext ✅
// 4. UI must reflect REAL engine state only
//
// VIOLATION = FAKE UI / DESYNC
// ============================================================

import React, { useMemo } from "react";
import { NavLink, useLocation, Navigate } from "react-router-dom";

import { useTrading } from "../../context/TradingContext.jsx";

import TradingRoom from "../TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

/* ============================================================
COMPONENT
============================================================ */

export default function TradingLayout() {
  const location = useLocation();
  const page = location.pathname.split("/").pop();

  /* ================= REAL DATA ================= */

  const {
    snapshot,
    metrics,
    marketStatus,
    paperStatus,
    trades,
    decisions
  } = useTrading();

  /* ================= DERIVED ================= */

  const telemetry = useMemo(() => {
    const stats = snapshot?.executionStats || {};

    const ticks = Number(stats?.ticks || 0);
    const decisionCount = Number(stats?.decisions || decisions.length || 0);
    const tradeCount = Number(trades.length || 0);

    const aiRate = metrics?.aiPerMin || 0;
    const memoryMb = metrics?.memMb || 0;

    return {
      engineStatus: paperStatus.toUpperCase(),
      running: paperStatus === "connected",
      mode: "PAPER",
      ticks,
      decisions: decisionCount,
      trades: tradeCount,
      aiRate,
      memoryMb,
      aiConfidence:
        decisions.length > 0
          ? decisions.reduce((s, d) => s + (d?.confidence || 0), 0) / decisions.length
          : 0,
      volatility: snapshot?.volatility || 0,
    };
  }, [snapshot, metrics, paperStatus, trades, decisions]);

  /* ================= TONES ================= */

  const engineTone =
    telemetry.running ? "good" : "bad";

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* HEADER */}

      <div style={{
        padding: "18px 22px",
        borderBottom: "1px solid rgba(255,255,255,.06)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Internal Trading Engine
            </div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              REAL-TIME ENGINE STATUS
            </div>
          </div>

          {/* TELEMETRY */}

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

      <div style={{
        display: "flex",
        gap: 10,
        padding: "12px 22px",
        borderBottom: "1px solid rgba(255,255,255,.05)"
      }}>
        <NavLink to="live">Live</NavLink>
        <NavLink to="market">Market</NavLink>
        <NavLink to="control">AI</NavLink>
        <NavLink to="analytics">Analytics</NavLink>
      </div>

      {/* CONTENT */}

      <div style={{ flex: 1 }}>
        <div style={{ display: page === "live" ? "block" : "none" }}>
          <TradingRoom />
        </div>

        <div style={{ display: page === "market" ? "block" : "none" }}>
          <Market />
        </div>

        <div style={{ display: page === "control" ? "block" : "none" }}>
          <AIControl />
        </div>

        <div style={{ display: page === "analytics" ? "block" : "none" }}>
          <Analytics />
        </div>

        {page === "" && <Navigate to="live" replace />}
      </div>
    </div>
  );
}

/* ============================================================
UI HELPER
============================================================ */

function HeaderPill({ label, value, tone = "info" }) {
  let bg = "rgba(59,130,246,.15)";
  if (tone === "good") bg = "rgba(34,197,94,.15)";
  if (tone === "bad") bg = "rgba(239,68,68,.15)";

  return (
    <div style={{
      padding: "4px 8px",
      borderRadius: 6,
      background: bg
    }}>
      <span style={{ opacity: 0.7 }}>{label}</span>{" "}
      <b>{value}</b>
    </div>
  );
}
